import { reactive } from 'vue';
const key = 'aurora-reading-v1';
function load() { try { return JSON.parse(localStorage.getItem(key)) || {}; } catch { return {}; } }
const saved = load();
export const reading = reactive({entries:{}, fontSize:17, lineHeight:1.8});
if (saved.entries && typeof saved.entries === 'object') {
  for (const [slug, entry] of Object.entries(saved.entries).slice(0,100)) {
    if (entry && Number.isFinite(entry.top) && Number.isFinite(entry.visitedAt)) reading.entries[slug] = {...entry, top:Math.max(0,entry.top), progress:Math.max(0,Math.min(1,Number(entry.progress)||0))};
  }
}
export function persistReading() { try { localStorage.setItem(key,JSON.stringify(reading)); } catch {} }
export function setReadingSettings(fontSize,lineHeight) {
  reading.fontSize = [16,17,18,20,22].includes(Number(fontSize)) ? Number(fontSize) : 17;
  reading.lineHeight = [1.6,1.8,2,2.2].includes(Number(lineHeight)) ? Number(lineHeight) : 1.8;
  persistReading();
}
setReadingSettings(saved.fontSize,saved.lineHeight);
export function recordReading(slug,position,timestamp=Date.now()) {
  if (!slug) return;
  const previous=reading.entries[slug] || {top:0,progress:0};
  const top=Number(position?.top ?? previous.top), progress=Number(position?.progress ?? previous.progress);
  reading.entries[slug] = {top:Number.isFinite(top) ? Math.max(0,top) : 0,
    progress:Number.isFinite(progress) ? Math.max(0,Math.min(1,progress)) : 0, visitedAt:timestamp};
  reading.entries = Object.fromEntries(Object.entries(reading.entries).sort((a,b)=>b[1].visitedAt-a[1].visitedAt).slice(0,100));
}
export function recentlyRead(posts,limit=5) {
  return posts.filter(post=>reading.entries[post.slug]).sort((a,b)=>reading.entries[b.slug].visitedAt-reading.entries[a.slug].visitedAt).slice(0,limit);
}
