<script setup>
import { pathFor } from "../lib/content";
defineProps({ page: Object });
const link = (value) => ({
  path: pathFor("home"),
  query: value > 1 ? { page: value } : {},
});
</script>
<template>
  <nav v-if="page.pageCount > 1" aria-label="首页分页" class="pagination">
    <RouterLink
      v-if="page.page > 1"
      :to="link(page.page - 1)"
      rel="prev"
      class="btn-secondary"
      >← 上一页</RouterLink
    ><span v-else></span>
    <span class="font-mono text-muted text-[12px]" aria-live="polite"
      >{{ page.page }} / {{ page.pageCount }}</span
    >
    <RouterLink
      v-if="page.page < page.pageCount"
      :to="link(page.page + 1)"
      rel="next"
      class="btn-secondary"
      >下一页 →</RouterLink
    ><span v-else></span>
  </nav>
</template>
