<script setup>
import { ref, nextTick } from "vue";
import MarkdownBody from "./MarkdownBody.vue";
import Attachments from "./Attachments.vue";
import { decorateIndex } from "../lib/index-content";
import UpdatedAt from './UpdatedAt.vue';
defineProps({ document: Object });
const root = ref(null),
  outline = ref([]),
  count = ref(0);
async function enhance(items) {
  outline.value = items.filter((item) => item.level === 2);
  await nextTick();
  const content = root.value?.querySelector(".markdown-body");
  if (!content) return;
  count.value = decorateIndex(content);
}
function scroll(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}
</script>
<template>
  <div
    ref="root"
    class="shell mx-auto px-4 sm:px-6 pt-16 md:pt-20 pb-20 index-page"
  >
    <header class="mb-10 pb-6 border-b border-divider">
      <div class="index-eyebrow flex-wrap">INDEX / <time :datetime="document.date">{{ document.date }}</time><UpdatedAt :value="document.updated" /></div>
      <h1 class="text-[32px] sm:text-[36px] font-bold mb-2">
        {{ document.title }}
      </h1>
      <p class="text-secondary text-[16px]">{{ document.excerpt }}</p>
      <div class="index-summary">
        <span>{{ outline.length }} SECTIONS</span><span>{{ count }} LINKS</span>
      </div>
    </header>
    <nav aria-label="索引分组" class="tag-cloud mb-8">
      <button
        v-for="item in outline"
        :key="item.id"
        class="tag-pill"
        @click="scroll(item.id)"
      >
        {{ item.text }}
      </button>
    </nav>
    <MarkdownBody
      class="index-content"
      :content="document.content"
      :source-path="document.sourcePath"
      :toc-levels="[2, 3]"
      @outline="enhance"
    /><Attachments :document="document" />
  </div>
</template>
