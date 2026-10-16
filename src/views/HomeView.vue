<script setup>
import { computed, watchEffect } from "vue";
import { useRoute, useRouter } from "vue-router";
import { store, config, features, setTitle } from "../lib/content";
import PostItem from "../components/PostItem.vue";
import Pagination from "../components/Pagination.vue";
import ContinueReading from '../components/ContinueReading.vue';
const route = useRoute(),
  router = useRouter();
const page = computed(() =>
  store.getHomePage(route.query.page, features.homePageSize),
);
watchEffect(() => {
  setTitle(config.site.title);
  const query = page.value.page > 1 ? { page: String(page.value.page) } : {};
  if (String(route.query.page || "") !== String(query.page || ""))
    router.replace({ path: route.path, query });
});
</script>
<template>
  <div class="shell mx-auto px-4 sm:px-6 pt-20 md:pt-24 pb-20">
    <header class="mb-12">
      <h1
        class="text-[36px] sm:text-[42px] font-bold text-primary mb-3 tracking-tight"
      >
        {{ config.site.title }}
      </h1>
      <p class="text-secondary text-[16px] leading-relaxed">
        {{ config.site.tagline }}
      </p>
    </header>
    <ContinueReading :posts="store.getPosts({home:true})" />
    <section>
      <PostItem v-for="post in page.items" :key="post.slug" :post="post" />
      <p v-if="!page.total" class="view-status">还没有文章。</p>
    </section>
    <Pagination :page="page" />
  </div>
</template>
