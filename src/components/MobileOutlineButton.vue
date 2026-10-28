<script setup>
defineProps({ expanded: Boolean });
defineEmits(['open']);
</script>

<template>
  <Teleport to="body">
    <button
      id="mobile-reading-outline-trigger"
      type="button"
      class="mobile-outline-button"
      aria-label="打开阅读目录"
      aria-haspopup="dialog"
      aria-controls="mobile-outline-drawer"
      :aria-expanded="expanded"
      @click="$emit('open')"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" /></svg>
      <span>目录</span>
    </button>
  </Teleport>
</template>
