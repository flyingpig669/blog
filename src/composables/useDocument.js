import { shallowRef, ref, watch, onScopeDispose } from "vue";
import { useRoute } from "vue-router";
import { store, docForRoute, setTitle } from "../lib/content";
export function useDocument() {
  const route = useRoute();
  const document = shallowRef(null),
    error = ref(""),
    loading = ref(false);
  let revision = 0;
  async function load() {
    const current = ++revision;
    const metadata = docForRoute(route);
    document.value = null;
    error.value = "";
    loading.value = !!metadata;
    if (!metadata) {
      loading.value = false;
      return;
    }
    setTitle(metadata.title);
    try {
      const value = await store.loadDocument(metadata);
      if (current === revision) document.value = value;
    } catch (cause) {
      if (current === revision) error.value = "文档加载失败，请重试。";
    } finally {
      if (current === revision) loading.value = false;
    }
  }
  watch(() => [route.meta.module, route.params.slug], load, {
    immediate: true,
  });
  onScopeDispose(() => {
    revision++;
  });
  return { document, error, loading, retry: load };
}
