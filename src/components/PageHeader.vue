<script setup>
defineProps({ title: String, description: String, borderless: Boolean });
</script>
<template>
  <header
    class="mb-10 pb-6"
    :class="{ 'border-b border-divider': !borderless }"
  >
    <h1
      class="text-[32px] sm:text-[36px] font-bold text-primary tracking-[-0.02em] leading-[1.15] mb-2 font-sans"
    >
      {{ title }}
    </h1>
    <p v-if="description" class="text-[16px] text-secondary leading-relaxed">
      {{ description }}
    </p>
  </header>
</template>
