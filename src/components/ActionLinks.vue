<script setup>
import { computed } from 'vue';
import { config, safeUrl } from '../lib/content';
const actions = computed(() => (config.actions || []).filter(action =>
  (!action.feature || config.features[action.feature]) &&
  (!action.requiresSiteUrl || config.site.url)));
</script>
<template>
  <a v-for="action in actions" :key="action.id" :href="safeUrl(action.href)"
    class="shrink-0 text-secondary hover:text-accent text-[12px] font-mono"
    :aria-label="action.description || action.label">{{ action.label }}</a>
</template>
