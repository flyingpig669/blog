const test = require('node:test');
const assert = require('node:assert/strict');
let markdown;
test.before(async () => { ({markdown} = await import('../src/lib/markdown.js')); });
const render = source => markdown.render(source, {marked: require('../vendor/marked.min.js')}).html;

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
