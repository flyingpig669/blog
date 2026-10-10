const test = require('node:test');
const assert = require('node:assert/strict');
const {spawnSync} = require('node:child_process');
test('search text preserves content after a presentation and hides link syntax', () => {
  const source = '# Title\n\n[Label](https://example.com)\n\n::: slide attachments/demo.pdf\nDeck\n:::\n\nAfter presentation needle\n\n[[slug|Wiki label]]';
  const result = spawnSync(process.execPath, ['scripts/search-text.js'], {input: JSON.stringify({sample:source}), encoding:'utf8'});
  assert.equal(result.status, 0, result.stderr);
  const text = JSON.parse(result.stdout).sample;
  assert.match(text, /After presentation needle/);
  assert.match(text, /Wiki label/);
  assert.doesNotMatch(text, /attachments\/demo.pdf|https:\/\/example.com|:::/);
});
