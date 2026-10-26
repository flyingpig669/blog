<script setup>
import { safeUrl } from '../lib/content';
defineProps({ url: String, source: String, compact: Boolean });
</script>

<template>
  <div class="preview-downloads">
    <a v-if="source" :href="safeUrl(source)" download class="preview-link" aria-label="下载原文件">{{ compact ? '原文件' : '下载原文件' }}</a>
    <a :href="safeUrl(url)" download class="preview-link" aria-label="下载 PDF"><svg v-if="compact" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4" /></svg>{{ compact ? 'PDF' : '下载 PDF' }}</a>
  </div>
</template>
