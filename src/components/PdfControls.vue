<script setup>
import { pad } from '../lib/content';
import PreviewDownloads from './PreviewDownloads.vue';
defineProps({ page: Number, pages: Number, zoom: Number, present: Boolean, url: String, source: String });
defineEmits(['turn', 'zoom', 'present', 'reset']);
</script>

<template>
  <div class="pdf-controls" role="group" aria-label="PDF 播放控制">
    <div class="pdf-control-group font-mono">
      <button type="button" class="btn-secondary pdf-icon-control" aria-label="上一页" :disabled="page === 1" @click="$emit('turn', -1)">‹</button>
      <span class="pdf-page-count" aria-live="polite" :aria-label="'第 ' + page + ' 页，共 ' + pages + ' 页'">{{ pad(page) }} / {{ pad(pages) }}</span>
      <button type="button" class="btn-secondary pdf-icon-control" aria-label="下一页" :disabled="page === pages" @click="$emit('turn', 1)">›</button>
    </div>
    <div class="pdf-control-group font-mono" :aria-label="'缩放 ' + Math.round(zoom * 100) + '%'">
      <button type="button" class="btn-secondary pdf-icon-control" aria-label="缩小" :disabled="zoom <= 0.4" @click="$emit('zoom', Math.max(0.4, zoom - 0.15))">−</button>
      <button type="button" class="btn-secondary pdf-icon-control" aria-label="放大" :disabled="zoom >= 3" @click="$emit('zoom', Math.min(3, zoom + 0.15))">＋</button>
    </div>
    <div class="pdf-view-actions">
      <button type="button" class="btn-secondary" :title="'当前缩放 ' + Math.round(zoom * 100) + '%'" @click="$emit('reset')">{{ present ? '适应页面' : '适应宽度' }}</button>
      <button type="button" class="btn-secondary pdf-present-control" @click="$emit('present')">{{ present ? '退出全屏' : '全屏' }}</button>
    </div>
    <PreviewDownloads :url="url" :source="source" compact />
  </div>
</template>
