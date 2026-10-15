<script setup>
import { config } from "../lib/content";
</script>
<template>
  <footer class="mt-24 py-10 relative z-10">
    <div
      class="shell mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-2 text-center text-[12px] text-muted font-mono"
    >
      <span id="footer-copyright">{{ config.site.footerText }}</span
      ><span v-if="config.site.footerEmail" id="footer-contact"
        ><span aria-hidden="true">· </span
        ><a
          id="footer-email"
          :href="'mailto:' + config.site.footerEmail"
          class="hover:text-accent transition-colors"
          >EMAIL</a
        ></span
      >
    </div>
  </footer>
</template>
