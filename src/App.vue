<script setup>
import { computed, ref, watch, onMounted, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import { activeModule, features } from "./lib/content";
import Navbar from "./components/Navbar.vue";
import Footer from "./components/Footer.vue";
import SearchModal from "./components/SearchModal.vue";
const route = useRoute();
const active = computed(() => activeModule(route)),
  search = ref(false),
  progress = ref(0);
let frame;
function key(event) {
  if (
    features.searchModal !== false &&
    (event.metaKey || event.ctrlKey) &&
    event.key === "k"
  ) {
    event.preventDefault();
    search.value = !search.value;
  }
  if (event.key === "Escape") search.value = false;
}
function scroll() {
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(() => {
    const height = document.documentElement.scrollHeight - innerHeight;
    progress.value =
      height > 0 ? Math.min(100, Math.max(0, (scrollY / height) * 100)) : 0;
  });
}
watch(
  () => route.fullPath,
  () => {
    search.value = false;
    progress.value = 0;
  },
);
onMounted(() => {
  document.addEventListener("keydown", key);
  window.addEventListener("scroll", scroll, { passive: true });
});
onUnmounted(() => {
  document.removeEventListener("keydown", key);
  window.removeEventListener("scroll", scroll);
  cancelAnimationFrame(frame);
});
</script>
<template>
  <div
    class="fixed inset-0 pointer-events-none subtle-grid-bg z-0 opacity-40"
  ></div>
  <div
    v-if="features.readingProgress !== false && route.meta.view === 'post'"
    id="reading-progress-container"
    class="fixed top-0 left-0 w-full h-[2px] z-50"
  >
    <div
      id="reading-progress-bar"
      class="h-full bg-accent"
      :style="{ width: progress + '%' }"
    ></div>
  </div>
  <Navbar
    :inert="search"
    :active="active"
    :route-key="route.fullPath"
    @search="search = true"
  />
  <main id="app-main" :inert="search" class="flex-grow w-full relative z-10">
    <RouterView />
  </main>
  <Footer :inert="search" /><SearchModal
    :open="search"
    @close="search = false"
  />
</template>
