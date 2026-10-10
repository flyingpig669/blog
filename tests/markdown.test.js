const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const context = {
  window: {},
  marked: require('../vendor/marked.min.js')
};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/markdown.js'), 'utf8'), context);
const render = source => context.window.BlogMarkdown.render(source).html;

test('formulas and custom directives in code stay literal', () => {
  for (const source of [
    '```latex\n$$E=mc^2$$\n```',
    '~~~latex\n$$E=mc^2$$\n~~~',
    '> ```latex\n> $$E=mc^2$$\n> ```',
    '    $$E=mc^2$$\n',
    '```latex\r\n$$E=mc^2$$\r\n```'
  ]) {
    const html = render(source);
    assert.match(html, /<code[^>]*>\$\$E=mc\^2\$\$/);
    assert.doesNotMatch(html, /quantum-math-block/);
  }
  assert.match(render('`\\(x\\)`'), /<code>\\\(x\\\)<\/code>/);
  assert.match(render('~~~text\n::: tip\n[[#algebra]]\n::: \n~~~'), /::: tip\n\[\[#algebra\]\]/);
});

test('math outside code still renders after a fenced block', () => {
  const html = render('```latex\n$$x$$\n```\n\n$$y$$');
  assert.match(html, /<code[^>]*>\$\$x\$\$/);
  assert.match(html, /<code class="font-mono text-xs">y<\/code>/);
});
