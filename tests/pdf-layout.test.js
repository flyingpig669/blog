const test = require('node:test');
const assert = require('node:assert/strict');
let pdfLayout, previewFileName;
test.before(async () => { ({pdfLayout, previewFileName} = await import('../src/lib/pdf-layout.js')); });
const near = (value, expected) => assert.ok(Math.abs(value - expected) < 1e-8, `${value} != ${expected}`);

test('inline documents fit width without capping portrait or long-page heights', () => {
  const portrait = pdfLayout({pageWidth:600, pageHeight:900, width:660, height:200});
  assert.equal(portrait.width, 660);
  near(portrait.height, 990);
  const long = pdfLayout({pageWidth:600, pageHeight:2400, width:660, height:200});
  near(long.height, 2640);
  const landscape = pdfLayout({pageWidth:900, pageHeight:600, width:660});
  near(landscape.height, 440);
});

test('fullscreen fits both dimensions while resizing and zoom preserve the page ratio', () => {
  const fit = pdfLayout({pageWidth:600, pageHeight:900, width:1000, height:600, fullscreen:true});
  assert.equal(fit.width, 400);
  assert.equal(fit.height, 600);
  const phone = pdfLayout({pageWidth:600, pageHeight:900, width:264, zoom:2});
  assert.equal(phone.width, 528);
  assert.equal(phone.height, 792);
});

test('large pages preserve display dimensions while the canvas pixel budget stays bounded', () => {
  const layout = pdfLayout({pageWidth:1000, pageHeight:10000, width:1000, zoom:3, pixelRatio:3});
  assert.equal(layout.width, 3000);
  assert.equal(layout.height, 30000);
  assert.ok(layout.width * layout.height * layout.density ** 2 <= 16_000_001);
});

test('preview names decode the source filename without including query strings', () => {
  assert.equal(previewFileName('attachments/%E4%BD%9C%E4%B8%9A.pdf?download=1#page=2'), '作业.pdf');
  assert.equal(previewFileName('https://example.com/notes%broken.pdf'), 'notes%broken.pdf');
});
