const test = require('node:test');
const assert = require('node:assert/strict');
let services;
test.before(async () => { services = await require('./services').loadServices(); });
test('Vue content state is reactive, isolated and validates its JSON index', async () => {
  const {isReactive} = await import('vue');
  const first = services.createStore(), second = services.createStore();
  assert.ok(isReactive(first));
  first.posts = [{slug:'local'}];
  assert.equal(second.posts,undefined);
  assert.throws(() => second.init({schemaVersion:0}),/版本不匹配/);
});
function createStore() {
  const store = services.createStore();
  store.posts = [
    { id: 'post-demo', slug: 'other-roadmap', relPath: 'demo/roadmap.md', type: 'normal', title: 'Other roadmap', tags: ['algebra'] },
    { id: 'post-roadmap', slug: 'roadmap', relPath: 'roadmap.md', type: 'post', title: 'Roadmap' }
  ];
  const page = { title: 'Structured Roadmap', slug: 'roadmap' };
  store.pages = { roadmap: page, 'roadmap.md': page };
  store.rawColumns = [];
  return store;
}

test('lazy bodies share a request and failed validation permits retry', async (t) => {
  let calls = 0, body = {slug: 'wrong', content: 'body'};
  const originalFetch = global.fetch;
  t.after(() => { global.fetch = originalFetch; });
  global.fetch = async () => { calls++; return {ok: true, json: async () => body}; };
  const store = services.createStore();
  store._requests = new Map();
  const doc = {slug: 'sample', bodyUrl: 'sample.json'};
  const pending = [store.loadDocument(doc), store.loadDocument(doc)];
  await Promise.all(pending.map(task => assert.rejects(task, /Invalid document/)));
  assert.equal(calls, 1);
  body = {slug: 'sample', content: 'valid'};
  await store.loadDocument(doc);
  assert.equal(calls, 2);
  assert.equal(doc.content, 'valid');
  await store.loadDocument(doc);
  assert.equal(calls, 2);
});

test('full document paths take precedence over page basenames', () => {
  const store = createStore();
  for (const key of ['demo/roadmap.md', 'posts/demo/roadmap.md']) {
    assert.equal(store.getDoc(key).kind, 'post');
    assert.equal(store.getDoc(key).data.title, 'Other roadmap');
    assert.equal(store.getPage(key).title, 'Other roadmap');
  }
  assert.equal(store.getDoc('missing/roadmap.md').data, null);
  assert.equal(store.getDoc('posts/roadmap.md').data.title, 'Structured Roadmap');
});

test('explicit tag references resolve to tag routes', () => {
  const store = createStore();
  assert.equal(store.resolveLink('#algebra').route, '/tags/algebra');
  assert.equal(store.resolveLink('#ALGEBRA').route, '/tags/algebra');
  assert.equal(store.resolveLink('#missing'), null);
  assert.equal(store.tagSlug('Getting Started'), 'getting-started');
  assert.equal(store.tagSlug('Engineering'), 'engineering');
});

test('post identifiers do not match arbitrary suffixes', () => {
  const store = createStore();
  assert.equal(store.getPostById('demo'), null);
  assert.equal(store.getPostById('other-roadmap').relPath, 'demo/roadmap.md');
});

test('archive ignores pinning and search ranks title above body', () => {
  const store = createStore();
  store.posts = [
    { title: 'Old', slug: 'old', date: '2026-01-01', pinned: true, content: 'needle' },
    { title: 'Newest', slug: 'new', date: '2026-10-10', content: 'needle' },
    { title: 'Needle', slug: 'needle', date: '2026-06-01' }
  ];
  assert.equal(store.getPosts()[0].slug, 'old');
  assert.equal(store.getPosts({sort: 'date'})[0].slug, 'new');
  assert.equal(store.searchPosts('needle')[0].slug, 'needle');
});

test('store site fallback defaults align with brand metadata', () => {
  const store = services.createStore();
  store.init({schemaVersion:2,documents:{},posts:[],columns:[],aliases:{},searchUrl:''}, {});
  assert.equal(store.site.title, 'CCC de Notes');
  assert.equal(store.site.brand, 'CCC de Notes');
});


test('Chinese tags resolve through encoded route segments', () => {
  const store = createStore();
  store.posts[0].tags = ['量子力学', '中文 标签'];
  assert.equal(store.tagSlug('量子力学'), '量子力学');
  assert.equal(store.tagSlug('中文 标签'), '中文-标签');
  assert.equal(store.resolveLink('#量子力学').route, '/tags/' + encodeURIComponent('量子力学'));
});

