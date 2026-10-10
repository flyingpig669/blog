// Search owns its modal lifecycle; the app supplies routing and escaping only.
window.BlogSearch = {
  timer: null,
  revision: 0,
  configure: function(services) { this.services = services; },
  open: function() {
    if (((this.services.store.config || {}).features || {}).searchModal === false) return;
    var modal = document.getElementById('search-modal');
    var input = document.getElementById('search-modal-input');
    if (!modal || !input) return;
    if (!modal.classList.contains('hidden')) { input.focus(); return; }
    clearTimeout(this.timer);
    this.returnFocus = document.activeElement;
    this.background = Array.from(document.body.children).filter(function(el) {
      return el !== modal && !['SCRIPT', 'STYLE'].includes(el.tagName);
    }).map(function(el) { var old = el.inert; el.inert = true; return [el, old]; });
    this.oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    modal.classList.remove('hidden');
    input.value = '';
    this.search('');
    input.focus();
    var self = this;
    this.keyHandler = function(event) { self.keydown(event); };
    modal.addEventListener('keydown', this.keyHandler);
  },
  close: function() {
    this.revision++;
    clearTimeout(this.timer);
    var modal = document.getElementById('search-modal');
    if (!modal || modal.classList.contains('hidden')) return;
    modal.classList.add('hidden');
    modal.removeEventListener('keydown', this.keyHandler);
    (this.background || []).forEach(function(pair) { pair[0].inert = pair[1]; });
    document.body.style.overflow = this.oldOverflow;
    if (this.returnFocus && this.returnFocus.isConnected) this.returnFocus.focus();
    this.returnFocus = null;
  },
  debounce: function(query) {
    this.revision++;
    clearTimeout(this.timer);
    // Remove stale selectable results while a new query is pending.
    document.getElementById('search-modal-results').innerHTML = '<p class="search-status">Searching…</p>';
    var self = this;
    this.timer = setTimeout(function() {
      if (!document.getElementById('search-modal').classList.contains('hidden')) self.search(query);
    }, 120);
  },
  search: function(query) {
    var results = document.getElementById('search-modal-results');
    if (!results) return;
    var self = this, revision = ++this.revision;
    results.innerHTML = '<p class="search-status" role="status">Searching…</p>';
    return this.services.store.loadSearch().then(function() {
      if (self.revision !== revision) return;
      self.renderResults(query, results);
    }).catch(function() {
      if (self.revision !== revision) return;
      results.innerHTML = '<p class="search-status" role="alert">Search could not load.</p><button type="button" class="btn-secondary" data-search-retry>Retry</button>';
      results.querySelector('[data-search-retry]').onclick = function() { self.search(query); };
    });
  },
  renderResults: function(query, results) {
    var store = this.services.store, htmlTools = this.services.html, services = this.services;
    var posts = store.searchPosts(query);
    var html = '<p class="search-status" role="status">' + posts.length + ' results · ↑ ↓ navigate · Enter open</p>';
    if (!posts.length) html += '<p class="search-status">No matching articles. Try a shorter keyword or a tag.</p>';
    posts.forEach(function(post) {
      html += '<a class="search-result" href="' + htmlTools.escapeHtml(services.postHref(post)) + '"><span class="search-result-title">' + htmlTools.highlight(post.title, query) + '</span><span class="search-result-meta">' + htmlTools.escapeHtml(post.date) + ' · ' + htmlTools.escapeHtml(post.readTime || '') + '</span><span class="search-result-snippet">' + htmlTools.highlight(store.searchSnippet(post, query), query) + '</span></a>';
    });
    results.innerHTML = html;
    results.scrollTop = 0;
    this.active = posts.length ? 0 : -1;
    this.select(false);
    var self = this;
    results.onclick = function(event) { if (event.target.closest('a')) self.close(); };
  },
  select: function(scroll) {
    var links = document.querySelectorAll('#search-modal-results a');
    var active = this.active;
    links.forEach(function(link, index) { link.classList.toggle('is-active', index === active); });
    if (scroll && links[active]) links[active].scrollIntoView({ block: 'nearest' });
  },
  keydown: function(event) {
    if (event.isComposing) return;
    var modal = document.getElementById('search-modal');
    var links = modal.querySelectorAll('#search-modal-results a');
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!links.length) return;
      this.active = (this.active + (event.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length;
      this.select(true);
    } else if (event.key === 'Enter' && event.target.id === 'search-modal-input') {
      event.preventDefault();
      if (links[this.active]) links[this.active].click();
    } else if (event.key === 'Tab') {
      var focusable = Array.from(modal.querySelectorAll('input, button, a[href]'));
      var index = focusable.indexOf(document.activeElement);
      if ((event.shiftKey && index <= 0) || (!event.shiftKey && index === focusable.length - 1)) {
        event.preventDefault();
        focusable[event.shiftKey ? focusable.length - 1 : 0].focus();
      }
    }
  }
};
