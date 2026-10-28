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
  function pointer(event) {
    if (event.pointerType !== 'touch') reveal();
  }
  function touch(event) {
    if (event.pointerType !== 'touch' || event.target.closest('button,a,input,select')) return;
    visible.value = !visible.value;
    if (visible.value) hide();
  }
  onScopeDispose(() => clearTimeout(timer));
  return { visible, reveal, hide, pointer, touch };
}