test('same-day post ordering is independent of file scanning and shared by directory lists', () => {
  const store = createStore();
  const posts = [
    { slug: 'chapter-10', title: 'Chapter 10', column: 'book', order: 10, date: '2026-10-12', relPath: 'demo/10.md' },
    { slug: 'z', title: 'Z', date: '2026-10-12', relPath: 'demo/z.md' },
    { slug: 'chapter-2', title: 'Chapter 2', column: 'book', order: 2, date: '2026-10-12', relPath: 'demo/2.md' },
    { slug: 'a', title: 'A', date: '2026-10-12', relPath: 'demo/a.md' },
    { slug: 'old', title: 'Old', date: '2026-10-11', relPath: 'demo/old.md' },
    { slug: 'undated', title: 'Undated', date: 'invalid', relPath: 'demo/undated.md' }
  ];
  const expected = ['a', 'z', 'chapter-2', 'chapter-10', 'old', 'undated'];
  store.posts = posts;
  assert.deepEqual(Array.from(store.getPosts({sort: 'date'}), p => p.slug), expected);
  store.posts = posts.slice().reverse();
  assert.deepEqual(Array.from(store.getPosts({sort: 'date'}), p => p.slug), expected);
  assert.deepEqual(Array.from(store.getPostsByDir('demo'), p => p.slug), expected);
});

test('collection chapters always follow their order including zero', () => {
  const store = createStore();
  store.documents = {
    later: { slug: 'later', order: 2, date: '2026-10-12' },
    first: { slug: 'first', order: 0, date: '2026-10-01' },
    middle: { slug: 'middle', order: 1, date: '2026-10-10' }
  };
  store.rawColumns = [{ id: 'book', postIds: ['later', 'first', 'middle'] }];
  assert.deepEqual(Array.from(store.getColumns()[0].posts, p => p.slug), ['first', 'middle', 'later']);
});

test('content type filtering includes books and indexes in the post stream', () => {
  const store = createStore();
  store.posts = [
    {slug: 'article', type: 'normal', date: '2026-10-12'},
    {slug: 'chapter', type: 'books', date: '2026-10-12'},
    {slug: 'index', type: 'index', date: '2026-10-12'},
    {slug: 'page', type: 'post', date: '2026-10-12'}
  ];
  assert.equal(store.getPosts().length, 3);
  assert.deepEqual(Array.from(store.getPosts({type: 'books'}), p => p.slug), ['chapter']);
  assert.deepEqual(Array.from(store.getPosts({type: 'index'}), p => p.slug), ['index']);
});

test('home visibility hides even pinned articles only from the home query', () => {
  const store = createStore();
  store.posts = [
    {slug: 'default', title: 'Default article', date: '2026-10-12', tags: ['topic']},
    {slug: 'visible', title: 'Visible article', home: true, date: '2026-10-12'},
    {slug: 'hidden', title: 'Hidden article', home: false, pinned: true, date: '2026-10-12', tags: ['topic'], relPath: 'demo/hidden.md'}
  ];
  assert.deepEqual(Array.from(store.getPosts({home: true}), p => p.slug), ['default', 'visible']);
  assert.equal(store.getPosts({sort: 'date'}).length, 3);
  assert.ok(store.getPosts({tag: 'topic'}).some(p => p.slug === 'hidden'));
  assert.equal(store.searchPosts('hidden')[0].slug, 'hidden');
  assert.equal(store.getPostsByDir('demo')[0].slug, 'hidden');
  assert.equal(store.getPostById('hidden').slug, 'hidden');
});

test('home aggregates visible book chapters and paginates without changing archive', () => {
  const store = createStore();
  const chapters = [
    {slug: 'first', type: 'books', column: 'book', order: 1, date: '2026-10-01', tags: ['Git']},
    {slug: 'second', type: 'books', column: 'book', order: 2, date: '2026-10-12', pinned: true, tags: ['阅读']},
    {slug: 'hidden', type: 'books', column: 'hidden-book', home: false, date: '2026-10-12'}
  ];
  store.posts = chapters.concat([{slug: 'article', title: 'Article', date: '2026-10-12'}, {slug: 'older', date: '2026-01-01'}]);
  store.documents = Object.fromEntries(chapters.map(p => [p.slug, p]));
  store.rawColumns = [{id: 'book', name: 'Git book', desc: 'Guide', postIds: ['first', 'second']}, {id: 'hidden-book', postIds: ['hidden']}];
  const page = store.getHomePage(1, 2);
  assert.equal(page.total, 3);
  assert.equal(page.pageCount, 2);
  assert.equal(page.items[0].kind, 'book');
  assert.equal(page.items[0].date, '2026-10-12');
  assert.equal(page.items[0].chapterCount, 2);
  assert.deepEqual(Array.from(page.items[0].tags), ['阅读', 'Git']);
  assert.equal(store.getHomePage(99, 2).page, 2);
  assert.equal(store.getHomePage('invalid', 2).page, 1);
  assert.equal(store.getHomePage(2, 2).items[0].slug, 'older');
  assert.equal(store.getPosts({sort: 'date'}).length, 5);
});

