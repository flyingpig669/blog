import { computed, onMounted, onUnmounted } from 'vue';
import { store } from '../lib/content';
import { THEME_STORAGE_KEY, normalizeTheme, systemTheme } from '../lib/theme';

export function useTheme() {
  const isDark = computed(() => store.theme === 'dark');
  const toggle = () => store.applyTheme(isDark.value ? 'light' : 'dark');
  let media;
  function systemChanged() {
    if (!store.themePreference) store.applyTheme(systemTheme(), false);
  }
  function storageChanged(event) {
    if (event.storageArea !== localStorage || (event.key !== THEME_STORAGE_KEY && event.key !== null)) return;
    store.themePreference = normalizeTheme(event.newValue);
    store.applyTheme(store.themePreference || systemTheme(), false);
  }
  onMounted(() => {
    media = window.matchMedia('(prefers-color-scheme: light)');
    media.addEventListener('change', systemChanged);
    window.addEventListener('storage', storageChanged);
    systemChanged();
  });
  onUnmounted(() => {
    media?.removeEventListener('change', systemChanged);
    window.removeEventListener('storage', storageChanged);
  });
  return { isDark, toggle };
}
