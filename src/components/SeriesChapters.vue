<script setup>
import { ref,onMounted,watch,nextTick } from 'vue';
import { postHref, pad } from "../lib/content";
const props = defineProps({ chapters: Array, currentSlug: String, compact: Boolean });
const root=ref(null);
async function locate() { await nextTick(); const link=root.value?.querySelector('[aria-current=page]'); const list=props.compact ? root.value?.parentElement : root.value?.closest('#mobile-outline-drawer'); if (link && list && list.scrollHeight>list.clientHeight) list.scrollTop=Math.max(0,link.offsetTop-list.offsetTop-list.clientHeight/2+link.offsetHeight/2); }
onMounted(locate);watch(()=>props.currentSlug,locate);
defineExpose({locate});
</script>
<template>
  <nav ref="root" aria-label="Series chapters" :class="compact ? 'space-y-1' : 'space-y-2'">
    <a
      v-for="(chapter, index) in chapters"
      :key="chapter.slug"
      :href="postHref(chapter)"
      :aria-current="chapter.slug === currentSlug ? 'page' : undefined"
      class="block font-mono"
      :class="[
        compact ? 'text-[11px] truncate py-1' : 'text-[12px]',
        chapter.slug === currentSlug ? 'text-accent' : 'text-secondary',
      ]"
    ><span class="mr-2">{{ pad(chapter.order ?? index + 1) }}</span>{{ chapter.title }}</a>
  </nav>
</template>
