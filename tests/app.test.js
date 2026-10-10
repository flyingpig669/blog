const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function createApp() {
  const scripts = [];
  const context = { window: {}, console, document: {
    createElement: () => ({ remove() { this.removed = true; } }),
    head: { appendChild(script) { scripts.push(script); } }
  } };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(require.resolve('../js/app.js'), 'utf8'), context);
  return { app: context.window.BlogApp, context, scripts };
}

test('missing file navigation renders not found', () => {
  const { app, context } = createApp();
  context.window.BlogStore = { getDoc: () => ({ kind: null, data: null }) };
  let missing;
  app.renderNotFoundView = file => { missing = file; };
  app.renderFileTarget('missing.md', {});
  assert.equal(missing, 'missing.md');
});

test('lazy dependency failures notify all callers and permit retry', () => {
  const { app, scripts } = createApp();
  const results = [];
  app.ensureSlideViewer(error => results.push(error));
  app.ensureSlideViewer(error => results.push(error));
  assert.equal(scripts.length, 1);
  scripts[0].onerror();
  assert.equal(results.length, 2);
  assert.ok(results.every(error => error.message.includes('Unable to load')));
  assert.equal(app._slideQueue, null);
  app.ensureSlideViewer(error => results.push(error));
  assert.equal(scripts.length, 2);
  scripts[1].onload();
  scripts[2].onload();
  assert.equal(results[2], undefined);
});
