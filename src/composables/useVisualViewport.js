import { ref, onMounted, onUnmounted } from 'vue';

// Mobile keyboards can shrink the visual viewport without changing 100vh.
export function useVisualViewport() {
  const style = ref({});
  let viewport;
  function update() {
    style.value = {
      '--viewport-height': `${viewport?.height ?? window.innerHeight}px`,
      '--viewport-top': `${viewport?.offsetTop ?? 0}px`,
    };
  }
  onMounted(() => {
    viewport = window.visualViewport;
    viewport?.addEventListener('resize', update);
    viewport?.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    update();
  });
  onUnmounted(() => {
    viewport?.removeEventListener('resize', update);
    viewport?.removeEventListener('scroll', update);
    window.removeEventListener('resize', update);
  });
  return style;
}
