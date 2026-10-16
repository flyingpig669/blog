<script setup>
import { ref, onMounted, onUnmounted, watch } from "vue";
import { useRoute } from "vue-router";
import { columnHref } from "../lib/content";
import SeriesChapters from "./SeriesChapters.vue";
const props = defineProps({ toc: Array, navigation: Object, post: Object });
const route = useRoute();
const mobile = ref(false),
  active = ref("");
let frame;
function scrollTo(id) {
  document
    .getElementById(id)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
  active.value = id;
  mobile.value = false;
}
function track() {
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(() => {
    let selected = props.toc?.[0]?.id || "";
    for (const item of props.toc || [])
      if (document.getElementById(item.id)?.getBoundingClientRect().top <= 110)
        selected = item.id;
    active.value = selected;
  });
}
function key(event) {
  if (event.key === "Escape") mobile.value = false;
}
watch(
  () => route.fullPath,
  () => {
    mobile.value = false;
  },
);
onMounted(() => {
  window.addEventListener("scroll", track, { passive: true });
  document.addEventListener("keydown", key);
  track();
});
onUnmounted(() => {
  window.removeEventListener("scroll", track);
  document.removeEventListener("keydown", key);
  cancelAnimationFrame(frame);
});
</script>
<template>
  <aside
    class="outline-floating-sidebar w-[200px] lg:w-[230px] shrink-0 sticky top-20 font-mono text-[12px]"
  >
    <div
      v-if="navigation.columnInfo && navigation.colPosts.length > 1"
      class="mb-5 pb-4 border-b border-divider"
    >
      <div class="flex justify-between text-[11px] text-accent mb-2">
        <span>Series Chapters</span
        ><a :href="columnHref(navigation.columnInfo)">Index →</a>
      </div>
      <div class="max-h-[190px] overflow-y-auto">
        <SeriesChapters :chapters="navigation.colPosts" :current-slug="post.slug" compact />
      </div>
    </div>
    <div v-if="toc?.length">
      <div class="text-muted text-[11px] mb-2">On this page</div>
      <nav
        id="desktop-outline-nav"
        aria-label="On this page"
        class="border-l border-subtle pl-2.5 max-h-[calc(100vh-280px)] overflow-y-auto"
      >
        <button
          v-for="item in toc"
          :key="item.id"
          :data-outline-target="item.id"
          class="outline-nav-btn block text-left w-full truncate py-1 text-secondary"
          :class="{ active: active === item.id, 'pl-2': item.level > 2 }"
          @click="scrollTo(item.id)"
        >
          {{ item.text }}
        </button>
      </nav>
    </div>
  </aside>
  <div class="outline-floating-fab fixed">
    <button
      class="fixed right-5 bottom-20 z-40 btn-secondary font-mono text-[12px]"
      aria-controls="mobile-outline-drawer"
      :aria-expanded="mobile"
      @click="mobile = !mobile"
    >
      # Outline
    </button>
    <div
      id="mobile-outline-drawer"
      :hidden="!mobile"
      class="fixed top-14 bottom-0 right-0 w-[280px] max-w-[85vw] bg-page border-l border-subtle z-50 p-5 overflow-y-auto"
    >
      <div class="flex justify-between mb-4">
        <span class="font-mono text-[12px] text-muted">Outline & Chapters</span
        ><button aria-label="关闭目录" @click="mobile = false">✕</button>
      </div>
      <div v-if="navigation.columnInfo" class="mb-6">
        <SeriesChapters :chapters="navigation.colPosts" :current-slug="post.slug" />
      </div>
      <nav aria-label="Page outline">
        <button
          v-for="item in toc"
          :key="item.id"
          class="outline-nav-btn block text-left w-full py-1 text-[12px] text-secondary"
          :class="{ active: active === item.id }"
          @click="scrollTo(item.id)"
        >
          {{ item.text }}
        </button>
      </nav>
    </div>
  </div>
</template>
