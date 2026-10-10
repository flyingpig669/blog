const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('search reopen preserves return focus and cancels pending queries', () => {
  const pending = new Map();
  let nextTimer = 0;
  const background = { tagName: 'MAIN', inert: false };
  const modal = {
    tagName: 'DIV',
    hidden: true,
    classList: {
      contains: () => modal.hidden,
      remove: () => { modal.hidden = false; },
      add: () => { modal.hidden = true; }
    },
    addEventListener() {}, removeEventListener() {}
  };
  const trigger = { isConnected: true, focus() { document.activeElement = this; } };
  const input = { value: '', focus() { document.activeElement = this; } };
  const results = {};
  const document = {
    activeElement: trigger,
    body: { children: [background, modal], style: { overflow: '' } },
    getElementById: id => ({ 'search-modal': modal, 'search-modal-input': input, 'search-modal-results': results })[id]
  };
  const context = {
    window: { BlogStore: { config: {} } }, document,
    setTimeout(fn) { const id = ++nextTimer; pending.set(id, fn); return id; },
    clearTimeout(id) { pending.delete(id); }
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(require.resolve('../js/components/search-modal.js'), 'utf8'), context);
  const search = context.window.BlogSearch;
  const queries = [];
  search.search = query => queries.push(query);
  search.open();
  assert.equal(background.inert, true);
  input.value = 'preserved';
  search.open();
  assert.equal(input.value, 'preserved');
  search.debounce('obsolete');
  search.close();
  assert.equal(document.activeElement, trigger);
  assert.equal(background.inert, false);
  assert.equal(document.body.style.overflow, '');
  assert.equal(pending.size, 0);
  search.open();
  for (const fn of pending.values()) fn();
  assert.deepEqual(queries, ['', '']);
});
