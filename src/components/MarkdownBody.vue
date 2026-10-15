<script setup>
import { ref, watch, nextTick, onBeforeUnmount, h, render } from "vue";
import { features } from "../lib/content";
import PdfPreview from "./PdfPreview.vue";
const props = defineProps({
  content: String,
  sourcePath: String,
  tocLevels: Array,
  primaryPdf: String,
});
const emit = defineEmits(["outline"]);
const root = ref(null),
  html = ref("");
let revision = 0;
const mounts = new Set();
function cleanup() {
  for (const mount of mounts) render(null, mount);
  mounts.clear();
}
async function update() {
  const current = ++revision;
  cleanup();
  if (features.mathKaTeX !== false && window.BlogKatex)
    await window.BlogKatex.ensure(props.content || "");
  if (current !== revision) return;
  const result = window.BlogMarkdown.render(props.content || "", {
    sourcePath: props.sourcePath,
    tocLevels: props.tocLevels ?? features.tocLevels,
  });
  html.value = result.html;
  emit("outline", result.toc || []);
  await nextTick();
  if (current !== revision || !root.value) return;
  root.value
    .querySelectorAll(".article-slide-player-mount")
    .forEach((mount) => {
      const url = mount.getAttribute("data-slide-url");
      if (url === props.primaryPdf) {
        mount.remove();
        return;
      }
      render(
        h(PdfPreview, { url, title: mount.getAttribute("data-slide-title") }),
        mount,
      );
      mounts.add(mount);
    });
}
watch(() => [props.content, props.sourcePath, props.tocLevels], update, {
  immediate: true,
});
async function click(event) {
  const code = event.target.closest("[data-code]");
  const heading = event.target.closest("[data-copy-heading]");
  if (!code && !heading) return;
  const text = code
    ? decodeURIComponent(code.getAttribute("data-code"))
    : (() => {
        const url = new URL(location.href);
        const [path, query = ""] = url.hash.slice(1).split("?");
        const params = new URLSearchParams(query);
        params.set("heading", heading.getAttribute("data-copy-heading"));
        url.hash = path + "?" + params;
        return url.href;
      })();
  try {
    await navigator.clipboard.writeText(text);
    (code || heading).setAttribute("aria-label", "已复制");
  } catch {
    (code || heading).setAttribute("aria-label", "复制失败");
  }
}
onBeforeUnmount(() => {
  revision++;
  cleanup();
});
</script>
<template>
  <article ref="root" class="markdown-body" @click="click" v-html="html" />
</template>
