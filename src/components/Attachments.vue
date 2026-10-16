<script setup>
import { computed } from 'vue';
import { safeUrl } from '../lib/content';
import { fileKind,fileSize } from '../lib/attachments.js';
import PdfPreview from './PdfPreview.vue';
const props=defineProps({document:Object});
const resources=computed(()=>[...new Set([...(props.document.attachments || []),...Object.keys(props.document.attachmentPreviews || {})])].filter(file=>file!==props.document.slide).map(file=>({file,kind:fileKind(file),size:props.document.attachmentInfo?.[file]?.size,url:props.document.attachmentPreviews?.[file] || (fileKind(file)==='PDF' ? file : null)})));
function name(file) { try { return decodeURIComponent(file.split('/').pop()); } catch { return file.split('/').pop(); } }
</script>
<template>
  <section v-if="resources.length" class="mb-12">
    <h2 class="text-[15px] font-semibold text-primary mb-3">附件 <span class="font-mono text-muted text-[12px]">{{ resources.length }}</span></h2>
    <template v-for="resource in resources" :key="resource.file">
      <PdfPreview v-if="resource.url" :url="resource.url" :source="resource.kind==='PDF' ? undefined : resource.file" :title="name(resource.file)" :format="resource.kind" :size="resource.size" />
      <div v-else class="attachment-row">
        <div class="min-w-0"><p class="text-primary text-[13px] break-all">{{ name(resource.file) }}</p><span class="font-mono text-[11px] text-muted">{{ resource.kind }} · {{ fileSize(resource.size) }}</span></div>
        <div class="flex gap-3 shrink-0"><a v-if="['图片','音频','视频'].includes(resource.kind)" :href="safeUrl(resource.file)" target="_blank" rel="noopener noreferrer" class="text-accent text-[12px]">查看</a><a :href="safeUrl(resource.file)" download class="text-accent text-[12px]">下载</a></div>
      </div>
    </template>
  </section>
</template>
