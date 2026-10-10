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

// 代码围栏语言 × Prism 注册表互查。
// markdown.js 对未注册语言**静默退回无高亮**（只用真正注册过的语法，这是修过的
// 历史问题），用户视角就是「高亮没了」且构建全绿 —— 这里在构建期拦下：
//   a) posts/ 与 templates/ 里用到的每个围栏语言，都必须被核心或组件注册；
//   b) vendor/prism-components/ 里的每个组件文件，都必须被 index.html 引入
//      （否则校验器加载了它、语言"已注册"，浏览器却没加载，照样丢高亮）。
{
  // 用独立的 vm 上下文加载 Prism（而不是 require + global.window）：
  // validate-content.js 本身可能被 tests/validation.test.js 放进另一个 vm 沙箱执行，
  // 那里的 global 与宿主 realm 互不相通，require 加载的 prism.js 会因宿主无 window
  // 而把 Prism 挂到一次性对象上丢掉。独立上下文不碰任何全局，两种宿主下行为一致。
  const prismCtx = { window: {}, console };
  vm.createContext(prismCtx);
  vm.runInContext(fs.readFileSync(path.join(root, 'vendor/prism.js'), 'utf8'), prismCtx, { filename: 'vendor/prism.js' });
  const componentsDir = path.join(root, 'vendor/prism-components');
  const components = fs.readdirSync(componentsDir).sort();
  for (const comp of components) {
    vm.runInContext(fs.readFileSync(path.join(componentsDir, comp), 'utf8'), prismCtx, { filename: 'vendor/prism-components/' + comp });
  }
  const HELPERS = new Set(['extend', 'insertBefore', 'DFS']); // languages 上的非语言成员
  const registered = new Set(Object.keys(prismCtx.Prism.languages).filter(l => !HELPERS.has(l)));
  const fenceLangs = new Map();
  for (const dir of ['posts', 'templates']) {
    for (const file of fs.readdirSync(path.join(root, dir), { recursive: true })) {
      if (typeof file !== 'string' || !file.endsWith('.md')) continue;
      const src = fs.readFileSync(path.join(root, dir, file), 'utf8');
      // 注意 [ \t]* 而非 \s*：\s 会跨行，把「闭合围栏 + 空行 + ---」误吞成一次匹配
      for (const m of src.matchAll(/^```[ \t]*([A-Za-z0-9_+-]*)[ \t]*$/gm)) {
        const lang = (m[1] || 'text').toLowerCase();
        if (!fenceLangs.has(lang)) fenceLangs.set(lang, new Set());
        fenceLangs.get(lang).add(path.join(dir, file));
      }
    }
  }
  for (const [lang, files] of [...fenceLangs].sort()) {
    if (!registered.has(lang)) fail(`代码围栏语言 "${lang}" 未注册 Prism 语法（${[...files].join(', ')}）—— 运行时会静默退回无高亮。请在 vendor/prism-components/ 添加组件并在 index.html 引入`);
  }
  for (const comp of fs.readdirSync(componentsDir)) {
    if (!entry.includes('vendor/prism-components/' + comp)) fail(`Prism 组件 ${comp} 存在但未被 index.html 引入 —— 浏览器不会加载它，对应语言会丢高亮`);
  }
}

// KaTeX 改为按需注入后不再出现在 index.html 的 src/href 扫描范围里，
// 这里补上加载器内 vendor 路径的存在性与白名单校验 —— 否则路径写错时
// 构建全绿、直到某篇带公式的文章被打开才 404。
{
  const loaderSource = fs.readFileSync(path.join(root, 'js/lib/katex-loader.js'), 'utf8');
  for (const m of loaderSource.matchAll(/'((?:vendor|css|js)\/[^']+)'/g)) {
    checkAsset(m[1], 'js/lib/katex-loader.js');
  }
}
// 静态分享 / SEO 元信息 × blog.config.js 互查。
// 社交爬虫（微信 / Telegram / X）不执行 JS，看不到 app.js#setDocumentTitle 的
// 运行时改写，只能读静态标签 —— og:image / og:url / canonical 必须在
// index.html 里就写成绝对地址，且与 site.url 同源；description 的三处静态
// 出现也必须与配置逐字一致（否则 navbar.js 启动覆盖后前后两个值）。
{
  const site = (config && config.site) || {};
  const siteUrl = String(site.url || '').replace(/\/+$/, '');
  if (siteUrl) {
    const metaValue = name => {
      const m = entry.match(new RegExp('<meta (?:property|name)="' + name + '" content="([^"]*)"'));
      return m ? m[1] : null;
    };
    const expectations = [
      ['og:url', siteUrl + '/'], ['og:image', siteUrl + '/og-image.png'], ['twitter:image', siteUrl + '/og-image.png']
    ];
    for (const [name, expected] of expectations) {
      const actual = metaValue(name);
      if (actual === null) fail(`index.html: 缺少 ${name} meta 标签`);
      else if (actual !== expected) fail(`index.html: ${name} 应为绝对地址 ${expected}（当前 ${actual}）—— 社交爬虫不执行 JS，相对地址会丢分享卡片`);
    }
    const canonical = entry.match(/<link rel="canonical"[^>]*href="([^"]*)"/);
    if (!canonical) fail('index.html: 缺少 canonical 链接');
    else if (canonical[1] !== siteUrl + '/') fail(`index.html: canonical 应为 ${siteUrl}/（当前 ${canonical[1]}）`);
    // 站点名同样不能两处漂移：<title> 是首屏兜底，og:site_name / og:title / twitter:title /
    // og:image:alt 是爬虫唯一能看到的值（app.js 只会在运行时覆盖 og:title 与 twitter:title）。
    if (site.title) {
      const titleEl = entry.match(/<title>([^<]*)<\/title>/);
      if (!titleEl) fail('index.html: 缺少 <title> 标签');
      else if (titleEl[1] !== site.title) fail(`index.html: <title> 应为 ${site.title}（当前 ${titleEl[1]}）—— 与 blog.config.js 的 site.title 保持一致`);
      for (const name of ['og:site_name', 'og:title', 'twitter:title', 'og:image:alt']) {
        const actual = metaValue(name);
        if (actual !== site.title) fail(`index.html: ${name} 应为 ${site.title}（当前 ${actual}）—— 社交爬虫不执行 JS，读的是静态值`);
      }
    }
    if (site.description) {
      const descCount = (entry.match(new RegExp(escapeRegExp(site.description), 'g')) || []).length;
      if (descCount < 3) fail(`index.html: description 应在页面静态出现 3 次（name/og/twitter），实际 ${descCount} 次 —— 与 blog.config.js 的 site.description 逐字一致`);
    }
  }
}
function escapeRegExp(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log(`Content checks passed: ${Object.keys(store.documents).length} documents, ${context.window.BlogRouteTable.length} routes, ${navigation.length} navigation entries.`);
