<script setup>
import { useTheme } from '../composables/useTheme';
const { isDark, toggle } = useTheme();
</script>

<template>
  <button
    id="theme-toggle"
    type="button"
    class="btn-secondary theme-toggle"
    :aria-label="isDark ? '切换到白天模式' : '切换到黑暗模式'"
    :title="isDark ? '切换到白天模式' : '切换到黑暗模式'"
    @click="toggle"
  >
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <template v-if="isDark">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
      </template>
      <path v-else d="M20.9 13.1A9 9 0 0 1 10.9 3.1 9 9 0 1 0 20.9 13.1Z" />
    </svg>
  </button>
</template>
