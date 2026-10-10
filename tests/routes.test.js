const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const ROUTES_SOURCE = fs.readFileSync(path.join(__dirname, '../js/lib/routes.js'), 'utf8');
const CONFIG_SOURCE = fs.readFileSync(path.join(__dirname, '../blog.config.js'), 'utf8');

function load() {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(ROUTES_SOURCE, context);
  vm.runInContext(CONFIG_SOURCE, context);
  return context.window;
}

// registry 是通过 window.BlogRouteTable 按引用读表的，所以校验前替换整张表即可。
function validateWith(mutate) {
  const ctx = load();
  const table = JSON.parse(JSON.stringify(ctx.BlogRouteTable));
  mutate(table);
  ctx.BlogRouteTable = table;
  return ctx.BlogRouteRegistry.validate().join('\n');
}

test('routing table is the single source for both routes and navigation', () => {
  const { BlogRoutes, BlogConfig, BlogRouteRegistry: registry } = load();
  assert.deepEqual(
    Object.keys(BlogRoutes).sort(),
    ['about', 'archive', 'columns', 'home', 'posts', 'roadmap', 'tags']
  );
  // 派生关系：BlogRoutes 就是表里的 name -> path，config.routes 是同一个引用。
  assert.deepEqual(BlogRoutes, registry.paths());
  assert.equal(BlogConfig.routes, BlogRoutes);
  assert.equal(BlogConfig.defaultRoute, '/');
  assert.ok(Object.isFrozen(BlogRoutes), '路由字典必须保持冻结');
});

test('navigation is derived from the table with grouping preserved', () => {
  const { BlogConfig, BlogRoutes } = load();
  const nav = BlogConfig.nav;
  // vm 里的数组与宿主 realm 的 Array 不同源，比较形状前先归一化。
  assert.deepEqual(
    Array.from(nav, item => (Array.isArray(item) ? Array.from(item, sub => sub.id) : item.id)),
    ['home', 'columns', 'archive', 'tags', ['about', 'roadmap']]
  );
  // 顶层项直接引用路由字典的值，不再各写一份字面量。
  assert.equal(nav[0].target, BlogRoutes.home);
  assert.equal(nav[3].target, BlogRoutes.tags);
  // 折叠组首项常显、其余进下拉，两项各自绑定一个 Markdown 文件。
  assert.equal(nav[4][0].target, 'file:about.md');
  assert.equal(nav[4][1].target, 'file:posts/roadmap.md');
  // posts 显式声明「有意不放入导航」，不该出现在任何一层里。
  assert.equal(nav.flat().some(item => item.id === 'posts'), false);
});

test('posts is declared as a prefix that aliases to archive', () => {
  const { BlogRouteRegistry: registry } = load();
  const posts = registry.get('posts');
  assert.equal(posts.kind, 'prefix');
  assert.equal(posts.nav, null);
  assert.equal(registry.aliasOf('posts').name, 'archive');
  assert.equal(registry.byPath('/archive').view, 'archive');
  assert.equal(registry.byPath('/nope'), null);
  assert.equal(registry.get('missing'), null);
});

test('the shipped table passes its own validation', () => {
  const { BlogRouteRegistry: registry } = load();
  assert.deepEqual(Array.from(registry.validate()), []);
});

test('validation catches identifier and path violations', () => {
  // 把 archive 改名为 columns 会与 Route[1] 撞名。
  assert.match(validateWith(t => { t[2].name = 'columns'; }), /name 与 Route\[1\] 重复/);
  assert.match(validateWith(t => { t[1].name = 'Columns'; }), /name 必须是全小写字母数字/);
  assert.match(validateWith(t => { t[1].path = '/Columns'; }), /path 非法/);
  assert.match(validateWith(t => { t[1].path = '/archive'; }), /path \/archive 与 \w+ 重复/);
  assert.match(validateWith(t => { t[1].path = '/get-columns'; }), /是动词/);
});

test('validation catches renderer and layout violations', () => {
  assert.match(validateWith(t => { t[1].view = 'unknown'; }), /view 必须是/);
  assert.match(validateWith(t => { t[1].shell = 'shell-wide'; }), /shell 必须是/);
  // 全站版心只有两档，且宽的那档只给文章详情页。
  assert.match(validateWith(t => { t[1].shell = 'shell-detail'; }), /只有文章详情/);
});

test('validation catches module shape and route layering violations', () => {
  assert.match(validateWith(t => { delete t[1].detail; }), /必须声明 detail 二级路由/);
  assert.match(validateWith(t => { t[1].detail = '/other/:id'; }), /detail 必须以/);
  assert.match(validateWith(t => { t[1].kind = 'page'; }), /不应声明 detail/);
  assert.match(validateWith(t => { t[1].kind = 'unknown'; }), /kind 必须是/);
});

test('validation catches navigation declaration and alias violations', () => {
  assert.match(validateWith(t => { delete t[1].nav; }), /必须显式声明 nav/);
  assert.match(validateWith(t => { t[1].nav.label = ''; }), /nav\.label 不能为空/);
  // 无导航入口又无 alias 的页面 = 孤岛页，必须显式写 nav: null 并给出理由。
  assert.match(validateWith(t => { t[2].nav = null; }), /会成为孤岛页/);
  assert.equal(validateWith(t => { t[2].nav = null; t[2].alias = 'home'; }), '');
  assert.match(validateWith(t => { t[4].alias = 'nowhere'; }), /alias 指向的模块 "nowhere" 不存在/);
  assert.match(validateWith(t => { t[4].alias = 'posts'; }), /alias 不能指向自己/);
});
