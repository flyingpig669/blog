<script setup>
import { pad, safeUrl } from '../lib/content';
defineProps({ page: Number, pages: Number, zoom: Number, present: Boolean, url: String });
defineEmits(['turn', 'zoom', 'present']);
</script>

<template>
  <div class="pdf-controls" role="group" aria-label="PDF 播放控制">
    <div class="pdf-control-group font-mono">
      <button type="button" class="btn-secondary pdf-icon-control" aria-label="上一页" :disabled="page === 1" @click="$emit('turn', -1)">‹</button>
      <span class="pdf-page-count">{{ pad(page) }} / {{ pad(pages) }}</span>
      <button type="button" class="btn-secondary pdf-icon-control" aria-label="下一页" :disabled="page === pages" @click="$emit('turn', 1)">›</button>
    </div>
    <div class="pdf-control-group font-mono">
      <button type="button" class="btn-secondary pdf-icon-control" aria-label="缩小" :disabled="zoom <= 0.4" @click="$emit('zoom', Math.max(0.4, zoom - 0.15))">−</button>
      <button type="button" class="btn-secondary pdf-icon-control" aria-label="放大" :disabled="zoom >= 3" @click="$emit('zoom', Math.min(3, zoom + 0.15))">＋</button>
    </div>
    <button type="button" class="btn-secondary pdf-present-control" @click="$emit('present')">{{ present ? '退出全屏' : '全屏' }}</button>
    <a :href="safeUrl(url)" download class="pdf-download-control">下载 PDF</a>
  </div>
</template>
