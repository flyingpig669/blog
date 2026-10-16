<script setup>
import { computed, watchEffect } from "vue";
import { useRoute } from "vue-router";
import {
  store,
  registry,
  hrefFor,
  postHref,
  columnHref,
  wordCount,
  pad,
  setTitle,
} from "../lib/content";
import PageHeader from "../components/PageHeader.vue";
import ExpandableEntry from "../components/ExpandableEntry.vue";
import NotFoundView from "./NotFoundView.vue";
import ContinueReading from '../components/ContinueReading.vue';
const route = useRoute();
const definition = computed(() => registry.get(route.meta.module));
const columns = computed(() =>
  registry.collectionsFor(route.meta.module, store.getColumns()),
);
const slug = computed(() => route.params.slug || route.params.columnSlug);
const column = computed(() =>
  columns.value.find((column) => column.id === slug.value),
);
watchEffect(() => setTitle(column.value?.name || definition.value.title));
</script>
<template>
  <NotFoundView v-if="slug && !column" />
  <div v-else class="shell mx-auto px-4 sm:px-6 pt-16 md:pt-20 pb-20">
    <template v-if="column">
      <a
        :href="hrefFor(route.meta.module)"
        class="text-[13px] font-mono text-secondary hover:text-accent inline-block mb-6"
        >← 返回 {{ definition.title }}</a
      >
      <PageHeader :title="column.name" :description="column.desc" /><ContinueReading :posts="column.posts" />
      <div class="space-y-4 border-l border-subtle pl-6">
        <a
          v-for="(post, index) in column.posts"
          :key="post.slug"
          :href="postHref(post)"
          class="flex gap-3 text-[15px] text-primary hover:text-accent"
          ><span class="font-mono text-muted">{{
            pad(post.order ?? index + 1)
          }}</span
          ><span>{{ post.title }}</span></a
        >
      </div>
    </template>
    <template v-else>
      <PageHeader
        :title="definition.title"
        :description="definition.description"
      />
      <section class="ruled-list">
        <article
          v-for="(book, index) in columns"
          :key="book.id"
          class="series-item"
        >
          <div class="text-[12px] font-mono text-muted mb-3">
            {{ definition.collectionLabel || "SERIES" }} {{ pad(index + 1) }} ·
            {{ book.postsCount }} 章节 · {{ wordCount(book.totalWords) }}
          </div>
          <h2 class="text-[22px] font-semibold text-primary mb-2">
            <a :href="columnHref(book)" class="hover:text-accent">{{
              book.name
            }}</a>
          </h2>
          <p class="text-[14px] text-secondary mb-4">{{ book.desc }}</p>
          <ExpandableEntry
            title="章节目录"
            expandable
            title-class="text-[13px] font-mono text-secondary"
          >
            <div class="space-y-3 border-l border-subtle pl-4 mt-4">
              <a
                v-for="(post, i) in book.posts"
                :key="post.slug"
                :href="postHref(post)"
                class="flex gap-3 text-[14px] text-primary hover:text-accent"
                ><span class="font-mono text-muted">{{
                  pad(post.order ?? i + 1)
                }}</span
                >{{ post.title }}</a
              >
            </div>
          </ExpandableEntry>
          <ContinueReading :posts="book.posts" />
        </article>
      </section>
    </template>
  </div>
</template>
