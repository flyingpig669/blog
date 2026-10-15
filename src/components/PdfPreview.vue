<script setup>
import { ref, shallowRef, watch, nextTick, onMounted, onUnmounted } from "vue";
import { ensureViewer } from "../lib/viewer";
import { safeUrl, pad } from "../lib/content";
const props = defineProps({
  url: String,
  title: String,
  source: String,
  format: { type: String, default: "PDF" },
});
const opened = ref(false),
  loading = ref(false),
  error = ref(""),
  page = ref(1),
  pages = ref(0),
  zoom = ref(1),
  present = ref(false);
const root = ref(null),
  stage = ref(null),
  canvas = ref(null);
let pdf,
  loadTask,
  renderTask,
  observer,
  disposed = false,
  renderRevision = 0;
async function open() {
  if (loading.value || opened.value) return;
  loading.value = true;
  error.value = "";
  try {
    await ensureViewer();
    if (disposed) return;
    const library = window.pdfjsLib;
    library.GlobalWorkerOptions.workerSrc = "vendor/pdfjs/pdf.worker.min.js";
    loadTask = library.getDocument(safeUrl(props.url));
    pdf = await loadTask.promise;
    if (disposed) {
      pdf.destroy();
      return;
    }
    pages.value = pdf.numPages;
    opened.value = true;
    await nextTick();
    root.value?.focus();
    observer = new ResizeObserver(() => draw());
    observer.observe(stage.value);
    await draw();
  } catch (cause) {
    if (!disposed) {
      loadTask?.destroy();
      loadTask = null;
      error.value = "预览加载失败，请重试或下载文件。";
    }
  } finally {
    if (!disposed) loading.value = false;
  }
}
async function draw() {
  if (!pdf || !canvas.value || disposed) return;
  const revision = ++renderRevision;
  try {
    const documentPage = await pdf.getPage(page.value);
    if (revision !== renderRevision || disposed) return;
    if (renderTask) {
      renderTask.cancel();
      try {
        await renderTask.promise;
      } catch {}
    }
    if (revision !== renderRevision || disposed) return;
    const viewport = documentPage.getViewport({ scale: 1 });
    const width = Math.max(100, stage.value.clientWidth - 32);
    const height = present.value
      ? innerHeight - 100
      : props.format === "Word"
        ? 620
        : 440;
    const scale =
      Math.min(width / viewport.width, height / viewport.height) * zoom.value;
    const fitted = documentPage.getViewport({ scale });
    const density = Math.min(devicePixelRatio || 1, 2);
    canvas.value.width = Math.floor(fitted.width * density);
    canvas.value.height = Math.floor(fitted.height * density);
    canvas.value.style.width = fitted.width + "px";
    canvas.value.style.height = fitted.height + "px";
    renderTask = documentPage.render({
      canvasContext: canvas.value.getContext("2d"),
      viewport: fitted,
      transform: [density, 0, 0, density, 0, 0],
    });
    await renderTask.promise;
  } catch (cause) {
    if (!disposed && cause.name !== "RenderingCancelledException")
      error.value = "页面渲染失败，请重试。";
  }
}
function turn(delta) {
  page.value = Math.max(1, Math.min(pages.value, page.value + delta));
}
function key(event) {
  if (event.key === "Escape") {
    present.value = false;
    return;
  }
  if (["ArrowRight", "ArrowDown", "Enter", " "].includes(event.key)) {
    event.preventDefault();
    turn(1);
  }
  if (["ArrowLeft", "ArrowUp"].includes(event.key)) {
    event.preventDefault();
    turn(-1);
  }
  if (event.key === "+") zoom.value = Math.min(3, zoom.value + 0.15);
  if (event.key === "-") zoom.value = Math.max(0.4, zoom.value - 0.15);
}
function globalKey(event) {
  if (present.value) key(event);
}
watch([page, zoom, present], () => nextTick(draw));
watch(present, (value) => {
  document.body.style.overflow = value ? "hidden" : "";
});
onMounted(() => document.addEventListener("keydown", globalKey));
onUnmounted(() => {
  disposed = true;
  renderRevision++;
  observer?.disconnect();
  renderTask?.cancel();
  loadTask?.destroy();
  if (present.value) document.body.style.overflow = "";
  document.removeEventListener("keydown", globalKey);
});
</script>
<template>
  <div class="my-8" data-preview-control>
    <div v-if="!opened" class="linear-card p-4">
      <h3 class="text-[15px] font-semibold text-primary mb-3">
        {{ title || format }}
      </h3>
      <p v-if="error" role="status" class="text-[13px] text-secondary mb-3">
        {{ error }}
      </p>
      <div class="flex flex-wrap items-center gap-3">
        <button class="btn-secondary" :disabled="loading" @click="open">
          {{
            loading ? "正在加载…" : error ? "重试预览" : "预览 " + format
          }}</button
        ><a
          v-if="source"
          :href="safeUrl(source)"
          download
          class="text-[13px] text-secondary hover:text-accent"
          >下载原文件</a
        ><a
          :href="safeUrl(url)"
          download
          class="text-[13px] text-secondary hover:text-accent"
          >下载 PDF</a
        >
      </div>
    </div>
    <Teleport v-else to="body" :disabled="!present"
      ><div
        ref="root"
        tabindex="0"
        class="slide-player-root border border-subtle rounded-xl overflow-hidden bg-page"
        :class="{ 'theater-presentation-mode': present }"
        :role="present ? 'dialog' : undefined"
        :aria-modal="present ? 'true' : undefined"
        :aria-label="present ? title : undefined"
        @keydown.stop="key"
      >
        <div
          class="slide-player-header flex flex-wrap gap-y-2 justify-between items-center px-3 py-2.5"
        >
          <div class="flex gap-2 items-center w-full sm:w-auto min-w-0">
            <span class="font-mono text-[10px] text-accent shrink-0">{{
              format === "Word" ? "WORD" : "SLIDE DECK"
            }}</span
            ><span class="truncate text-[13px] text-primary">{{ title }}</span>
          </div>
          <div class="flex items-center gap-2 font-mono text-[12px]">
            <button
              class="btn-secondary"
              aria-label="上一页"
              :disabled="page === 1"
              @click="turn(-1)"
            >
              ‹</button
            ><span>{{ pad(page) }} / {{ pad(pages) }}</span
            ><button
              class="btn-secondary"
              aria-label="下一页"
              :disabled="page === pages"
              @click="turn(1)"
            >
              ›
            </button>
          </div>
          <div class="flex gap-2 items-center text-[12px]">
            <button
              aria-label="缩小"
              class="text-secondary"
              @click="zoom = Math.max(0.4, zoom - 0.15)"
            >
              −</button
            ><button
              aria-label="放大"
              class="text-secondary"
              @click="zoom = Math.min(3, zoom + 0.15)"
            >
              ＋</button
            ><button class="btn-secondary" @click="present = true">
              Present</button
            ><a
              :href="safeUrl(url)"
              download
              aria-label="下载PDF"
              class="text-secondary"
              >↓</a
            >
          </div>
        </div>
        <div
          ref="stage"
          class="relative flex flex-1 items-center justify-center overflow-auto p-4 min-h-[360px]"
        >
          <canvas ref="canvas" class="slide-canvas" @click="present = true" />
          <p v-if="error" role="status">{{ error }}</p>
        </div>
        <div
          v-if="present"
          class="flex justify-center items-center gap-4 pb-5 font-mono text-[13px]"
        >
          <button class="btn-secondary" aria-label="上一页" @click="turn(-1)">
            ←</button
          ><span>{{ page }} / {{ pages }}</span
          ><button class="btn-secondary" aria-label="下一页" @click="turn(1)">
            →</button
          ><button class="btn-secondary" @click="present = false">
            Exit (ESC)
          </button>
        </div>
      </div></Teleport
    >
  </div>
</template>