test('search matches a book or column name without requiring it in the chapter body',()=>{
  const store=createStore();store.posts=[{slug:'chapter',title:'简介',columnName:'抽象代数与群论导引',tags:[],date:'2026-10-16'}];
  assert.equal(store.searchPosts('群论')[0].slug,'chapter');
});

test('home books show the latest explicit update from visible chapters without changing publication dates', () => {
  const store = createStore();
  const chapters = [
    {slug:'first', type:'books', column:'book', order:1, date:'2026-10-01', updated:'2026-10-24'},
    {slug:'second', type:'books', column:'book', order:2, date:'2026-10-12', updated:'2026-10-20'},
    {slug:'hidden', type:'books', column:'book', order:3, date:'2026-10-25', updated:'2026-10-26', home:false}
  ];
  store.posts = chapters;
  store.documents = Object.fromEntries(chapters.map(post => [post.slug, post]));
  store.rawColumns = [{id:'book', name:'Book', postIds:chapters.map(post => post.slug)}];
  assert.equal(store.getHomeEntries()[0].updated, '2026-10-24');
  assert.equal(store.getHomeEntries()[0].date, '2026-10-12');
  delete chapters[0].updated;
  delete chapters[1].updated;
  assert.equal(store.getHomeEntries()[0].updated, undefined);
});

test('home sorts by minute-level updates with publication fallback, pinning and stable ties', () => {
  const store = createStore();
  store.posts = [
    {slug:'earlier-minute', date:'2026-01-01', updated:'2026-10-26 09:30'},
    {slug:'latest-minute', date:'2026-01-01', updated:'2026-10-26T09:31'},
    {slug:'new-post', date:'2026-10-26'},
    {slug:'pinned', date:'2020-01-01', pinned:true},
    {slug:'legacy-date', date:'2026-01-01', updated:'2026-10-25'},
    {slug:'hidden', date:'2026-10-26', updated:'2026-10-26 23:59', home:false}
  ];
  const expected = ['pinned','latest-minute','earlier-minute','new-post','legacy-date'];
  assert.deepEqual(Array.from(store.getHomeEntries(), post => post.slug), expected);
  assert.deepEqual(Array.from(store.getHomePage(1, 2).items, post => post.slug), expected.slice(0, 2));
  store.posts.reverse();
  assert.deepEqual(Array.from(store.getHomeEntries(), post => post.slug), expected);
  assert.equal(store.getPosts({sort:'date'})[0].slug, 'hidden');
  assert.equal(store.getPosts({sort:'date'}).at(-1).slug, 'pinned');
});

test('home book activity accounts for new chapters and ignores hidden updates', () => {
  const store = createStore();
  const chapters = [
    {slug:'old', type:'books', column:'book', date:'2026-10-01', updated:'2026-10-25 23:59'},
    {slug:'new', type:'books', column:'book', date:'2026-10-26'},
    {slug:'hidden', type:'books', column:'book', date:'2026-10-26', updated:'2026-10-26 23:59', home:false}
  ];
  store.posts = chapters.concat([{slug:'article', date:'2026-10-01', updated:'2026-10-25 23:59'}]);
  store.documents = Object.fromEntries(chapters.map(post => [post.slug, post]));
  store.rawColumns = [{id:'book', name:'Book', postIds:chapters.map(post => post.slug)}];
  assert.equal(store.getHomeEntries()[0].kind, 'book');
  chapters[0].updated = '2026-10-26T09:30';
  chapters[1].updated = '2026-10-26 09:31';
  assert.equal(store.getHomeEntries()[0].updated, '2026-10-26 09:31');
});

test('technical tags preserve display names and distinguish C, C++ and C# routes', () => {
  const store = createStore();
  assert.equal(store.tagSlug('C'), 'c');
  assert.equal(store.tagSlug('C++'), 'c-plus-plus');
  assert.equal(store.tagSlug('C#'), 'c-sharp');
  assert.equal(store.tagSlug('量子力学'), '量子力学');
  assert.equal(store.tagSlug('Python'), 'python');
});

test('tag counts and filtering merge case variants without counting a post twice', () => {
  const store = createStore();
  store.posts = [
    {slug: 'first', tags: ['Python', 'python', 'C++'], date: '2026-10-28'},
    {slug: 'second', tags: ['python', 'C'], date: '2026-10-27'},
    {slug: 'third', tags: ['PYTHON', 'C#'], date: '2026-10-26'}
  ];
  const tags = store.getAllTags();
  assert.equal(tags.length, 4);
  assert.deepEqual(tags[0], {name: 'Python', count: 3});
  assert.equal(store.getPosts({tag: 'python'}).length, 3);
  assert.equal(store.getPosts({tag: 'C++'}).length, 1);
  assert.equal(store.hasTag(store.posts[1], 'Python'), true);
  assert.equal(store.hasTag(store.posts[1], 'C++'), false);
});
