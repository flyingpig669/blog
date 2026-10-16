<script setup>
defineProps({loading:Boolean,error:String});
defineEmits(['retry']);
</script>
<template>
  <div v-if="loading" class="document-skeleton" role="status" aria-label="正在加载文章"><span class="sr-only">正在加载文章…</span><div class="skeleton-title"></div><div v-for="i in 6" :key="i" class="skeleton-line"></div></div>
  <div v-else-if="error" role="alert"><p class="view-status">{{ error }}</p><button class="btn-secondary" @click="$emit('retry')">重试</button></div>
</template>
