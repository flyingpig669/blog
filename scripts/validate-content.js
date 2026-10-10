// Validate the same registry and link resolver used by the browser.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const marked = require('../vendor/marked.min.js');
const root = path.resolve(__dirname, '..');
const context = { window: {}, console, localStorage: { removeItem() {}, getItem() {}, setItem() {} }, document: { documentElement: { classList: { add() {} } } } };
vm.createContext(context);
for (const name of ['blog.config.js', 'js/posts-data.js', 'js/lib/html.js', 'js/store.js', 'js/lib/router.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, name), 'utf8'), context, { filename: name });
}
const { BlogStore: store, BlogRouter: router, BlogHtml: html, BlogConfig: config } = context.window;
store.init();
const errors = [];
const fail = message => errors.push(message);
const registry = Object.values(config.routes);
const navigation = router.getFlattenedNav();
const usedRoutes = new Set();
function routeExists(route) {
  const [base, query = ''] = route.replace(/^#/, '').split('?');
  if (registry.includes(base) || navigation.some(item => item._route === base)) return true;
  if (base.startsWith(config.routes.posts + '/')) return !!store.getPostById(decodeURIComponent(base.slice(config.routes.posts.length + 1)));
  if (base.startsWith(config.routes.columns + '/')) return !!store.getColumnById(decodeURIComponent(base.slice(config.routes.columns.length + 1)));
  if (base.startsWith(config.routes.tags + '/')) {
    const tags = store.getAllTags().map(tag => store.tagSlug(tag.name));
    return base.slice(config.routes.tags.length + 1).split('/').every(tag => tags.includes(decodeURIComponent(tag)));
  }
  return false;
}
for (const item of navigation) {
  if (!/^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*)?$/.test(item._route)) fail(`Navigation ${item.id}: invalid route ${item._route}`);
  if (!registry.includes(item._route)) fail(`Navigation ${item.id}: route is missing from BlogRoutes`);
  if (usedRoutes.has(item._route)) fail(`Duplicate navigation route: ${item._route}`);
  usedRoutes.add(item._route);
  const target = router.parseTarget(item);
  if (target.mode === 'file' && !store.getDoc(target.value).data) fail(`Navigation ${item.id}: missing document ${target.value}`);
  if (target.mode === 'dir' && !fs.existsSync(path.join(root, target.value))) fail(`Navigation ${item.id}: missing directory ${target.value}`);
  if (item.href && !html.safeUrl(item.href)) fail(`Navigation ${item.id}: unsafe URL`);
}
function checkAsset(value, source) {
  if (!html.safeUrl(value, true)) { fail(`${source}: unsafe resource ${value}`); return; }
  if (/^(?:https?:)?\/\//i.test(value)) return;
  const target = decodeURIComponent(value.split(/[?#]/)[0]).replace(/^\//, '');
  const absolute = path.resolve(root, target);
  if (!(absolute === root || absolute.startsWith(root + path.sep)) || !fs.existsSync(absolute)) fail(`${source}: missing resource ${value}`);
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
else console.log(`Content checks passed: ${Object.keys(store.documents).length} documents, ${navigation.length} navigation entries.`);
