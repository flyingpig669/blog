const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function createStore() {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/store.js'), 'utf8'), context);
  const store = context.window.BlogStore;
  store.posts = [
    { id: 'post-demo', slug: 'other-roadmap', relPath: 'demo/roadmap.md', type: 'normal', title: 'Other roadmap', tags: ['algebra'] },
    { id: 'post-roadmap', slug: 'roadmap', relPath: 'roadmap.md', type: 'post', title: 'Roadmap' }
  ];
  const page = { title: 'Structured Roadmap', slug: 'roadmap' };
  store.pages = { roadmap: page, 'roadmap.md': page };
  store.rawColumns = [];
  return store;
}

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
