export const THEME_STORAGE_KEY = 'aurora_blog_theme_v3';

export function normalizeTheme(value) {
  return value === 'light' || value === 'dark' ? value : null;
}

export function readThemePreference() {
  try {
    return normalizeTheme(globalThis.localStorage?.getItem(THEME_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function systemTheme() {
  return globalThis.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function applyDocumentTheme(theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.classList.toggle('dark', theme === 'dark');
  // Read the palette from CSS so browser chrome shares the same source of truth.
  const color = getComputedStyle(root).getPropertyValue('--bg-page').trim();
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color);
}
