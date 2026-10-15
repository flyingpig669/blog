<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  store,
  registry,
  selectedTags,
  tagsPath,
  setTitle,
} from "../lib/content";
import PageHeader from "../components/PageHeader.vue";
import PostItem from "../components/PostItem.vue";
const route = useRoute(),
  router = useRouter(),
  definition = registry.get("tags");
const selected = computed(() => selectedTags(route));
const tags = store.getAllTags();
const posts = computed(() =>
  store
    .getPosts()
    .filter((post) => selected.value.every((tag) => post.tags.includes(tag))),
);
function applyTagSelection(names) {
  router.push(tagsPath(names));
}
function toggle(tag) {
  applyTagSelection(
    selected.value.includes(tag)
      ? selected.value.filter((value) => value !== tag)
      : [...selected.value, tag],
  );
}
setTitle(definition.title);
</script>
<template>
  <div class="shell mx-auto px-4 sm:px-6 pt-16 md:pt-20 pb-20">
    <PageHeader
      :title="definition.headerTitle"
      :description="definition.description"
    />
    <div class="flex justify-between items-center mb-3">
      <span class="text-[12px] font-mono text-muted"
        >{{ tags.length }} TOPICS</span
      ><button
        v-if="selected.length"
        class="text-[12px] text-accent font-mono"
        @click="applyTagSelection([])"
      >
        Clear Selection ({{ selected.length }})
      </button>
    </div>
    <div class="tag-cloud mb-10">
      <button
        v-for="tag in tags"
        :key="tag.name"
        class="tag-tile"
        :class="{ active: selected.includes(tag.name) }"
        :aria-pressed="selected.includes(tag.name)"
        @click="toggle(tag.name)"
      >
        <span>#{{ tag.name }}</span
        ><span class="font-mono text-muted">{{ tag.count }}</span>
      </button>
    </div>
    <section class="ruled-list">
      <PostItem v-for="post in posts" :key="post.slug" :post="post" />
      <p v-if="!posts.length" class="view-status">No matching articles.</p>
    </section>
  </div>
</template>
