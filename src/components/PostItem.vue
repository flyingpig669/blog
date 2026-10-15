<script setup>
import { postHref, columnHref, tagHref } from "../lib/content";
defineProps({ post: Object });
</script>
<template>
  <article class="post-item">
    <div class="text-[12px] font-mono text-muted mb-2">
      <span>{{ post.date }}</span
      ><span> · </span>
      <span v-if="post.kind === 'book'"
        >BOOK · {{ post.chapterCount }} CHAPTERS</span
      >
      <span v-else>{{ post.readTime }}</span>
      <span v-if="post.pinned" class="ml-2">PINNED</span>
    </div>
    <h2 class="text-[18px] font-semibold text-primary leading-snug mb-2">
      <a
        :href="
          post.kind === 'book' ? columnHref(post.collection) : postHref(post)
        "
        class="hover:text-accent"
        >{{ post.title }}</a
      >
    </h2>
    <p
      v-if="post.excerpt"
      class="text-[14px] text-secondary line-clamp-2 leading-relaxed mb-3.5"
    >
      {{ post.excerpt }}
    </p>
    <div class="flex flex-wrap gap-2">
      <a
        v-for="tag in post.tags"
        :key="tag"
        :href="tagHref(tag)"
        class="tag-pill"
        >#{{ tag }}</a
      >
    </div>
  </article>
</template>
