const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {createRequire} = require('node:module');
const script = path.resolve(__dirname, '../scripts/validate-content.js');
const scopedRequire = createRequire(script);
function validate(extra) {
  const messages = [];
  const fakeFs = Object.assign({}, fs, {readFileSync(name, encoding) {
    const source = fs.readFileSync(name, encoding);
    if (/data\/documents\/hello-world\./.test(name)) {
      const body = JSON.parse(source);
      body.content += '\n\n' + extra;
      return JSON.stringify(body);
    }
    return source;
  }});
  const processStub = {exitCode: 0};
  vm.runInNewContext(fs.readFileSync(script, 'utf8'), {require: name => name === 'node:fs' ? fakeFs : scopedRequire(name), __dirname: path.dirname(script), process: processStub, console: {log() {}, error: text => messages.push(text)}});
  return {code: processStub.exitCode, messages: messages.join('\n')};
}
test('validation rejects missing wiki references, documents, assets and unsafe links', () => {
  for (const source of ['[[missing-reference]]', '[missing](./missing.md)', '![image](images/missing.png)', '[bad](javascript:alert)']) {
    const result = validate(source);
    assert.equal(result.code, 1, source);
    assert.match(result.messages, /missing|unresolved|unsafe/);
  }
});
test('validation ignores reference and presentation examples inside code', () => {
  assert.equal(validate('```text\n[[missing-reference]]\n::: slide missing.pdf\n```\n\n`[[missing-inline]]`').code, 0);
});
