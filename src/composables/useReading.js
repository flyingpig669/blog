import { watch, onMounted, onScopeDispose } from 'vue';
import { recordReading,persistReading } from '../lib/reading.js';
export function useReading(document) {
  let timer,frame,interacted=false,moved=false;
  watch(document,doc=>{
    interacted=false;
    moved=false;
    cancelAnimationFrame(frame);
    if (doc) { recordReading(doc.slug); persistReading(); }
  });
  // Ignore router restoration, but record real input immediately, even on fast pages.
  function interaction(event) {
    if (event.target?.isContentEditable || event.target?.closest?.('input,textarea,select')) return;
    if (event.type==='keydown' && (event.isComposing || !['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(event.key))) return;
    interacted=!!document.value;
  }
  function save() {
    if (!document.value || !interacted) return;
    const height=Math.max(0,window.document.documentElement.scrollHeight-innerHeight);
    recordReading(document.value.slug,{top:scrollY,progress:height ? Math.min(1,scrollY/height) : 1});
  }
  function scroll() {
    if (!interacted || !document.value) return;
    moved=true;
    cancelAnimationFrame(frame);
    frame=requestAnimationFrame(()=>{
      save();
      clearTimeout(timer); timer=setTimeout(persistReading,300);
    });
  }
  function flush() { if (moved) save();persistReading(); }
  const inputEvents=['wheel','touchstart','pointerdown','keydown'];
  onMounted(()=>{
    window.addEventListener('scroll',scroll,{passive:true});
    window.addEventListener('pagehide',flush);
    inputEvents.forEach(type=>window.addEventListener(type,interaction,{passive:true}));
  });
  onScopeDispose(()=>{
    window.removeEventListener('scroll',scroll);window.removeEventListener('pagehide',flush);
    inputEvents.forEach(type=>window.removeEventListener(type,interaction));
    cancelAnimationFrame(frame);clearTimeout(timer);flush();
  });
}
