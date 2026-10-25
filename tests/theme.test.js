const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

let theme, createStore;
test.before(async () => {
  theme = await import('../src/lib/theme.js');
  ({ createStore } = await import('../src/lib/store.js'));
});
const emptyIndex = { schemaVersion: 2, documents: {}, posts: [], columns: [], aliases: {} };

function mockGlobal(t, name, value) {
  const original = Object.getOwnPropertyDescriptor(globalThis, name);
  Object.defineProperty(globalThis, name, { value, writable: true, configurable: true });
  t.after(() => {
    if (original) Object.defineProperty(globalThis, name, original);
    else delete globalThis[name];
  });
}

function browser(t, { saved = null, light = false, blocked = false } = {}) {
  const writes = [], classes = new Set(['dark']), root = { dataset: {}, classList: {
    toggle(name, enabled) { enabled ? classes.add(name) : classes.delete(name); }
  } };
  const meta = {};
  mockGlobal(t, 'localStorage', {
    getItem() { if (blocked) throw new Error('denied'); return saved; },
    setItem(key, value) { if (blocked) throw new Error('denied'); writes.push([key, value]); },
    removeItem() {}
  });
  mockGlobal(t, 'matchMedia', () => ({ matches: light }));
  mockGlobal(t, 'document', {
    documentElement: root,
    querySelector: () => ({ setAttribute: (key, value) => { meta[key] = value; } })
  });
  mockGlobal(t, 'getComputedStyle', () => ({
    getPropertyValue: () => root.dataset.theme === 'light' ? ' #FAFAFA ' : ' #0A0A0B '
  }));
  return { root, classes, meta, writes };
}

test('first visit follows system without persisting a derived preference', t => {
  const ui = browser(t, { light: true });
  const store = createStore();
  store.init(emptyIndex);
  assert.equal(store.theme, 'light');
  assert.equal(store.themePreference, null);
  assert.equal(ui.root.dataset.theme, 'light');
  assert.equal(ui.classes.has('dark'), false);
  assert.equal(ui.meta.content, '#FAFAFA');
  assert.deepEqual(ui.writes, []);
});

test('saved preference beats system; explicit switching persists and updates chrome', t => {
  const ui = browser(t, { saved: 'light' });
  const store = createStore();
  store.init(emptyIndex);
  assert.equal(store.theme, 'light');
  store.applyTheme('dark');
  assert.equal(store.themePreference, 'dark');
  assert.equal(ui.root.dataset.theme, 'dark');
  assert.equal(ui.classes.has('dark'), true);
  assert.equal(ui.meta.content, '#0A0A0B');
  assert.deepEqual(ui.writes, [[theme.THEME_STORAGE_KEY, 'dark']]);
});

test('invalid saved values fall back to system and blocked storage still allows switching', t => {
  browser(t, { saved: 'unexpected', light: true, blocked: true });
  const store = createStore();
  store.init(emptyIndex);
  assert.equal(store.theme, 'light');
  assert.equal(store.themePreference, null);
  assert.doesNotThrow(() => store.applyTheme('dark'));
  assert.equal(store.theme, 'dark');
  assert.equal(store.themePreference, 'dark');
  assert.equal(theme.normalizeTheme('unexpected'), null);
});

test('prepaint bootstrap agrees with runtime for saved, absent, invalid and blocked storage', t => {
  const html = fs.readFileSync('index.html', 'utf8');
  const script = html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
  for (const options of [
    { saved: 'light' }, { saved: 'dark', light: true }, { light: true }, {},
    { saved: 'invalid', light: true }, { blocked: true, light: true }
  ]) {
    const ui = browser(t, options);
    const context = { document, localStorage, matchMedia };
    vm.runInNewContext(script, context);
    const expected = theme.readThemePreference() || theme.systemTheme();
    assert.equal(ui.root.dataset.theme, expected);
    assert.equal(ui.classes.has('dark'), expected === 'dark');
    assert.deepEqual(ui.writes, []);
  }
});
