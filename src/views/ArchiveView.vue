<script setup>
import { computed } from "vue";
import { store, registry, postHref, setTitle } from "../lib/content";
import PageHeader from "../components/PageHeader.vue";
import UpdatedAt from '../components/UpdatedAt.vue';
const definition = registry.get("archive");
setTitle(definition.title);
const groups = computed(() => {
  const years = new Map();
  for (const post of store.getPosts({ sort: "date" })) {
    const year = post.date.slice(0, 4);
    if (!years.has(year)) years.set(year, []);
    years.get(year).push(post);
  }
  return [...years];
});
</script>
<template>
  <div class="shell mx-auto px-4 sm:px-6 pt-16 md:pt-20 pb-20">
    <PageHeader
      :title="definition.title"
      :description="definition.description"
      borderless
    />
    <section v-for="[year, posts] in groups" :key="year" class="mb-10">
      <h2 class="font-mono text-[22px] text-primary mb-4">{{ year }}</h2>
      <div class="space-y-3">
        <a
          v-for="post in posts"
          :key="post.slug"
          :href="postHref(post)"
          class="flex items-baseline gap-4 py-1.5 group"
          ><time :datetime="post.date" class="font-mono text-[12px] text-muted shrink-0">{{
            post.date.slice(5)
          }}</time
          ><span class="min-w-0"><span class="text-[15px] text-secondary group-hover:text-accent">{{
            post.title
          }}</span><UpdatedAt :value="post.updated" class="block mt-1 text-[11px] text-muted" /></span></a
        >
      </div>
    </section>
  </div>
</template>
