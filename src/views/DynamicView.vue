<script setup>
import { computed, watchEffect } from "vue";
import { useRoute } from "vue-router";
import { store, navItems, navController, setTitle } from "../lib/content";
import PageHeader from "../components/PageHeader.vue";
import PostItem from "../components/PostItem.vue";
const route = useRoute();
const item = computed(
  () => navItems().find((item) => item.id === route.meta.module) || {},
);
const posts = computed(() => {
  const target = navController.parseTarget(item.value);
  return target.mode === "dir"
    ? store.getPostsByDir(target.value)
    : store.getPosts(item.value.filter || {});
});
watchEffect(() => setTitle(item.value.title || item.value.label));
</script>
<template>
  <div class="shell mx-auto px-4 sm:px-6 pt-16 md:pt-20 pb-20">
    <PageHeader
      :title="item.title || item.label"
      :description="item.subtitle"
    />
    <section class="ruled-list">
      <PostItem v-for="post in posts" :key="post.slug" :post="post" />
      <p v-if="!posts.length" class="view-status">这里还没有文章。</p>
    </section>
  </div>
</template>
