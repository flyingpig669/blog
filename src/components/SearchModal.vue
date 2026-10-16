<script setup>
import { ref, computed, watch, nextTick, onScopeDispose } from "vue";
import { store, postHref, tagHref } from "../lib/content";
import { html } from '../lib/html.js';
import { recentlyRead } from '../lib/reading.js';
const scope=ref('all'),failed=ref(false);
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
  status.value = "正在搜索…";
  failed.value=false;
  try {
    await store.loadSearch();
    if (current !== revision || !props.open) return;
    const q=query.value.trim();
    let posts=store.searchPosts(q).filter(post=>scope.value==='books' ? post.type==='books' : scope.value==='articles' ? post.type!=='books' : true);
    if (!q) { const recent=recentlyRead(posts); if(recent.length) posts=recent; else posts=posts.slice(0,5); }
    const tags=store.getAllTags().filter(tag=>tag.name.toLowerCase().includes(q.toLowerCase())).map(tag=>({...tag,slug:tag.name,title:'#'+tag.name,kind:'tag'}));
    results.value=(scope.value==='tags' ? tags : scope.value==='all' && q ? [...posts,...tags] : posts).slice(0,30);
    active.value = 0;
    status.value = "";
  } catch {
    if (current === revision) { status.value = "搜索加载失败，请重试。"; failed.value=true; }
  }
}
watch([query,scope], () => {
  clearTimeout(timer);
  revision++;
  results.value=[];
  status.value="正在搜索…";
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
      scope.value = "all";
      results.value = [];
      await nextTick();
      input.value?.focus();
      search();
    } else {
      document.body.style.overflow = previousOverflow;
      await nextTick();
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
    const controls = [...modal.value.querySelectorAll("input,button,a[href],select")];
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
        <h2 id="search-modal-title" class="sr-only">搜索文章</h2>
        <div class="p-3.5 border-b border-divider flex items-center gap-3">
          <input
            id="search-modal-input"
            ref="input"
            v-model="query"
            type="search"
            aria-label="搜索文章"
            placeholder="搜索文章、书籍、标签或专栏…"
            class="w-full text-[14px] bg-transparent text-primary"
          /><button
            class="btn-secondary font-mono text-[11px]"
            @click="$emit('close')"
          >
            ESC
          </button>
        </div>
        <div class="search-filters" aria-label="搜索范围">
          <button v-for="filter in [{id:'all',label:'全部'},{id:'articles',label:'文章'},{id:'books',label:'书籍'},{id:'tags',label:'标签'}]" :key="filter.id" class="tag-pill" :class="{'is-selected':scope===filter.id}" :aria-pressed="scope===filter.id" @click="scope=filter.id">{{ filter.label }}</button>
        </div>
        <p v-if="!query && scope!=='tags'" class="px-4 text-[11px] text-muted">{{ recentlyRead(store.getPosts()).length ? '最近阅读' : '最新文章' }}</p>
        <div
          id="search-modal-results"
          aria-live="polite"
          class="max-h-80 overflow-y-auto p-2 space-y-1"
        >
          <p v-if="status" class="view-status" role="status">{{ status }} <button v-if="failed" class="text-accent" @click="search">重试</button></p>
          <a
            v-for="(post, index) in results"
            :key="post.slug"
            :href="post.kind==='tag' ? tagHref(post.name) : postHref(post)"
            class="search-result-item block p-3 rounded-lg"
            :class="{ 'is-active': index === active }"
            @click="$emit('close')"
            @mouseenter="active = index"
            ><h3 class="text-primary text-[14px]" v-html="html.highlight(post.title,query)"></h3>
            <p class="text-secondary text-[12px] mt-1 line-clamp-2" :class="{'font-mono':post.kind==='tag'}">
              {{ post.kind==='tag' ? post.count+' 篇文章' : store.searchSnippet(post, query) }}
            </p></a
          >
          <p v-if="!status && !results.length" class="view-status">
            没有找到匹配内容，试试更短的关键词。
          </p>
        </div>
      </div>
    </div></Teleport
  >
</template>
