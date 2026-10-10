// Validate the same registry and link resolver used by the browser.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const marked = require('../vendor/marked.min.js');
const root = path.resolve(__dirname, '..');
const context = { window: {}, console, localStorage: { removeItem() {}, getItem() {}, setItem() {} }, document: { documentElement: { classList: { add() {} } } } };
vm.createContext(context);
for (const name of ['js/lib/routes.js', 'blog.config.js', 'js/posts-data.js', 'js/lib/html.js', 'js/store.js', 'js/lib/router.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, name), 'utf8'), context, { filename: name });
}
const { BlogStore: store, BlogRouter: router, BlogHtml: html, BlogConfig: config, BlogRouteRegistry: registry } = context.window;
store.init();
const errors = [];
const fail = message => errors.push(message);

// 0) 路由声明表自洽：命名格式、路径唯一、模块形态、路由层级、导航声明、alias 指向。
//    第 6 节的全部硬约束都在这里变成构建期报错，不依赖人读 checklist。
for (const issue of registry.validate()) fail(issue);

// 0b) 版心两档的机器校验：表里声明的 shell 必须与渲染函数实际写的类一致。
//     全站版心只有 720px / 1000px 两档，且只有文章详情页可以用宽的那档 ——
//     此前这条规则只能靠人看截图发现，现在改坏会直接构建失败。
const RENDERERS = {
  home: 'renderHomeView', columns: 'renderColumnsView', archive: 'renderArchivesView',
  tags: 'renderTagsView', post: 'renderPostView', page: 'renderPageView', dynamic: 'renderDynamicNavView'
};
const appSource = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');
for (const def of context.window.BlogRouteTable) {
  const renderer = RENDERERS[def.view];
  if (!renderer) { fail(`Route ${def.name}: view "${def.view}" 没有登记的渲染函数`); continue; }
  const start = appSource.indexOf(renderer + ': function');
  if (start === -1) { fail(`Route ${def.name}: js/app.js 中找不到渲染函数 ${renderer}`); continue; }
  const rest = appSource.slice(start + 1);
  const next = rest.search(/\n  [A-Za-z_][A-Za-z0-9_]*: function/);
  const body = next === -1 ? rest : rest.slice(0, next);
  const found = body.match(/class="(shell(?:-detail)?) mx-auto/);
  if (!found) fail(`Route ${def.name}: ${renderer} 中找不到 'shell mx-auto' 版心容器`);
  else if (found[1] !== def.shell) fail(`Route ${def.name}: 表里声明 ${def.shell}，但 ${renderer} 实际用的是 ${found[1]}`);
}

const registryPaths = Object.values(config.routes);
const navigation = router.getFlattenedNav();
const usedRoutes = new Set();
function routeExists(route) {
  const [base, query = ''] = route.replace(/^#/, '').split('?');
  if (registryPaths.includes(base) || navigation.some(item => item._route === base)) return true;
  if (base.startsWith(config.routes.posts + '/')) return !!store.getPostById(decodeURIComponent(base.slice(config.routes.posts.length + 1)));
  if (base.startsWith(config.routes.columns + '/')) return !!store.getColumnById(decodeURIComponent(base.slice(config.routes.columns.length + 1)));
  if (base.startsWith(config.routes.tags + '/')) {
    const tags = store.getAllTags().map(tag => store.tagSlug(tag.name));
    return base.slice(config.routes.tags.length + 1).split('/').every(tag => tags.includes(decodeURIComponent(tag)));
  }
  return false;
}
for (const item of navigation) {
  // 即席导航项（外部链接等）用 href 而非 target，不参与站内路由互查。
  if (item.href) {
    if (!html.safeUrl(item.href)) fail(`Navigation ${item.id}: unsafe URL`);
    continue;
  }
  if (!/^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*)?$/.test(item._route)) fail(`Navigation ${item.id}: invalid route ${item._route}`);
  if (!registryPaths.includes(item._route)) fail(`Navigation ${item.id}: route is missing from BlogRoutes`);
  if (usedRoutes.has(item._route)) fail(`Duplicate navigation route: ${item._route}`);
  usedRoutes.add(item._route);
  const target = router.parseTarget(item);
  if (target.mode === 'file' && !store.getDoc(target.value).data) fail(`Navigation ${item.id}: missing document ${target.value}`);
  if (target.mode === 'dir' && !fs.existsSync(path.join(root, target.value))) fail(`Navigation ${item.id}: missing directory ${target.value}`);
}
// 反向互查：表里声明了导航入口的模块，必须都真的出现在导航里（第 7.6 节）。
// 只加表行、忘了派生导航的写法会在这里被拦下。
for (const def of context.window.BlogRouteTable) {
  if (!def.nav) continue;
  if (!navigation.some(item => item.id === def.name)) fail(`Route ${def.name}: 声明了导航入口，但导航数组里没有它`);
}
// 发布白名单（与 .github/workflows/static.yml 的 Assemble site 保持同步）：
// 线上只会部署这些目录与根级文件。内容里引用的本地资源若不在其中，
// 本地预览一切正常、构建也查不出（文件确实存在），但**线上必 404** ——
// 这里在构建期直接拦下并指路 attachments/。
const PUBLISHED_DIRS = ['attachments/', 'css/', 'js/', 'vendor/', 'data/'];
const PUBLISHED_FILES = new Set(['index.html', 'blog.config.js', 'robots.txt', '404.html', 'og-image.png', 'sitemap.xml']);
function checkAsset(value, source) {
  if (!html.safeUrl(value, true)) { fail(`${source}: unsafe resource ${value}`); return; }
  if (/^(?:https?:)?\/\//i.test(value)) return;
  // './' / '/' 归一化为站点根（线上首页本身，总是发布的）
  const target = decodeURIComponent(value.split(/[?#]/)[0]).replace(/^(?:\/|\.{0,2}\/)+/, '');
  if (!target) return;
  const absolute = path.resolve(root, target);
  if (!(absolute === root || absolute.startsWith(root + path.sep)) || !fs.existsSync(absolute)) fail(`${source}: missing resource ${value}`);
  else if (!PUBLISHED_DIRS.some(dir => target.startsWith(dir)) && !PUBLISHED_FILES.has(target)) {
    fail(`${source}: resource ${value} 不在发布白名单内（本地可见、线上 404）。静态资源请放入 attachments/，见 templates/template-media-attachments.md`);
  }
}
function checkLink(value, source, wiki = false) {
  if (!html.safeUrl(value)) { fail(`${source}: unsafe link ${value}`); return; }
  if (/^(?:https?:\/\/|mailto:|tel:)/i.test(value)) return;
  if (value.startsWith('#/') || value.startsWith('/') && !/\.md(?:$|[?#])/i.test(value)) {
    if (wiki || value.startsWith('#/')) {
      if (!routeExists(value)) fail(`${source}: unknown route ${value}`);
      return;
    }
  }
  if (value.startsWith('#') && !wiki) return;
  if (wiki) {
    if (!store.resolveLink(value)) fail(`${source}: unresolved reference [[${value}]]`);
  } else if (/\.(md|markdown)(?:$|[?#])/i.test(value)) {
    let clean = value.split(/[?#]/)[0].replace(/^\//, '');
    if (!/^\/?posts\//i.test(value) && !value.startsWith('/')) clean = path.posix.normalize(path.posix.join(path.posix.dirname(source), clean));
    if (!store.resolveLink(clean)) fail(`${source}: missing document ${value}`);
  } else checkAsset(value, source);
}
function walk(tokens, source) {
  for (const token of tokens) {
    if (['code', 'codespan', 'html'].includes(token.type)) continue;
    if (token.type === 'link') checkLink(token.href, source);
    if (token.type === 'image') checkAsset(token.href, source);
    if (token.type === 'text' && !token.tokens) {
      for (const match of token.text.matchAll(/\[\[([^\[\]\r\n]+)\]\]/g)) checkLink(match[1].split('|')[0].trim(), source, true);
      for (const match of token.text.matchAll(/:::\s*(?:slide|pdf|deck)\s+([^\s\r\n]+)/g)) checkAsset(match[1], source);
    }
    if (token.tokens) walk(token.tokens, source);
    if (token.items) for (const item of token.items) walk(item.tokens || [], source);
    if (token.type === 'table') for (const cell of [...token.header, ...token.rows.flat()]) walk(cell.tokens || [], source);
  }
}
for (const doc of Object.values(store.documents)) {
  checkAsset(doc.bodyUrl, doc.sourcePath);
  const body = JSON.parse(fs.readFileSync(path.join(root, doc.bodyUrl), 'utf8'));
  if (body.slug !== doc.slug || typeof body.content !== 'string') fail(`${doc.sourcePath}: invalid document body`);
  walk(marked.lexer(body.content), doc.sourcePath);
  for (const value of [...(body.attachments || []), body.slide, body.pdf].filter(Boolean)) checkAsset(value, doc.sourcePath);
  for (const item of [...(body.contacts || []), ...(body.social || [])]) checkLink(item.url || item.href || '', doc.sourcePath);
  for (const pub of body.publications || []) {
    for (const [kind, value] of Object.entries(pub.links || {})) {
      if (['doi', 'arxiv'].includes(kind) && !value.includes('://')) continue;
      checkLink(value, doc.sourcePath);
    }
  }
}
checkAsset(store.searchUrl, 'search');
// Local entry dependencies must exist; runtime-only PDF assets are also checked.
const entry = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const tagSlugs = new Set();
for (const tag of store.getAllTags()) {
  const slug = store.tagSlug(tag.name);
  if (!slug || /[^\x00-\x7f]/.test(tag.name) || tagSlugs.has(slug)) fail(`Tag ${tag.name}: needs a unique English route slug`);
  tagSlugs.add(slug);
}
for (const match of entry.matchAll(/(?:src|href)="([^"#]+)"/g)) {
  if (!/^(https?:|mailto:|tel:|data:image\/svg\+xml,)/i.test(match[1])) checkAsset(match[1], 'index.html');
}
for (const name of ['vendor/pdfjs/pdf.min.js', 'vendor/pdfjs/pdf.worker.min.js', 'js/slide-viewer.js']) checkAsset(name, 'PDF viewer');
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log(`Content checks passed: ${Object.keys(store.documents).length} documents, ${context.window.BlogRouteTable.length} routes, ${navigation.length} navigation entries.`);
