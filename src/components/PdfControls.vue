<script setup>
import { pad } from '../lib/content';
import PreviewDownloads from './PreviewDownloads.vue';
defineProps({ page: Number, pages: Number, zoom: Number, present: Boolean, url: String, source: String });
defineEmits(['turn', 'zoom', 'present', 'reset']);
</script>

<template>
  <div class="pdf-controls" role="group" aria-label="文档预览控制">
    <div class="pdf-control-group font-mono">
      <button type="button" class="preview-tool" aria-label="上一页" title="上一页 · ←" :disabled="page === 1" @click="$emit('turn', -1)"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m14 6-6 6 6 6" /></svg></button>
      <span class="pdf-page-count" aria-live="polite" :aria-label="'第 ' + page + ' 页，共 ' + pages + ' 页'">{{ pad(page) }} / {{ pad(pages) }}</span>
      <button type="button" class="preview-tool" aria-label="下一页" title="下一页 · →" :disabled="page === pages" @click="$emit('turn', 1)"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m10 6 6 6-6 6" /></svg></button>
    </div>
    <div class="pdf-control-group font-mono" :aria-label="'缩放 ' + Math.round(zoom * 100) + '%'">
      <button type="button" class="preview-tool" aria-label="缩小" title="缩小 · −" :disabled="zoom <= 0.4" @click="$emit('zoom', Math.max(0.4, zoom - 0.15))">−</button>
      <button type="button" class="preview-tool pdf-fit-control" :aria-label="present ? '适应页面' : '适应宽度'" title="恢复自适应" @click="$emit('reset')">{{ Math.round(zoom * 100) }}%</button>
      <button type="button" class="preview-tool" aria-label="放大" title="放大 · +" :disabled="zoom >= 3" @click="$emit('zoom', Math.min(3, zoom + 0.15))">＋</button>
    </div>
    <div class="pdf-control-group pdf-view-actions">
      <PreviewDownloads :url="url" :source="source" compact />
      <button type="button" class="preview-tool" :aria-label="present ? '退出全屏' : '全屏'" :title="present ? '退出全屏 · Esc' : '全屏 · F'" @click="$emit('present')">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path v-if="present" d="M4 9h5V4m6 0v5h5M4 15h5v5m6 0v-5h5" /><path v-else d="M9 4H4v5m11-5h5v5M4 15v5h5m6 0h5v-5" /></svg>
      </button>
    </div>
  </div>
</template>
