const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function fixture() {
  const context = { window: {} };
  vm.createContext(context);
  for (const name of ['html', '../components/pdf-previews']) {
    const file = name === 'html' ? '../js/lib/html.js' : '../js/components/pdf-previews.js';
    vm.runInContext(fs.readFileSync(require.resolve(file), 'utf8'), context);
  }
  const previews = context.window.BlogPdfPreviews;
  function mount(url, primary) {
    const attrs = { 'data-slide-url': url, 'data-slide-title': 'Title <unsafe>', 'data-slide-primary': primary ? '1' : '' };
    const button = {};
    return { isConnected: true, innerHTML: '', getAttribute: key => attrs[key], setAttribute: (key, value) => { attrs[key] = value; },
      querySelector: () => button, remove() { this.isConnected = false; } };
  }
  const first = mount('one.pdf', true), second = mount('two.pdf'), duplicate = mount('one.pdf');
  let binds = 0, requests = 0, revision = 1;
  const callbacks = [], mounted = [];
  const attrs = {};
  const container = { querySelectorAll: () => [first, second, duplicate], getAttribute: key => attrs[key], setAttribute: (key, value) => { attrs[key] = value; },
    addEventListener: () => { binds++; } };
  const services = { getRevision: () => revision, ensureViewer(callback) { requests++; callbacks.push(callback); }, mountViewer: (element, options) => { mounted.push({ element, options }); } };
  return { previews, first, second, duplicate, container, services, callbacks, mounted,
    requests: () => requests, binds: () => binds, navigate: () => { revision++; } };
}

test('multiple PDF placeholders do not start loading and delegation binds once', () => {
  const f = fixture();
  const post = { slide: 'one.pdf', slideExplicit: true };
  f.previews.prepare(f.container, post, f.services);
  f.previews.prepare(f.container, post, f.services);
  assert.equal(f.requests(), 0);
  assert.equal(f.binds(), 1);
  assert.equal(f.duplicate.isConnected, false);
  assert.match(f.first.innerHTML, /Title &lt;unsafe&gt;/);
  assert.match(f.first.innerHTML, /download/);
  f.previews.open(f.second, f.services);
  f.previews.open(f.second, f.services);
  assert.equal(f.requests(), 1);
  f.callbacks[0]();
  assert.equal(f.mounted.length, 1);
  assert.equal(f.mounted[0].element, f.second);
  assert.equal(f.mounted[0].options.url, 'two.pdf');
});

test('failed dependency loading can retry without remounting other PDFs', () => {
  const f = fixture();
  f.previews.prepare(f.container, {}, f.services);
  f.previews.open(f.first, f.services);
  f.callbacks[0](new Error('offline'));
  assert.equal(f.first.getAttribute('data-pdf-state'), 'idle');
  assert.match(f.first.innerHTML, /重试预览/);
  f.previews.open(f.first, f.services);
  f.callbacks[1]();
  assert.equal(f.mounted.length, 1);
  assert.equal(f.second.getAttribute('data-pdf-state'), 'idle');
});

test('stale PDF dependency responses cannot mount after navigation', () => {
  const f = fixture();
  f.previews.prepare(f.container, {}, f.services);
  f.previews.open(f.first, f.services);
  f.navigate();
  f.callbacks[0]();
  assert.equal(f.mounted.length, 0);
});

test('Office previews share the lazy PDF viewer and preserve original downloads', () => {
  const f = fixture();
  f.first.setAttribute('data-source-url', 'attachments/notes one.docx');
  f.first.setAttribute('data-source-format', 'Word');
  f.previews.prepare(f.container, {}, f.services);
  assert.equal(f.requests(), 0);
  assert.match(f.first.innerHTML, /预览 Word/);
  assert.match(f.first.innerHTML, /attachments\/notes%20one.docx/);
  assert.match(f.first.innerHTML, /下载原文件/);
  const markup = f.previews.officeMarkup({attachmentPreviews: {'attachments/a<unsafe>.pptx': 'data/office/preview.pdf'}});
  assert.match(markup, /data-source-format="PPT"/);
  assert.match(markup, /a&lt;unsafe&gt;.pptx/);
  assert.doesNotMatch(markup, /<iframe|<script/);
  f.previews.open(f.first, f.services);
  f.callbacks[0]();
  assert.equal(f.mounted[0].options.url, 'one.pdf');
  assert.equal(f.mounted[0].options.document, true);
});
