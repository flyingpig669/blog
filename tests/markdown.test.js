const test = require('node:test');
const assert = require('node:assert/strict');
let markdown;
test.before(async () => { ({markdown} = await import('../src/lib/markdown.js')); });
const render = source => markdown.render(source, {marked: require('../vendor/marked.min.js')}).html;
test('callout icons render through the imported module without shadowing it',()=>{
  const html=render('::: tip <title>\nContent\n:::');
  assert.match(html,/callout-tip/);
  assert.match(html,/<svg/);
  assert.match(html,/&lt;title&gt;/);
});

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

test('template comments cannot activate PDF or math preprocessing', () => {
  const html = render('<!--\n::: slide attachments/missing.pdf\n::: \n$$hidden$$\n-->\n\nVisible text');
  assert.doesNotMatch(html, /article-slide-player-mount|missing\.pdf|hidden/);
  assert.match(html, /Visible text/);
  assert.match(render('```html\n<!-- keep this example -->\n```'), /&lt;!-- keep this example --&gt;/);
});

test('unnamed PDF directives leave labeling to the common document preview', () => {
  const html = render('::: pdf attachments/files/notes.pdf\n:::');
  assert.match(html, /data-slide-title=""/);
  assert.doesNotMatch(html, /课件预览/);
  assert.match(render('::: pdf attachments/files/notes.pdf 指定标题\n:::'), /data-slide-title="指定标题"/);
});
