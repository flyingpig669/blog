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
import { useReading } from '../composables/useReading';
import { reading } from '../lib/reading.js';
import ReadingSettings from '../components/ReadingSettings.vue';
import MobileReadingBar from '../components/MobileReadingBar.vue';
import ArticleRelations from '../components/ArticleRelations.vue';
import DocumentStatus from '../components/DocumentStatus.vue';
const route = useRoute();
const { document, loading, error, retry } = useDocument();
useReading(document);
const outlineView = ref(null);
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
      window.document.getElementById(route.query.heading)?.scrollIntoView();
  });
}
watch(
  () => route.query.heading,
  (heading) => {
    if (heading)
      nextTick(() => window.document.getElementById(heading)?.scrollIntoView());
  },
);
</script>
<template>
  <div
    v-if="loading || error"
    class="shell mx-auto px-4 sm:px-6 pt-16 md:pt-20 pb-20"
  >
    <DocumentStatus :loading="loading" :error="error" @retry="retry" />
  </div>
  <NotFoundView v-else-if="!document" />
  <StructuredPage
    v-else-if="document.type === 'post' || document.type === 'page'"
    :document="document"
  />
  <IndexPage v-else-if="document.type === 'index'" :document="document" />
  <div
    v-else
    class="shell-detail mx-auto px-4 sm:px-6 pt-16 md:pt-20 pb-20 flex items-start gap-8 post-layout"
  >
    <div class="flex-1 max-w-[680px] min-w-0 reader-content" :style="{'--reader-size':reading.fontSize+'px','--reader-leading':reading.lineHeight}">
      <ReadingSettings />
      <PostHeader :document="document" :navigation="navigation" /><PdfPreview
        v-if="document.slideExplicit && document.slide"
        :url="document.slide"
        :size="document.attachmentInfo?.[document.slide]?.size"
      /><MarkdownBody
        :key="document.slug"
        :content="document.content"
        :attachment-info="document.attachmentInfo"
        :source-path="document.sourcePath"
        :toc-levels="document.tocLevels"
        :primary-pdf="document.slideExplicit ? document.slide : undefined"
        @outline="outline"
      />
      <div class="mt-10"><Attachments :document="document" /></div>
      <ArticleRelations :post="document" /><PostAdjacent :navigation="navigation" />
    </div>
    <PostOutline
      ref="outlineView"
      v-if="
        features.outlineSidebar !== false &&
        (toc.length || navigation.colPosts.length > 1)
      "
      :key="document.slug"
      :post="document"
      :toc="toc"
      :navigation="navigation"
    />
    <MobileReadingBar :navigation="navigation" :outline="features.outlineSidebar !== false && (toc.length || navigation.colPosts.length > 1)" :outline-expanded="!!outlineView?.expanded" @outline="outlineView?.open()" />
  </div>
</template>
