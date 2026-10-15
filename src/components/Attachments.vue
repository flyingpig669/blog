<script setup>
import { computed } from "vue";
import { safeUrl } from "../lib/content";
import PdfPreview from "./PdfPreview.vue";
const props = defineProps({ document: Object });
const previews = computed(() =>
  Object.entries(props.document.attachmentPreviews || {}),
);
</script>
<template>
  <section
    v-if="document.attachments?.length"
    class="mb-12 p-4 rounded-xl bg-surface border border-subtle"
  >
    <h2 class="text-[11px] font-mono text-muted mb-3">
      Attachments ({{ document.attachments.length }})
    </h2>
    <div class="space-y-2">
      <a
        v-for="file in document.attachments"
        :key="file"
        :href="safeUrl(file)"
        download
        class="flex gap-2 text-[13px] text-secondary hover:text-accent"
        ><span class="font-mono text-accent">↓</span
        ><span>{{ file.split("/").pop() }}</span></a
      >
    </div>
  </section>
  <PdfPreview
    v-for="[file, url] in previews"
    :key="url"
    :url="url"
    :source="file"
    :title="file.split('/').pop()"
    :format="/\.pptx?(?:[?#]|$)/i.test(file) ? 'PPT' : 'Word'"
  />
</template>
