<script setup>
import { computed, ref, watch, nextTick, onBeforeUnmount } from 'vue';
import { ensureViewer } from '../lib/viewer';
import { safeUrl } from '../lib/content';
import { fileSize } from '../lib/attachments.js';
import { pdfLayout, previewFileName } from '../lib/pdf-layout.js';
import { trapDialogFocus } from '../lib/focus';
import { useVisualViewport } from '../composables/useVisualViewport';
import PdfControls from './PdfControls.vue';
import { usePreviewChrome } from '../composables/usePreviewChrome';
import PreviewDownloads from './PreviewDownloads.vue';

const props = defineProps({
  url: String, title: String, source: String, size: Number,
  format: { type: String, default: 'PDF' },
});
const displayName = computed(() => props.title || previewFileName(props.source || props.url) || '文档');
const viewportStyle = useVisualViewport();
const opened = ref(false), loading = ref(false), rendering = ref(false), canvasReady = ref(false);
const loadError = ref(''), renderError = ref('');
const page = ref(1), pages = ref(0), zoom = ref(1), present = ref(false);
const root = ref(null), stage = ref(null), canvas = ref(null), openButton = ref(null);
const chrome = usePreviewChrome(root);
let pdf, loadTask, renderTask, observer, frame, previousOverflow, previousFocus;
let disposed = false, documentRevision = 0, renderRevision = 0, observedWidth = 0, observedHeight = 0;

function releaseDocument() {
  renderRevision++;
  cancelAnimationFrame(frame);
  observer?.disconnect();
  observer = null;
  renderTask?.cancel();
  renderTask = null;
  const closing = loadTask ? loadTask.destroy() : pdf?.destroy();
  closing?.catch(() => {});
  loadTask = null;
  pdf = null;
}
function unlock() {
  if (previousOverflow !== undefined) {
    document.body.style.overflow = previousOverflow;
    previousOverflow = undefined;
  }
}
// 预览接管画面时通知页面：底部移动端阅读栏需让位（见 main.css body.preview-open）
function markOpenState(open) {
  if (typeof document === 'undefined') return;
  document.body.classList.toggle('preview-open', open);
}
function close() {
  documentRevision++;
  present.value = false;
  markOpenState(false);
  releaseDocument();
  opened.value = loading.value = rendering.value = canvasReady.value = false;
  loadError.value = renderError.value = '';
  page.value = 1;
  pages.value = 0;
  zoom.value = 1;
  nextTick(() => { if (!disposed) openButton.value?.focus({ preventScroll: true }); });
}
async function open() {
  if (loading.value || opened.value) return;
  const revision = ++documentRevision;
  loading.value = true;
  loadError.value = '';
  try {
    const library = await ensureViewer();
    if (disposed || revision !== documentRevision) return;
    library.GlobalWorkerOptions.workerSrc = 'vendor/pdfjs/pdf.worker.min.js';
    const task = library.getDocument(safeUrl(props.url));
    loadTask = task;
    const loaded = await task.promise;
    if (disposed || revision !== documentRevision) { loaded.destroy().catch(() => {}); return; }
    pdf = loaded;
    pages.value = pdf.numPages;
    opened.value = true;
    markOpenState(true);
    await nextTick();
    if (disposed || revision !== documentRevision) return;
    root.value?.focus({ preventScroll: true });
    observedWidth = stage.value.clientWidth;
    observedHeight = 0;
    observer = new ResizeObserver(() => {
      const width = stage.value?.clientWidth, height = present.value ? stage.value?.clientHeight : 0;
      // Inline height follows the page; only width changes need another render.
      if (width === observedWidth && height === observedHeight) return;
      observedWidth = width;
      observedHeight = height;
      queueDraw();
    });
    observer.observe(stage.value);
    await draw();
    chrome.reveal();
  } catch {
    if (!disposed && revision === documentRevision) {
      releaseDocument();
      loadError.value = '文档加载失败，请重试或下载文件。';
    }
  } finally {
    if (!disposed && revision === documentRevision) loading.value = false;
  }
}
function queueDraw() {
  if (!pdf || disposed) return;
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(draw);
}
async function draw() {
  if (!pdf || !canvas.value || !stage.value || disposed) return;
  const revision = ++renderRevision, currentDocument = pdf;
  rendering.value = true;
  renderError.value = '';
  try {
    const documentPage = await currentDocument.getPage(page.value);
    if (revision !== renderRevision || disposed) return;
    if (renderTask) {
      renderTask.cancel();
      try { await renderTask.promise; } catch {}
    }
    if (revision !== renderRevision || disposed) return;
    const viewport = documentPage.getViewport({ scale: 1 });
    const style = getComputedStyle(stage.value);
    const horizontalPadding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
    const verticalPadding = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
    const layout = pdfLayout({
      pageWidth: viewport.width, pageHeight: viewport.height,
      width: stage.value.clientWidth - horizontalPadding,
      height: stage.value.clientHeight - verticalPadding,
      fullscreen: present.value, zoom: zoom.value, pixelRatio: devicePixelRatio || 1,
    });
    const fitted = documentPage.getViewport({ scale: layout.scale });
    canvas.value.width = Math.max(1, Math.floor(fitted.width * layout.density));
    canvas.value.height = Math.max(1, Math.floor(fitted.height * layout.density));
    canvas.value.style.width = fitted.width + 'px';
    canvas.value.style.height = fitted.height + 'px';
    renderTask = documentPage.render({
      canvasContext: canvas.value.getContext('2d'), viewport: fitted,
      transform: [layout.density, 0, 0, layout.density, 0, 0],
    });
    await renderTask.promise;
    if (revision === renderRevision && !disposed) canvasReady.value = true;
  } catch (cause) {
    if (!disposed && revision === renderRevision && cause.name !== 'RenderingCancelledException') {
      canvasReady.value = false;
      renderError.value = '这一页未能显示，请重试或下载文件。';
    }
  } finally {
    if (!disposed && revision === renderRevision) rendering.value = false;
  }
}
function turn(delta) {
  page.value = Math.max(1, Math.min(pages.value, page.value + delta));
  if (stage.value) stage.value.scrollTo({ top: 0, left: 0, behavior: 'instant' });
}
function resetZoom() {
  zoom.value = 1;
  stage.value?.scrollTo({ top: 0, left: 0, behavior: 'instant' });
}
function key(event) {
  chrome.reveal();
  if (present.value) trapDialogFocus(event, root.value);
  if (event.key === 'Escape') { event.preventDefault(); if (present.value) present.value = false; else close(); return; }
  if (event.target.closest('button,a,input,select') || event.metaKey || event.ctrlKey || event.altKey) return;
  if (['ArrowRight', 'PageDown'].includes(event.key) || present.value && ['ArrowDown', 'Enter', ' '].includes(event.key)) {
    event.preventDefault(); turn(1);
  }
  if (['ArrowLeft', 'PageUp'].includes(event.key) || present.value && event.key === 'ArrowUp') {
    event.preventDefault(); turn(-1);
  }
  if (event.key === '+') { event.preventDefault(); zoom.value = Math.min(3, zoom.value + 0.15); }
  if (event.key === '-') { event.preventDefault(); zoom.value = Math.max(0.4, zoom.value - 0.15); }
  if (event.key.toLowerCase() === 'f') { event.preventDefault(); present.value = !present.value; }
}
watch([page, zoom, present], () => nextTick(queueDraw));
watch(present, async value => {
  zoom.value = 1;
  chrome.reveal();
  if (value) {
    previousFocus = document.activeElement;
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  } else unlock();
  await nextTick();
  if (disposed) return;
  if (value) root.value?.focus({ preventScroll: true });
  else if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
});
watch(() => [props.url, props.source], close);
onBeforeUnmount(() => {
  disposed = true;
  documentRevision++;
  markOpenState(false);
  releaseDocument();
  unlock();
});
</script>

