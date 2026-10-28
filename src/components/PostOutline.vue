<script setup>
import { ref, onMounted, onUnmounted, watch } from "vue";
import { useRoute } from "vue-router";
import { columnHref } from "../lib/content";
import ExpandableEntry from './ExpandableEntry.vue';
import SeriesChapters from "./SeriesChapters.vue";
import MobileDrawer from './MobileDrawer.vue';
const props = defineProps({ toc: Array, navigation: Object, post: Object });
const route = useRoute();
const mobile = ref(false),
  active = ref("");
const mobileChapters=ref(null);
const desktopChapters=ref(null);
defineExpose({expanded:mobile,open:() => { mobile.value=true; }});
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
    if (window.scrollY > 0 && window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4)
      selected = props.toc?.at(-1)?.id || selected;
    active.value = selected;
  });
}
watch(
  () => route.fullPath,
  () => {
    mobile.value = false;
  },
);
onMounted(() => {
  window.addEventListener("scroll", track, { passive: true });
  track();
});
onUnmounted(() => {
  window.removeEventListener("scroll", track);
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
        <span>系列章节</span
        ><a :href="columnHref(navigation.columnInfo)">全部 →</a>
      </div>
      <ExpandableEntry title="章节目录" expandable initially-expanded title-class="text-[11px] text-secondary" @update:expanded="value=>value && desktopChapters?.locate()"><div class="max-h-[190px] overflow-y-auto mt-2">
        <SeriesChapters ref="desktopChapters" :chapters="navigation.colPosts" :current-slug="post.slug" compact />
      </div></ExpandableEntry>
    </div>
    <div v-if="toc?.length">
      <div class="text-muted text-[11px] mb-2">本文目录</div>
      <nav
        id="desktop-outline-nav"
        aria-label="本文目录"
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
  <MobileDrawer id="mobile-outline-drawer" variant="outline" title="阅读目录" :open="mobile" @close="mobile = false" @opened="mobileChapters?.locate()">
      <div v-if="navigation.columnInfo && navigation.colPosts.length > 1" class="mb-6">
        <div class="mobile-outline-label">系列章节</div>
        <SeriesChapters ref="mobileChapters" :chapters="navigation.colPosts" :current-slug="post.slug" />
      </div>
      <nav v-if="toc?.length" aria-label="本文目录">
        <div class="mobile-outline-label">本文目录</div>
        <button
          v-for="item in toc"
          :key="item.id"
          class="outline-nav-btn mobile-outline-item"
          :class="{ active: active === item.id, 'is-nested': item.level > 2 }"
          :aria-current="active === item.id ? 'location' : undefined"
          @click="scrollTo(item.id)"
        >
          {{ item.text }}
        </button>
      </nav>
  </MobileDrawer>
</template>
