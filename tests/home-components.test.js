const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
function load() {
  const ctx = {window: {}};
  vm.createContext(ctx);
  for (const file of ['lib/html', 'components/pagination', 'components/post-item']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/'+file+'.js'), 'utf8'), ctx);
  }
  return ctx.window;
}
test('home pagination uses query URLs and book entries link to the collection', () => {
  const w = load();
  const services={escapeHtml:w.BlogHtml.escapeHtml,routeHref:()=> '#/',columnHref:()=> '#/books/book'};
  const html=w.BlogPagination.render({page:2,pageCount:3},services);
  assert.match(html,/rel="prev" href="#\/"/);
  assert.match(html,/rel="next" href="#\/\?page=3"/);
  assert.equal(w.BlogPagination.render({page:1,pageCount:1},services),'');
  const book=w.BlogPostItem.render({kind:'book',title:'Book',collection:{id:'book'},chapterCount:18},services);
  assert.match(book,/href="#\/books\/book"/);
  assert.match(book,/18 CHAPTERS/);
});
