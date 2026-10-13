const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
function load() {
  const ctx = {window: {}};
  vm.createContext(ctx);
  for (const file of ['lib/html', 'lib/post-navigation', 'components/post-header', 'components/post-content', 'components/post-adjacent', 'components/post-outline', 'layouts/post-layout']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/'+file+'.js'), 'utf8'), ctx);
  }
  return ctx.window;
}
test('article layout preserves chapter navigation, lazy PDF mounts and delegated outlines', () => {
  const w = load();
  const posts = [{slug:'first', order:1, title:'First'}, {slug:'second', order:2, title:'<script>Second</script>'}];
  const post = {...posts[1], column:'book', date:'2026-10-12', updated:'2026-10-13', slide:'attachments/sample.pdf', slideExplicit:true};
  const column = {id:'book',name:'Book',posts,postsCount:2};
  const nav = w.BlogPostNavigation.resolve(post,{getColumnById:()=>column});
  assert.equal(nav.prevPost.slug, 'first');
  assert.equal(nav.nextPost, null);
  const model = {...nav,post,features:{},toc:[{id:'heading-1',text:'<Heading>',level:2}],renderedHtml:'<p>Sanitized body</p>'};
  const services = {escapeHtml:w.BlogHtml.escapeHtml,postHref:p=>'#/posts/'+p.slug,columnHref:()=> '#/books/book',routeHref:()=> '#/',tagHref:()=> '#/tags/topic',formatWordCount:String};
  const html = w.BlogPostLayout.render(model,services);
  assert.match(html,/shell-detail mx-auto/);
  assert.match(html,/data-slide-primary="1"/);
  assert.match(html,/data-outline-toggle/);
  assert.match(html,/data-outline-target="heading-1"/);
  assert.match(html,/更新于 2026-10-13/);
  assert.match(html,/&lt;script&gt;Second/);
  assert.doesNotMatch(html,/<script>|onclick=|<iframe/);
  assert.equal(model.colIndex,1);
});
