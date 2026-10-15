<script setup>
import { postHref, columnHref } from "../lib/content";
defineProps({ navigation: Object });
</script>
<template>
  <div class="mt-10 border-t border-divider pt-6">
    <a
      v-if="navigation.columnInfo"
      :href="columnHref(navigation.columnInfo)"
      class="font-mono text-[12px] text-accent"
      >All {{ navigation.totalParts }} Chapters →</a
    >
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
      <a
        v-if="navigation.prevPost"
        :href="postHref(navigation.prevPost)"
        class="linear-card p-4"
        ><span class="font-mono text-[11px] text-muted">{{
          navigation.prevLabel
        }}</span>
        <p class="text-primary text-[14px] mt-2">
          {{ navigation.prevPost.title }}
        </p></a
      ><span v-else class="font-mono text-[11px] text-muted p-4"
        >No earlier articles.</span
      ><a
        v-if="navigation.nextPost"
        :href="postHref(navigation.nextPost)"
        class="linear-card p-4"
        ><span class="font-mono text-[11px] text-muted">{{
          navigation.nextLabel
        }}</span>
        <p class="text-primary text-[14px] mt-2">
          {{ navigation.nextPost.title }}
        </p></a
      ><span v-else class="font-mono text-[11px] text-muted p-4"
        >No later articles.</span
      >
    </div>
  </div>
</template>
