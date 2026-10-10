const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(require.resolve('../js/lib/html.js'), 'utf8'), context);
const html = context.window.BlogHtml;
test('URL policy rejects active schemes, control characters and resource mail links', () => {
  for (const value of ['javascript:alert(1)', 'JaVaScript:alert(1)', 'data:text/html,test', 'file:///tmp/test', 'https://example.com/\nx', 'vbscript:1']) assert.equal(html.safeUrl(value), '');
  assert.equal(html.safeUrl('mailto:user@example.com'), 'mailto:user@example.com');
  assert.equal(html.safeUrl('mailto:user@example.com', true), '');
  assert.equal(html.safeUrl('attachments/slides/demo.pdf', true), 'attachments/slides/demo.pdf');
});
test('highlight escapes surrounding text and treats query as plain text', () => {
  assert.equal(html.highlight('<img> [x]', '[x]'), '&lt;img&gt; <mark class="search-highlight">[x]</mark>');
  assert.equal(html.highlight('abc', ''), 'abc');
});
