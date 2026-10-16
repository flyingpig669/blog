<script setup>
import { ref,computed,watch,onScopeDispose } from 'vue';
import { store,postHref } from '../lib/content';
import { relatedPosts } from '../lib/related.js';
const props=defineProps({post:Object});
const backlinks=ref([]),error=ref('');
const related=computed(()=>relatedPosts(props.post,store.getPosts()));
let revision=0;
async function load() {
  const current=++revision; backlinks.value=[];error.value='';
  try { const graph=await store.fetchJson('data/relations.json');if(current===revision) backlinks.value=(graph[props.post.slug] || []).map(slug=>store.documents[slug]).filter(Boolean); }
  catch { if(current===revision) error.value='引用关系加载失败'; }
}
watch(()=>props.post.slug,load,{immediate:true});
onScopeDispose(()=>{revision++;});
</script>
<template>
  <section v-if="related.length || backlinks.length || error" class="article-relations">
    <div v-if="related.length"><h2 class="text-[15px] text-primary font-semibold mb-3">相关文章</h2><a v-for="post in related" :key="post.slug" :href="postHref(post)" class="related-link">{{ post.title }}</a></div>
    <div v-if="backlinks.length"><h2 class="text-[15px] text-primary font-semibold mb-3">引用本文</h2><a v-for="post in backlinks" :key="post.slug" :href="postHref(post)" class="related-link">{{ post.title }}</a></div>
    <p v-if="error" class="view-status">{{ error }} <button class="text-accent" @click="load">重试</button></p>
  </section>
</template>
