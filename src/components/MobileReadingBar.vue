<script setup>
import { postHref } from '../lib/content';
defineProps({navigation:Object,outline:Boolean,outlineExpanded:Boolean});
defineEmits(['outline']);
</script>
<template>
  <nav class="mobile-reading-bar" aria-label="阅读操作">
    <a v-if="navigation.prevPost" :href="postHref(navigation.prevPost)" :title="navigation.prevPost.title" :aria-label="'上一篇：' + navigation.prevPost.title">{{ navigation.prevLabel }}</a><span v-else class="text-muted">已到开头</span>
    <button v-if="outline" id="mobile-reading-outline-trigger" class="btn-secondary" aria-controls="mobile-outline-drawer" :aria-expanded="outlineExpanded" @click="$emit('outline')">目录</button>
    <a v-if="navigation.nextPost" :href="postHref(navigation.nextPost)" :title="navigation.nextPost.title" :aria-label="'下一篇：' + navigation.nextPost.title">{{ navigation.nextLabel }}</a><span v-else class="text-muted">已到末尾</span>
  </nav>
</template>
