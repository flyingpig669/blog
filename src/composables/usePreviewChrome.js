import { ref, onScopeDispose } from 'vue';

// The canvas remains the surface; controls appear only while interacting.
export function usePreviewChrome(root) {
  const visible = ref(true);
  let timer;
  function hide() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const active = document.activeElement;
      if (root.value?.contains(active) && active?.closest('button,a,input,select') && active.matches(':focus-visible')) return;
      visible.value = false;
    }, 2400);
  }
  function reveal() { visible.value = true; hide(); }
  // 立即可见性由放映模式要求：进入全屏的那一帧就必须是一张干净的幻灯片
  function dismiss() { clearTimeout(timer); visible.value = false; }
  function pointer(event) {
    if (event.pointerType !== 'touch') reveal();
  }
  function touch(event) {
    if (event.pointerType !== 'touch' || event.target.closest('button,a,input,select')) return;
    visible.value = !visible.value;
    if (visible.value) hide();
  }
  onScopeDispose(() => clearTimeout(timer));
  return { visible, reveal, hide, dismiss, pointer, touch };
}
