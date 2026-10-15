<script setup>
import { hrefFor, setTitle } from "../lib/content";
setTitle("Page Not Found");
</script>
<template>
  <div class="shell mx-auto px-4 sm:px-6 pt-20 pb-20 text-center">
    <h1 class="text-[32px] font-bold mb-3">Page not found.</h1>
    <p class="text-secondary mb-6">
      The requested route does not exist or has moved.
    </p>
    <a :href="hrefFor('home')" class="btn-secondary">Back to home</a>
  </div>
</template>
