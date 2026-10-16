const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {createRequire} = require('node:module');
const script = path.resolve(__dirname, '../scripts/validate-content.js');
const scopedRequire = createRequire(script);
let services;
test.before(async () => { services = await require('./services').loadServices(); });
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
  const originalConsole = console.error, originalLog = console.log, originalExit = process.exitCode;
  process.exitCode = 0;
  console.error = text => messages.push(text);
  console.log = () => {};
  try { scopedRequire(script)(services, fakeFs); processStub.exitCode = process.exitCode; }
  finally { console.error = originalConsole; console.log = originalLog; process.exitCode = originalExit; }
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
