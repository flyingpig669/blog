import { watch, onMounted, onScopeDispose } from 'vue';
import { recordReading,persistReading } from '../lib/reading.js';
export function useReading(document) {
  let timer,frame,readyAt=0;
  watch(document,doc=>{ if (doc) { recordReading(doc.slug); persistReading(); readyAt=Date.now()+700; } });
  function scroll() {
    cancelAnimationFrame(frame);
    frame=requestAnimationFrame(()=>{
      if (!document.value || Date.now()<readyAt) return;
      const height=Math.max(0,window.document.documentElement.scrollHeight-innerHeight);
      recordReading(document.value.slug,{top:scrollY,progress:height ? Math.min(1,scrollY/height) : 1});
      clearTimeout(timer); timer=setTimeout(persistReading,300);
    });
  }
  onMounted(()=>{window.addEventListener('scroll',scroll,{passive:true});window.addEventListener('pagehide',persistReading);});
  onScopeDispose(()=>{window.removeEventListener('scroll',scroll);window.removeEventListener('pagehide',persistReading);cancelAnimationFrame(frame);clearTimeout(timer);persistReading();});
}
