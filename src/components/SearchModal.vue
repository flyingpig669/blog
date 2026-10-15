<script setup>
import { ref, computed, watch, nextTick, onScopeDispose } from "vue";
import { store, postHref } from "../lib/content";
const props = defineProps({ open: Boolean });
const emit = defineEmits(["close"]);
const query = ref(""),
  results = ref([]),
  active = ref(0),
  status = ref(""),
  input = ref(null),
  modal = ref(null);
let revision = 0,
  timer;
let previousFocus;
let previousOverflow = "";
async function search() {
  const current = ++revision;
  status.value = "Searching…";
  try {
    await store.loadSearch();
    if (current !== revision || !props.open) return;
    results.value = store.searchPosts(query.value).slice(0, 30);
    active.value = 0;
    status.value = "";
  } catch {
    if (current === revision) status.value = "搜索加载失败，请重试。";
  }
}
watch(query, () => {
  clearTimeout(timer);
  revision++;
  timer = setTimeout(search, 150);
});
watch(
  () => props.open,
  async (value) => {
    clearTimeout(timer);
    revision++;
    if (value) {
      previousFocus = document.activeElement;
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      query.value = "";
      results.value = [];
      await nextTick();
      input.value?.focus();
      search();
    } else {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus?.();
    }
  },
);
function keydown(event) {
  if (event.isComposing) return;
  if (event.key === "Escape") emit("close");
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    if (results.value.length)
      active.value =
        (active.value +
          (event.key === "ArrowDown" ? 1 : -1) +
          results.value.length) %
        results.value.length;
    nextTick(() =>
      modal.value
        ?.querySelector(".is-active")
        ?.scrollIntoView({ block: "nearest" }),
    );
  }
  if (
    event.key === "Enter" &&
    event.target === input.value &&
    results.value[active.value]
  ) {
    event.preventDefault();
    modal.value.querySelector(".is-active")?.click();
  }
  if (event.key === "Tab") {
    const controls = [...modal.value.querySelectorAll("input,button,a[href]")];
    const position = controls.indexOf(document.activeElement);
    if (
      (event.shiftKey && position === 0) ||
      (!event.shiftKey && position === controls.length - 1)
    ) {
      event.preventDefault();
      controls[event.shiftKey ? controls.length - 1 : 0]?.focus();
    }
  }
}
onScopeDispose(() => {
  revision++;
  clearTimeout(timer);
});
</script>
<template>
  <Teleport to="body"
    ><div
      v-if="open"
      id="search-modal"
      ref="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="search-modal-title"
      class="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-page/80 backdrop-blur-sm"
      @click.self="$emit('close')"
      @keydown="keydown"
    >
      <div
        class="w-full max-w-[560px] bg-surface rounded-xl border border-white/[0.12] overflow-hidden"
      >
        <h2 id="search-modal-title" class="sr-only">Search articles</h2>
        <div class="p-3.5 border-b border-divider flex items-center gap-3">
          <input
            id="search-modal-input"
            ref="input"
            v-model="query"
            type="search"
            aria-label="Search articles"
            placeholder="Search articles, tags, concepts..."
            class="w-full text-[14px] bg-transparent text-primary"
          /><button
            class="btn-secondary font-mono text-[11px]"
            @click="$emit('close')"
          >
            ESC
          </button>
        </div>
        <div
          id="search-modal-results"
          aria-live="polite"
          class="max-h-80 overflow-y-auto p-2 space-y-1"
        >
          <p v-if="status" class="view-status" role="status">{{ status }}</p>
          <a
            v-for="(post, index) in results"
            :key="post.slug"
            :href="postHref(post)"
            class="search-result-item block p-3 rounded-lg"
            :class="{ 'is-active': index === active }"
            @click="$emit('close')"
            @mouseenter="active = index"
            ><h3 class="text-primary text-[14px]">{{ post.title }}</h3>
            <p class="text-secondary text-[12px] mt-1 line-clamp-2">
              {{ store.searchSnippet(post, query) }}
            </p></a
          >
          <p v-if="!status && !results.length" class="view-status">
            No results.
          </p>
        </div>
      </div>
    </div></Teleport
  >
</template>
