<script setup>
import { postHref, pad } from "../lib/content";
defineProps({ chapters: Array, currentSlug: String, compact: Boolean });
</script>
<template>
  <nav aria-label="Series chapters" :class="compact ? 'space-y-1' : 'space-y-2'">
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