<template>
  <section class="document-preview" data-preview-control :aria-label="'文档预览：' + displayName">
    <div v-if="!opened" class="document-preview-card">
      <div class="preview-placeholder">
        <svg class="preview-document-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M8 13h8M8 17h6" /></svg>
        <div class="preview-file-info">
          <div class="preview-label">文档预览 <span class="preview-format">{{ format }}</span></div>
          <div class="preview-file-name">{{ displayName }}</div>
          <div v-if="size !== undefined || source" class="preview-file-meta">
            <span v-if="size !== undefined">{{ fileSize(size) }}</span><span v-if="source">转换为 PDF 展示</span>
          </div>
        </div>
      </div>
      <div v-if="loadError" class="preview-error" role="alert">{{ loadError }}</div>
      <div class="preview-actions">
        <button ref="openButton" type="button" class="btn-secondary" :disabled="loading" @click="open">{{ loading ? '正在加载…' : loadError ? '重试预览' : '预览 ' + format }}</button>
        <button v-if="loading" type="button" class="preview-link" @click="close">取消加载</button>
        <PreviewDownloads :url="url" :source="source" />
      </div>
    </div>
    <Teleport v-else to="body" :disabled="!present">
      <div ref="root" tabindex="0" class="document-preview document-viewer slide-player-root" :class="{ 'theater-presentation-mode': present, 'preview-chrome-visible': chrome.visible.value, 'slide-cursor-hidden': present && !chrome.visible.value }" :style="present ? viewportStyle : undefined" :role="present ? 'dialog' : undefined" :aria-modal="present ? 'true' : undefined" :aria-label="displayName" @keydown.stop="key" @pointermove="chrome.pointer" @pointerdown="chrome.touch" @pointerleave="chrome.hide" @focusin="chrome.reveal" @focusout="chrome.hide">
        <div class="preview-overlay preview-overlay-top">
          <div class="preview-heading-row">
            <span class="preview-format">{{ format }}</span><span class="preview-viewer-title" :title="displayName">{{ displayName }}</span>
            <button type="button" class="preview-tool" aria-label="收起预览" title="收起预览 · Esc" @click="close"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m6 6 12 12M18 6 6 18" /></svg></button>
          </div>
        </div>
        <div ref="stage" class="pdf-stage" :class="{ 'is-rendering': rendering }" :aria-busy="rendering">
          <canvas v-show="canvasReady && !renderError" ref="canvas" class="slide-canvas" role="img" :aria-label="displayName + '，第 ' + page + ' 页'" />
          <div v-if="rendering" class="preview-render-status" role="status">正在显示第 {{ page }} 页…</div>
          <div v-if="renderError" class="preview-error preview-page-error" role="alert">{{ renderError }} <button type="button" class="btn-secondary" @click="queueDraw">重试这一页</button></div>
        </div>
        <button type="button" class="pdf-turn pdf-turn-prev" :disabled="page <= 1" aria-label="上一页" title="上一页 · ←" @click="turn(-1)"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m14 6-6 6 6 6" /></svg></button>
        <button type="button" class="pdf-turn pdf-turn-next" :disabled="page >= pages" aria-label="下一页" title="下一页 · →" @click="turn(1)"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m10 6 6 6-6 6" /></svg></button>
        <div class="preview-overlay preview-overlay-bottom">
          <PdfControls :page="page" :pages="pages" :zoom="zoom" :url="url" :source="source" :present="present" @zoom="zoom = $event" @reset="resetZoom" @present="present = !present" />
        </div>
      </div>
    </Teleport>
  </section>
</template>
