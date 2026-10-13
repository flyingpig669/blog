const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('folded navigation follows the active module and restores its original head', () => {
  const desktop = {innerHTML: ''}, mobile = {innerHTML: ''};
  const context = {window: {}, document: {
    querySelector: () => desktop,
    getElementById: () => mobile
  }};
  vm.createContext(context);
  for (const file of ['lib/html', 'lib/routes', 'components/navbar']) {
    vm.runInContext(fs.readFileSync(require.resolve('../js/' + file + '.js'), 'utf8'), context);
  }
  const services = {
    config: {nav: [
      {id: 'home', label: 'Home'},
      [{id: 'columns', label: 'Columns'}, {id: 'books', label: 'Books'}],
      {id: 'about', label: 'About'}
    ]},
    escapeHtml: context.window.BlogHtml.escapeHtml,
    navItemHref: item => '#/' + item.id
  };
  const navbar = context.window.BlogNavbar;
  navbar.renderNavigation(services, 'books');
  assert.match(desktop.innerHTML, /href="#\/books" data-nav-link="books" class="nav-link active" aria-current="page">Books/);
  assert.match(desktop.innerHTML, /href="#\/columns" data-nav-link="columns" class="nav-dropdown-item"/);
  assert.match(desktop.innerHTML, /aria-label="展开 Books 更多链接"/);
  assert.equal((desktop.innerHTML.match(/data-nav-link="books"/g) || []).length, 1);
  assert.match(mobile.innerHTML, /data-nav-link="books" class="[^"]* active" aria-current="page"/);
  assert.doesNotMatch(mobile.innerHTML, /data-nav-link="columns" class="[^"]* active/);

  navbar.renderNavigation(services, 'columns');
  assert.match(desktop.innerHTML, /data-nav-link="columns" class="nav-link active" aria-current="page"/);
  assert.match(desktop.innerHTML, /data-nav-link="books" class="nav-dropdown-item"/);
  navbar.renderNavigation(services, 'home');
  assert.match(desktop.innerHTML, /data-nav-link="home" class="nav-link active" aria-current="page"/);
  assert.doesNotMatch(desktop.innerHTML, /data-nav-link="books" class="[^"]* active/);
  navbar.renderNavigation(services, null);
  assert.doesNotMatch(desktop.innerHTML, /aria-current/);
  assert.match(desktop.innerHTML, /data-nav-link="columns" class="nav-link"/);
});
