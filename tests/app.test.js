const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function createApp() {
  const scripts = [];
  const context = { window: {}, console, document: {
    createElement: () => ({ remove() { this.removed = true; } }),
    head: { appendChild(script) { scripts.push(script); } }
  } };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(require.resolve('../js/lib/routes.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(require.resolve('../js/lib/html.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(require.resolve('../js/lib/router.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(require.resolve('../js/app.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(require.resolve('../js/components/publications.js'), 'utf8'), context);
  context.window.BlogApp.publications = context.window.BlogPublications.create({ html: context.window.BlogHtml });
  return { app: context.window.BlogApp, context, scripts };
}

test('missing file navigation renders not found', () => {
  const { app, context } = createApp();
  context.window.BlogStore = { getDoc: () => ({ kind: null, data: null }) };
  let missing;
  app.renderNotFoundView = file => { missing = file; };
  app.renderFileTarget('missing.md', {});
  assert.equal(missing, 'missing.md');
});

test('index metadata selects its layout without changing the document identifier', () => {
  const { app, context } = createApp();
  const post = { slug: '阅读索引', title: '阅读索引', type: 'index', content: '## 数学' };
  context.window.BlogStore = { getPostById: () => post };
  context.document.getElementById = () => ({ innerHTML: '' });
  app.setDocumentTitle = () => {};
  let rendered;
  app.renderIndexView = value => { rendered = value; };
  app.renderPostView('阅读索引');
  assert.equal(rendered, post);
});

test('chapter navigation updates its module before the body finishes loading', () => {
  const {app,context} = createApp();
  const post = {slug: 'chapter', column: 'book', type: 'books', bodyUrl: 'body.json'};
  context.document.getElementById = () => ({});
  context.window.BlogStore = {
    getPostById: () => post,
    getColumnById: () => ({posts: [post]})
  };
  const actions = [];
  app.setActiveNav = id => actions.push(id);
  app.loadDocumentView = () => actions.push('loading');
  app.renderPostView('chapter');
  assert.deepEqual(actions, ['books', 'loading']);
});

test('book indexes and chapter links use their owning collection module', () => {
  const { app, context } = createApp();
  const book = { id: 'git-from-the-bottom-up', name: 'Git from the Bottom Up', posts: [
    { slug: 'git-bottom-up-introduction', title: 'Introduction', type: 'books', order: 1 }
  ] };
  const column = { id: 'physics', name: 'Physics', posts: [{ type: 'normal' }] };
  context.window.BlogStore = { getColumns: () => [book, column] };
  const main = {};
  context.document.getElementById = () => main;
  app.setDocumentTitle = () => {};
  assert.equal(app.columnHref(book), '#/books/git-from-the-bottom-up');
  assert.equal(app.columnHref(column), '#/columns/physics');
  app.renderColumnsView(null, 'books');
  assert.match(main.innerHTML, /Git from the Bottom Up/);
  assert.doesNotMatch(main.innerHTML, /Physics/);
  app.renderColumnsView('git-from-the-bottom-up', 'books');
  assert.match(main.innerHTML, /#\/books"/);
  assert.match(main.innerHTML, /#\/posts\/git-bottom-up-introduction/);
  app.renderColumnsView(null, 'columns');
  assert.match(main.innerHTML, /Physics/);
  assert.doesNotMatch(main.innerHTML, /Git from the Bottom Up/);
});

test('a stale document response cannot replace a newer route', async () => {
  const { app, context } = createApp();
  let resolve;
  context.history = {state: {auroraScroll: 100}};
  context.window.BlogStore = {loadDocument: () => new Promise(done => {resolve = done;})};
  const main = {};
  context.document.getElementById = () => main;
  app.setDocumentTitle = () => {};
  app.renderArchivesView = () => {};
  app.routeRevision = 1;
  let rendered = false;
  app.loadDocumentView({title: 'old'}, () => {rendered = true;});
  app.routeRevision = 2;
  main.innerHTML = 'new route';
  resolve();
  await new Promise(done => setImmediate(done));
  assert.equal(rendered, false);
  assert.equal(main.innerHTML, 'new route');
});

test('lazy dependency failures notify all callers and permit retry', () => {
  const { app, scripts } = createApp();
  const results = [];
  app.ensureSlideViewer(error => results.push(error));
  app.ensureSlideViewer(error => results.push(error));
  assert.equal(scripts.length, 1);
  scripts[0].onerror();
  assert.equal(results.length, 2);
  assert.ok(results.every(error => error.message.includes('Unable to load')));
  assert.equal(app._slideQueue, null);
  app.ensureSlideViewer(error => results.push(error));
  assert.equal(scripts.length, 2);
  scripts[1].onload();
  scripts[2].onload();
  assert.equal(results[2], undefined);
});

test('legacy hash paths with /blog prefix normalize via replaceState', () => {
  const { app, context } = createApp();
  let replaced = null;
  context.history = {
    replaceState(_state, _title, url) {
      replaced = url;
    }
  };
  context.window.location = { hash: '#/blog/archive', pathname: '/', search: '' };
  context.window.BlogStore = {
    getPosts: () => [],
    config: { defaultRoute: '/' }
  };
  context.window.BlogScrollState = { restore() {} };
  context.window.BlogRouteRegistry.aliasOf = () => null;
  context.window.BlogRoutes = { home: '/', archive: '/archive', posts: '/posts', tags: '/tags', columns: '/columns' };
  context.window.scrollTo = () => {};
  context.document.querySelectorAll = () => [];
  context.document.getElementById = () => ({ innerHTML: '' });
  app.closeMobileDrawer = () => {};
  app.closeMobileOutline = () => {};
  app.closeNavDropdowns = () => {};
  app.setActiveNav = () => {};
  app.setDocumentTitle = () => {};
  app.renderArchivesView = () => {};

  app.handleRoute();
  assert.equal(replaced, '/#/archive');
});

test('home navigation forwards its page query to the home renderer', () => {
  const {app,context} = createApp();
  context.URLSearchParams = URLSearchParams;
  app.parseTarget = () => ({mode: 'route'});
  let page;
  app.renderHomeView = value => {page = value;};
  app.dispatchNavItem({id: 'home'}, '/', '?page=3');
  assert.equal(page, '3');
  assert.equal(app.currentRoute.name, 'home');
});

test('mobile outline cancels pending animations on rapid toggles', () => {
  const {app,context} = createApp();
  const classes = new Set(['hidden', 'translate-x-full']);
  const drawer = {classList: {
    contains: value => classes.has(value),
    add: value => classes.add(value),
    remove: value => classes.delete(value)
  }};
  let expanded = 'false';
  const toggle = {
    getAttribute: () => expanded,
    setAttribute: (_key, value) => { expanded = value; }
  };
  const timers = new Map();
  let nextId = 0;
  context.setTimeout = callback => { timers.set(++nextId, callback); return nextId; };
  context.clearTimeout = id => timers.delete(id);
  context.document.getElementById = () => drawer;
  context.document.querySelector = () => toggle;
  const flush = () => { for (const callback of timers.values()) callback(); timers.clear(); };

  app.toggleMobileOutline();
  app.toggleMobileOutline();
  flush();
  assert.equal(expanded, 'false');
  assert.ok(classes.has('hidden'));
  assert.ok(classes.has('translate-x-full'));

  app.toggleMobileOutline();
  flush();
  app.closeMobileOutline();
  app.toggleMobileOutline();
  flush();
  assert.equal(expanded, 'true');
  assert.ok(!classes.has('hidden'));
  assert.ok(!classes.has('translate-x-full'));
});
