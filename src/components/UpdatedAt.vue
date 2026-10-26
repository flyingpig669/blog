<script setup>
import { updatedText, updatedDateTime } from '../lib/dates';
defineProps({ value: String });
</script>

<template>
  <span v-if="value" class="updated-at font-mono">
    更新于 <time :datetime="updatedDateTime(value)">{{ updatedText(value) }}</time>
  </span>
</template>
