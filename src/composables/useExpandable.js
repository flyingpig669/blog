import { ref } from "vue";
// All interactive entries share selection-safe state; Vue owns hidden/aria state.
export function useExpandable(initial = false) {
  const expanded = ref(initial);
  function toggle(event) {
    if (event?.target?.closest("a, [data-pub-jump], [data-pub-preview]"))
      return;
    if (window.getSelection?.().toString()) return;
    expanded.value = !expanded.value;
  }
  return { expanded, toggle };
}
