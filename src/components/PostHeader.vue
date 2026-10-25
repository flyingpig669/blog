<script setup>
import { hrefFor, columnHref, tagHref, wordCount } from "../lib/content";
defineProps({ document: Object, navigation: Object });
</script>
<template>
  <nav
    aria-label="Breadcrumb"
    class="post-breadcrumb flex flex-wrap gap-2 text-[12px] font-mono text-muted mb-4"
  >
    <a :href="hrefFor('home')">文章</a
    ><template v-if="navigation.columnInfo"
      ><span>/</span
      ><a
        :href="columnHref(navigation.columnInfo)"
        class="text-secondary hover:text-accent"
        >{{ navigation.columnInfo.name }}</a
      ><span>/ Part {{ navigation.partNumber }}</span></template
    ><span v-else>/ Article</span>
  </nav>
  <div
    v-if="navigation.columnInfo"
    class="flex justify-between gap-3 mb-5 p-3 rounded-lg border border-subtle bg-codebg text-[12px]"
  >
    <span class="font-mono text-secondary"
      >PART {{ navigation.partNumber }} / {{ navigation.totalParts }}</span
    ><a :href="columnHref(navigation.columnInfo)" class="text-accent font-mono"
      >章节目录 →</a
    >
  </div>
  <header class="post-header mb-8 pb-6 border-b border-divider">
    <h1
      class="post-title text-[32px] sm:text-[36px] font-bold text-primary leading-tight mb-4"
    >
      {{ document.title }}
    </h1>
    <div class="post-metadata text-[12px] font-mono text-muted mb-4">
      <time>{{ document.date }}</time>
      <span v-if="document.updated">更新于 {{ document.updated }}</span>
      <span>{{ document.readTime }}</span><span>{{ wordCount(document.words) }}</span>
    </div>
    <div class="flex flex-wrap gap-2">
      <a
        v-for="tag in document.tags"
        :key="tag"
        :href="tagHref(tag)"
        class="tag-pill"
        >#{{ tag }}</a
      >
    </div>
  </header>
</template>
