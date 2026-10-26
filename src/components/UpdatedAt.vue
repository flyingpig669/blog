<script setup>
defineProps({ value: String });
</script>

<template>
  <span v-if="value" class="updated-at font-mono">
    更新于 <time :datetime="value">{{ value }}</time>
  </span>
</template>
