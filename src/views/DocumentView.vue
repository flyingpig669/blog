<script setup>
import { postNavigation } from "../lib/post-navigation.js";
import { computed, ref, watch, nextTick } from "vue";
import { useRoute } from "vue-router";
import { store, features } from "../lib/content";
import { useDocument } from "../composables/useDocument";
import StructuredPage from "../components/StructuredPage.vue";
import IndexPage from "../components/IndexPage.vue";
import PostHeader from "../components/PostHeader.vue";
import PostAdjacent from "../components/PostAdjacent.vue";
import PostOutline from "../components/PostOutline.vue";
import MarkdownBody from "../components/MarkdownBody.vue";
import PdfPreview from "../components/PdfPreview.vue";
import Attachments from "../components/Attachments.vue";
import NotFoundView from "./NotFoundView.vue";
const route = useRoute();
const { document, loading, error, retry } = useDocument();
const toc = ref([]);
const navigation = computed(() =>
  document.value
    ? postNavigation.resolve(document.value, {
        getColumnById: store.getColumnById.bind(store),
        getPosts: store.getPosts.bind(store),
      })
    : {},
);
function outline(items) {
  toc.value = items;
  nextTick(() => {
    if (route.query.heading)
      document.getElementById(route.query.heading)?.scrollIntoView();
  });
}
watch(
  () => route.query.heading,
  (heading) => {
    if (heading)
      nextTick(() => document.getElementById(heading)?.scrollIntoView());
  },
);
</script>
<template>
  <div
    v-if="loading || error"
    class="shell mx-auto px-4 sm:px-6 pt-16 md:pt-20 pb-20"
  >
    <p class="view-status" role="status">{{ error || "Loading document…" }}</p>
    <button v-if="error" class="btn-secondary" @click="retry">重试</button>
  </div>
  <NotFoundView v-else-if="!document" />
  <StructuredPage
    v-else-if="document.type === 'post' || document.type === 'page'"
    :document="document"
  />
  <IndexPage v-else-if="document.type === 'index'" :document="document" />
  <div
    v-else
    class="shell-detail mx-auto px-4 sm:px-6 pt-16 md:pt-20 pb-20 flex items-start gap-8"
  >
    <div class="flex-1 max-w-[680px] min-w-0">
      <PostHeader :document="document" :navigation="navigation" /><PdfPreview
        v-if="document.slideExplicit && document.slide"
        :url="document.slide"
        :title="document.title"
      /><MarkdownBody
        :key="document.slug"
        :content="document.content"
        :source-path="document.sourcePath"
        :toc-levels="document.tocLevels"
        :primary-pdf="document.slideExplicit ? document.slide : undefined"
        @outline="outline"
      />
      <div class="mt-10"><Attachments :document="document" /></div>
      <PostAdjacent :navigation="navigation" />
    </div>
    <PostOutline
      v-if="
        features.outlineSidebar !== false &&
        (toc.length || navigation.colPosts.length > 1)
      "
      :key="document.slug"
      :post="document"
      :toc="toc"
      :navigation="navigation"
    />
  </div>
</template>
