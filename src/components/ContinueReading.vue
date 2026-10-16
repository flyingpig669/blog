<script setup>
import { computed } from 'vue';
import { recentlyRead,reading } from '../lib/reading.js';
import { postHref } from '../lib/content';
const props=defineProps({posts:Array});
const recent=computed(()=>recentlyRead(props.posts || [],1)[0]);
</script>
<template>
  <div v-if="recent" class="continue-reading">
    <div><span class="text-secondary text-[12px]">上次阅读</span> <span v-if="recent.order" class="font-mono text-[11px] text-muted">第 {{ recent.order }} 章</span><p class="text-primary text-[14px]">{{ recent.title }} <span class="font-mono text-muted text-[12px]">{{ Math.round(reading.entries[recent.slug].progress*100) }}%</span></p></div>
    <a :href="postHref(recent)+'?resume=1'" class="btn-secondary whitespace-nowrap">继续阅读</a>
  </div>
</template>
