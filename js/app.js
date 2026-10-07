var BT = String.fromCharCode(96);
var BT3 = BT + BT + BT;
// Aurora Blog - Main Controller
window.BlogApp = {
  getCategoryBadgeHtml: function(catId, catName) {
    if (catId === 'quantum-ai') {
      var icon = window.BlogIcons ? window.BlogIcons.get('atom', 'w-3.5 h-3.5 text-cyan-400') : '';
      return '<span class="badge-quantum">' + icon + ' ' + catName + '</span>';
    }
    return '<span class="px-2.5 py-0.5 rounded-full font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">' + catName + '</span>';
  },
  currentRoute: { name: 'home', params: {} },
  activeCategory: 'all',
  activeTag: null,
  activeSort: 'latest',
  searchQuery: '',

  init: function() {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
    window.BlogStore.init();
    this.setupEventListeners();
    this.handleRoute();
    var self = this;
    window.addEventListener('hashchange', function() { self.handleRoute(); });
  },

  setupEventListeners: function() {
    var self = this;
    window.addEventListener('keydown', function(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        self.openSearchModal();
      }
      if (e.key === 'Escape') {
        self.closeSearchModal();
      }
    });

    window.addEventListener('scroll', function() {
      self.updateReadingProgress();
      self.updateActiveTocHeading();
      self.updateBackToTopButton();
    });

    document.addEventListener('click', function(e) {
      var copyBtn = e.target.closest('.code-copy-btn');
      if (copyBtn) {
        var encodedCode = copyBtn.getAttribute('data-code');
        if (encodedCode) {
          var rawCode = decodeURIComponent(encodedCode);
          navigator.clipboard.writeText(rawCode).then(function() {
            var orig = copyBtn.innerHTML;
            copyBtn.innerHTML = (window.BlogIcons ? window.BlogIcons.get('check', 'w-3.5 h-3.5 text-green-400') : '') + ' <span class="text-green-400">已复制</span>';
            self.showToast('代码已复制到剪贴板', 'success');
            setTimeout(function() { copyBtn.innerHTML = orig; }, 2000);
          }).catch(function() {
            self.showToast('复制失败，请手动选择', 'error');
          });
        }
      }
    });
  },

  handleRoute: function() {
    window.scrollTo(0, 0);
    var hash = window.location.hash.slice(1) || '/';
    var path = hash.split('?')[0];

    if (path.indexOf('/post/') === 0) {
      var id = path.replace('/post/', '');
      this.currentRoute = { name: 'post', params: { id: id } };
      this.renderPostView(id);
    } else if (path === '/archives') {
      this.currentRoute = { name: 'archives', params: {} };
      this.renderArchivesView();
    } else if (path === '/columns') {
      this.currentRoute = { name: 'columns', params: {} };
      this.renderColumnsView();
    } else if (path === '/categories') {
      this.currentRoute = { name: 'categories', params: {} };
      this.renderCategoriesView();
    } else if (path === '/editor') {
      this.currentRoute = { name: 'editor', params: {} };
      this.renderEditorView();
    } else if (path === '/about') {
      this.currentRoute = { name: 'about', params: {} };
      this.renderAboutView();
    } else {
      this.currentRoute = { name: 'home', params: {} };
      this.renderHomeView();
    }

    this.updateActiveNavLinks();
    try { window.scrollTo(0, 0); } catch(e) {}
  },

  updateActiveNavLinks: function() {
    var self = this;
    document.querySelectorAll('[data-nav-link]').forEach(function(el) {
      var target = el.getAttribute('data-nav-link');
      if (target === self.currentRoute.name) {
        el.classList.add('text-blue-600', 'dark:text-blue-400', 'font-semibold');
        el.classList.remove('text-slate-600', 'dark:text-slate-300');
      } else {
        el.classList.remove('text-blue-600', 'dark:text-blue-400', 'font-semibold');
        el.classList.add('text-slate-600', 'dark:text-slate-300');
      }
    });
    var prog = document.getElementById('reading-progress-container');
    if (prog) {
      if (this.currentRoute.name === 'post') prog.classList.remove('hidden');
      else prog.classList.add('hidden');
    }
  },

  updateReadingProgress: function() {
    if (this.currentRoute.name !== 'post') return;
    var bar = document.getElementById('reading-progress-bar');
    if (!bar) return;
    var scrollTop = window.scrollY || document.documentElement.scrollTop;
    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
    var percent = docHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)) : 0;
    bar.style.width = percent + '%';
  },

  updateActiveTocHeading: function() {
    if (this.currentRoute.name !== 'post') return;
    var headings = document.querySelectorAll('.markdown-body h1, .markdown-body h2, .markdown-body h3');
    if (!headings.length) return;
    var activeId = null;
    var scrollPos = window.scrollY + 120;
    headings.forEach(function(h) {
      if (h.offsetTop <= scrollPos) activeId = h.id;
    });
    if (activeId) {
      document.querySelectorAll('.toc-item').forEach(function(el) {
        if (el.getAttribute('data-target') === activeId) el.classList.add('active');
        else el.classList.remove('active');
      });
    }
  },

  updateBackToTopButton: function() {
    var btn = document.getElementById('back-to-top-btn');
    if (!btn) return;
    if (window.scrollY > 400) {
      btn.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-4');
      btn.classList.add('opacity-100', 'translate-y-0');
    } else {
      btn.classList.add('opacity-0', 'pointer-events-none', 'translate-y-4');
      btn.classList.remove('opacity-100', 'translate-y-0');
    }
  },

  scrollToTop: function() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  renderHomeView: function() {
    var container = document.getElementById('app-main');
    var posts = window.BlogStore.getPosts({
      category: this.activeCategory,
      tag: this.activeTag,
      sort: this.activeSort,
      query: this.searchQuery
    });
    var stats = window.BlogStore.getStats();
    var categories = window.BlogStore.categories;
    var tags = window.BlogStore.getAllTags().slice(0, 15);
    var author = window.BlogStore.author;
    var featuredPost = window.BlogStore.posts.find(function(p) { return p.pinned; }) || window.BlogStore.posts[0];

    var html = '';
    html += '<section class="relative overflow-hidden rounded-3xl quantum-panel p-8 md:p-12 mb-10 shadow-xl">';
    html += '  <div class="absolute -right-20 -top-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>';
    html += '  <div class="absolute -left-20 -bottom-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>';
    html += '  <div class="relative z-10 max-w-3xl">';
    html += '    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-400 mb-5 font-mono">';
    html += '      <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>';
    html += '      <span>QUANTUM COMPUTING & MACHINE INTELLIGENCE</span>';
    html += '    </div>';
    html += '    <h1 class="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 leading-tight font-sans text-slate-900 dark:text-white">探索计算前沿 <span class="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400">· 解码量子宇宙</span></h1>';
    html += '    <p class="text-slate-600 dark:text-slate-300 text-sm md:text-base mb-8 leading-relaxed max-w-2xl font-normal font-sans">融汇复希尔伯特空间、哈密顿量演化、变分量子线路(VQC)、统计力学与深度自注意力同构。用严谨的数学推导与全栈代码构建数字认知宇宙。</p>';
    html += '    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-slate-200/80 dark:border-slate-800/80">';
    html += '      <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/80"><div class="text-xl md:text-2xl font-bold font-mono text-cyan-500">' + stats.postsCount + '</div><div class="text-xs text-slate-500 font-sans mt-0.5">精选论著</div></div>';
    html += '      <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/80"><div class="text-xl md:text-2xl font-bold font-mono text-blue-500">' + (stats.wordsCount / 1000).toFixed(1) + 'k</div><div class="text-xs text-slate-500 font-sans mt-0.5">累计字数</div></div>';
    html += '      <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/80"><div class="text-xl md:text-2xl font-bold font-mono text-purple-500">4</div><div class="text-xs text-slate-500 font-sans mt-0.5">系统专栏</div></div>';
    html += '      <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/80"><div class="text-xl md:text-2xl font-bold font-mono text-indigo-500">' + stats.viewsCount + '</div><div class="text-xs text-slate-500 font-sans mt-0.5">总阅读量</div></div>';
    html += '    </div>';
    html += '  </div>';
    html += '</section>';

    html += '<div class="grid grid-cols-1 lg:grid-cols-12 gap-8">';
    html += '  <div class="lg:col-span-8 space-y-6">';

    // Filter pills
    html += '    <div class="flex flex-wrap items-center justify-between gap-4 p-2 quantum-panel rounded-2xl shadow-sm">';
    html += '      <div class="flex flex-wrap items-center gap-1.5">';
    html += '        <button onclick="window.BlogApp.setCategory(\'all\')" class="px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ' + (this.activeCategory === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700') + '">全部文章</button>';
    categories.forEach(function(c) {
      html += '        <button onclick="window.BlogApp.setCategory(\'' + c.id + '\')" class="px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ' + (window.BlogApp.activeCategory === c.id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700') + '">' + c.name + '</button>';
    });
    html += '      </div>';

    html += '      <div class="flex items-center gap-2">';
    if (this.activeTag) {
      html += '        <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs">';
      html += '          <span>标签: #' + this.activeTag + '</span>';
      html += '          <button onclick="window.BlogApp.clearTag()" class="hover:text-blue-800">' + (window.BlogIcons ? window.BlogIcons.get('x', 'w-3 h-3') : 'x') + '</button>';
      html += '        </div>';
    }
    html += '        <select onchange="window.BlogApp.setSort(this.value)" class="text-xs bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg px-2.5 py-1.5 border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500">';
    html += '          <option value="latest" ' + (this.activeSort === 'latest' ? 'selected' : '') + '>最新发布</option>';
    html += '          <option value="likes" ' + (this.activeSort === 'likes' ? 'selected' : '') + '>点赞最多</option>';
    html += '          <option value="views" ' + (this.activeSort === 'views' ? 'selected' : '') + '>阅读最多</option>';
    html += '        </select>';
    html += '      </div>';
    html += '    </div>';

    // Featured post
    if (this.activeCategory === 'all' && !this.activeTag && !this.searchQuery && featuredPost) {
      html += '    <div class="group relative rounded-2xl overflow-hidden quantum-panel shadow-xl mb-6">';
      html += '      <div class="h-44 md:h-52 bg-gradient-to-r ' + featuredPost.coverGradient + ' p-6 md:p-8 flex flex-col justify-between text-white relative">';
      html += '        <div class="flex items-center justify-between">';
      html += '          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold uppercase tracking-wider">';
      html += '            ' + (window.BlogIcons ? window.BlogIcons.get('sparkles', 'w-3.5 h-3.5') : '') + '<span>置顶推荐</span>';
      html += '          </span>';
      html += '          <span class="text-xs text-white/80 font-mono">' + featuredPost.date + '</span>';
      html += '        </div>';
      html += '        <h2 class="text-xl md:text-2xl font-bold tracking-tight text-white leading-snug drop-shadow-sm group-hover:translate-x-1 transition-transform">';
      html += '          <a href="#/post/' + featuredPost.id + '">' + featuredPost.title + '</a>';
      html += '        </h2>';
      html += '      </div>';
      html += '      <div class="p-6">';
      html += '        <p class="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-4 line-clamp-2">' + featuredPost.excerpt + '</p>';
      html += '        <div class="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-700/60 text-xs text-slate-500 dark:text-slate-400">';
      html += '          <div class="flex items-center gap-3">';
      html += '            <span class="flex items-center gap-1">' + (window.BlogIcons ? window.BlogIcons.get('clock', 'w-3.5 h-3.5') : '') + ' ' + featuredPost.readTime + '</span>';
      html += '            <span class="flex items-center gap-1">' + (window.BlogIcons ? window.BlogIcons.get('eye', 'w-3.5 h-3.5') : '') + ' ' + featuredPost.views + ' 次阅读</span>';
      html += '            <span class="flex items-center gap-1 text-red-500">' + (window.BlogIcons ? window.BlogIcons.get('heart', 'w-3.5 h-3.5 text-red-500 fill-red-500/30') : '') + ' ' + featuredPost.likes + '</span>';
      html += '          </div>';
      html += '          <a href="#/post/' + featuredPost.id + '" class="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 hover:gap-1.5 transition-all">';
      html += '            <span>阅读全文</span>' + (window.BlogIcons ? window.BlogIcons.get('chevron-right', 'w-3.5 h-3.5') : '');
      html += '          </a>';
      html += '        </div>';
      html += '      </div>';
      html += '    </div>';
    }

    // Articles list
    if (posts.length === 0) {
      html += '    <div class="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">';
      html += '      <div class="text-slate-300 dark:text-slate-600 mx-auto mb-3 flex justify-center">' + (window.BlogIcons ? window.BlogIcons.get('file-text', 'w-12 h-12') : '') + '</div>';
      html += '      <h3 class="text-base font-semibold text-slate-700 dark:text-slate-300 mb-1">未找到相关文章</h3>';
      html += '      <p class="text-xs text-slate-500 dark:text-slate-400 mb-4">尝试清除过滤条件或换个搜索关键词</p>';
      html += '      <button onclick="window.BlogApp.resetFilters()" class="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-medium">重置筛选</button>';
      html += '    </div>';
    } else {
      html += '    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">';
      posts.forEach(function(post) {
        var commentCount = (window.BlogStore.getComments(post.id) || []).length;
        html += '      <article class="quantum-panel p-5 shadow-sm flex flex-col justify-between group">';
        html += '        <div>';
        html += '          <div class="flex items-center justify-between text-xs mb-3">';
        html += '            ' + window.BlogApp.getCategoryBadgeHtml(post.category, post.categoryName);
        html += '            <span class="text-slate-400 font-mono">' + post.date + '</span>';
        html += '          </div>';
        html += '          <h3 class="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-2 line-clamp-2 leading-snug">';
        html += '            <a href="#/post/' + post.id + '">' + post.title + '</a>';
        html += '          </h3>';
        html += '          <p class="text-slate-600 dark:text-slate-400 text-xs leading-relaxed line-clamp-3 mb-4">' + post.excerpt + '</p>';
        html += '          <div class="flex flex-wrap gap-1.5 mb-4">';
        (post.tags || []).slice(0, 3).forEach(function(t) {
          html += '            <button onclick="window.BlogApp.setTag(\'' + t + '\')" class="text-[11px] px-2 py-0.5 rounded bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 hover:text-blue-600">#' + t + '</button>';
        });
        html += '          </div>';
        html += '        </div>';
        html += '        <div class="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700/60 text-xs text-slate-400">';
        html += '          <div class="flex items-center gap-3">';
        html += '            <span>' + post.readTime + '</span>';
        html += '            <span class="flex items-center gap-1 text-red-500">' + (window.BlogIcons ? window.BlogIcons.get('heart', 'w-3 h-3 text-red-500') : '') + ' ' + (post.likes || 0) + '</span>';
        html += '            <span class="flex items-center gap-1 text-blue-500">' + (window.BlogIcons ? window.BlogIcons.get('message-square', 'w-3 h-3 text-blue-500') : '') + ' ' + commentCount + '</span>';
        html += '          </div>';
        html += '          <a href="#/post/' + post.id + '" class="text-blue-600 dark:text-blue-400 font-medium hover:underline inline-flex items-center gap-0.5">阅读 ' + (window.BlogIcons ? window.BlogIcons.get('chevron-right', 'w-3 h-3') : '') + '</a>';
        html += '        </div>';
        html += '      </article>';
      });
      html += '    </div>';
    }
    html += '  </div>';

    // Sidebar
    html += '  <aside class="lg:col-span-4 space-y-6">';
    html += '    <div class="bg-white dark:bg-slate-800/90 rounded-2xl p-6 border border-slate-200/90 dark:border-slate-700/80 shadow-sm text-center">';
    html += '      <div class="relative w-20 h-20 mx-auto mb-4">';
    html += '        <img src="' + author.avatar + '" alt="' + author.name + '" class="w-20 h-20 rounded-full object-cover ring-4 ring-blue-500/20 shadow-md">';
    html += '        <span class="absolute bottom-0 right-0 w-5 h-5 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full" title="在线"></span>';
    html += '      </div>';
    html += '      <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-1">' + author.name + '</h3>';
    html += '      <p class="text-xs text-blue-600 dark:text-blue-400 font-medium mb-3">' + author.title + '</p>';
    html += '      <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-5 text-left bg-slate-50 dark:bg-slate-700/40 p-3 rounded-xl">' + author.bio + '</p>';
    html += '      <div class="flex justify-center items-center gap-3">';
    html += '        <a href="' + author.github + '" target="_blank" class="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-blue-600 hover:text-white transition-colors" title="GitHub">' + (window.BlogIcons ? window.BlogIcons.get('github', 'w-4 h-4') : '') + '</a>';
    html += '        <a href="' + author.twitter + '" target="_blank" class="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-blue-400 hover:text-white transition-colors" title="Twitter / X">' + (window.BlogIcons ? window.BlogIcons.get('twitter', 'w-4 h-4') : '') + '</a>';
    html += '        <a href="mailto:' + author.email + '" class="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-purple-600 hover:text-white transition-colors" title="Email">' + (window.BlogIcons ? window.BlogIcons.get('mail', 'w-4 h-4') : '') + '</a>';
    html += '        <a href="#/about" class="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-pink-600 hover:text-white transition-colors" title="关于我">' + (window.BlogIcons ? window.BlogIcons.get('user', 'w-4 h-4') : '') + '</a>';
    html += '      </div>';
    html += '    </div>';

    html += '    <div class="bg-white dark:bg-slate-800/90 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-700/80 shadow-sm">';
    html += '      <h4 class="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center justify-between">';
    html += '        <span class="flex items-center gap-1.5">' + (window.BlogIcons ? window.BlogIcons.get('folder', 'w-4 h-4 text-blue-500') : '') + ' 文章分类</span>';
    html += '        <a href="#/categories" class="text-xs text-blue-600 dark:text-blue-400 font-normal hover:underline">查看全部</a>';
    html += '      </h4>';
    html += '      <div class="space-y-1.5">';
    categories.forEach(function(c) {
      var count = window.BlogStore.posts.filter(function(p) { return p.category === c.id; }).length;
      html += '        <button onclick="window.BlogApp.setCategory(\'' + c.id + '\')" class="w-full flex items-center justify-between p-2 rounded-xl text-xs hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-slate-700 dark:text-slate-300">';
      html += '          <span class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-gradient-to-r ' + c.color + '"></span>' + c.name + '</span>';
      html += '          <span class="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 text-[11px] font-mono">' + count + '</span>';
      html += '        </button>';
    });
    html += '      </div>';
    html += '    </div>';

    html += '    <div class="bg-white dark:bg-slate-800/90 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-700/80 shadow-sm">';
    html += '      <h4 class="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-1.5">';
    html += '        ' + (window.BlogIcons ? window.BlogIcons.get('tag', 'w-4 h-4 text-purple-500') : '') + ' 热门标签';
    html += '      </h4>';
    html += '      <div class="flex flex-wrap gap-2">';
    tags.forEach(function(t) {
      html += '        <button onclick="window.BlogApp.setTag(\'' + t.name + '\')" class="px-2.5 py-1 rounded-lg text-xs bg-slate-50 dark:bg-slate-700/60 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors border border-slate-100 dark:border-slate-700">';
      html += '          #' + t.name + ' <span class="text-slate-400 font-mono text-[10px]">(' + t.count + ')</span>';
      html += '        </button>';
    });
    html += '      </div>';
    html += '    </div>';

    html += '    <div class="rounded-2xl p-5 bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-sm flex items-center justify-between">';
    html += '      <div><div class="text-sm font-bold mb-1">有新的创作灵感？</div><div class="text-xs text-blue-100">支持 Markdown、公式与即时预览</div></div>';
    html += '      <a href="#/editor" class="px-3.5 py-2 rounded-xl bg-white text-blue-600 font-semibold text-xs shadow-md hover:bg-blue-50 transition-all flex items-center gap-1">';
    html += '        ' + (window.BlogIcons ? window.BlogIcons.get('edit-3', 'w-3.5 h-3.5') : '') + ' 写文章';
    html += '      </a>';
    html += '    </div>';
    html += '  </aside>';
    html += '</div>';

    container.innerHTML = html;
  },

  setCategory: function(cat) {
    this.activeCategory = cat;
    this.renderHomeView();
  },

  setTag: function(tag) {
    this.activeTag = tag;
    this.renderHomeView();
  },

  clearTag: function() {
    this.activeTag = null;
    this.renderHomeView();
  },

  setSort: function(sort) {
    this.activeSort = sort;
    this.renderHomeView();
  },

  resetFilters: function() {
    this.activeCategory = 'all';
    this.activeTag = null;
    this.searchQuery = '';
    this.renderHomeView();
  },

  renderPostView: function(id) {
    var container = document.getElementById('app-main');
    var post = window.BlogStore.getPostById(id);

    if (!post) {
      container.innerHTML = '<div class="max-w-2xl mx-auto text-center py-24"><h2 class="text-2xl font-bold text-slate-800 dark:text-white mb-2">文章未找到</h2><p class="text-slate-500 mb-6">抱歉，您访问的文章可能已被删除或移动。</p><a href="#/" class="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium">返回首页</a></div>';
      return;
    }

    window.BlogStore.incrementView(post.id);
    var mdResult = window.BlogMarkdown.render(post.content);
    var renderedHtml = mdResult.html;
    var toc = mdResult.toc;
    var comments = window.BlogStore.getComments(post.id);
    var isLiked = window.BlogStore.isPostLiked(post.id);
    var isBookmarked = window.BlogStore.isPostBookmarked(post.id);

    
    // Check if post belongs to a column
    var columnInfo = post.column ? window.BlogStore.getColumnById(post.column) : null;
    var columnPosts = columnInfo ? columnInfo.posts : [];
    var allPosts = window.BlogStore.posts;
    var currentIndex = allPosts.findIndex(function(p) { return p.id === post.id; });
    var prevPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
    var nextPost = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;

    var html = '<div class="max-w-5xl mx-auto">';
    html += '<div class="flex items-center justify-between mb-6 text-xs text-slate-500 dark:text-slate-400">';
    html += '  <div class="flex items-center gap-2">';
    html += '    <a href="#/" class="hover:text-blue-600 flex items-center gap-1">' + (window.BlogIcons ? window.BlogIcons.get('arrow-left', 'w-3.5 h-3.5') : '') + ' 返回首页</a>';
    html += '    <span>/</span><span>' + post.categoryName + '</span>';
    html += '  </div>';
    html += '  <div class="flex items-center gap-2">';
    html += '    <button onclick="window.BlogApp.toggleBookmark(\'' + post.id + '\')" class="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors" title="收藏文章">' + (window.BlogIcons ? window.BlogIcons.get('bookmark', 'w-4 h-4 ' + (isBookmarked ? 'text-amber-500 fill-amber-500' : '')) : '') + '</button>';
    html += '    <button onclick="window.BlogApp.sharePost(\'' + post.id + '\')" class="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors" title="分享链接">' + (window.BlogIcons ? window.BlogIcons.get('share-2', 'w-4 h-4') : '') + '</button>';
    html += '  </div>';
    html += '</div>';

    html += '<header class="mb-8 p-8 md:p-10 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/80 shadow-sm relative overflow-hidden">';

          // Column banner if applicable
          if (columnInfo) {
            html += '<div class="mb-6 p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/25 flex flex-wrap items-center justify-between gap-3 text-xs">';
            html += '  <div class="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-medium">';
            html += '    <span class="px-2 py-0.5 rounded-md bg-indigo-600 text-white font-mono text-[10px]">专栏连载</span>';
            html += '    <span>收录于专栏《' + columnInfo.name + '》· 第 ' + (post.order || 1) + ' 讲</span>';
            html += '  </div>';
            html += '  <a href="#/columns" class="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1">专栏全目录 →</a>';
            html += '</div>';
          }

    html += '  <div class="flex flex-wrap items-center gap-2 text-xs mb-4">';
    html += '    ' + window.BlogApp.getCategoryBadgeHtml(post.category, post.categoryName);
    html += '    <span class="text-slate-400 font-mono">发布于 ' + post.date + '</span>';
    html += '    <span class="text-slate-400">·</span><span class="text-slate-400">' + post.readTime + '</span>';
    html += '    <span class="text-slate-400">·</span><span class="text-slate-400">' + (post.words || 0) + ' 字</span>';
    html += '  </div>';
    html += '  <h1 class="text-2xl md:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight mb-4 tracking-tight">' + post.title + '</h1>';
    html += '  <div class="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-700/60">';
    html += '    <div class="flex items-center gap-3">';
    html += '      <img src="' + window.BlogStore.author.avatar + '" class="w-10 h-10 rounded-full object-cover">';
    html += '      <div><div class="text-xs font-bold text-slate-900 dark:text-white">' + window.BlogStore.author.name + '</div><div class="text-[11px] text-slate-500">' + window.BlogStore.author.title + '</div></div>';
    html += '    </div>';
    html += '    <div class="flex flex-wrap gap-1.5">';
    (post.tags || []).forEach(function(t) {
      html += '      <a href="#/" onclick="window.BlogApp.setTag(\'' + t + '\')" class="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:text-blue-600">#' + t + '</a>';
    });
    html += '    </div>';
    html += '  </div>';
    html += '</header>';

    html += '<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">';
    html += '  <div class="' + (toc.length > 0 ? 'lg:col-span-8' : 'lg:col-span-12') + ' bg-white dark:bg-slate-800/90 rounded-3xl p-6 md:p-10 border border-slate-200/90 dark:border-slate-700/80 shadow-sm">';
    html += '    <div class="markdown-body">' + renderedHtml + '</div>';

    html += '    <div class="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-6">';
    html += '      <div class="flex items-center gap-3">';
    html += '        <button id="post-like-btn" onclick="window.BlogApp.toggleLike(\'' + post.id + '\')" class="flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition-all shadow-sm ' + (isLiked ? 'bg-red-500 text-white hover:bg-red-600 animate-heart' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500') + '">';
    html += '          ' + (window.BlogIcons ? window.BlogIcons.get('heart', 'w-4 h-4 ' + (isLiked ? 'fill-white text-white' : 'text-current')) : '') + ' <span>点赞 (<span id="post-like-count">' + (post.likes || 0) + '</span>)</span>';
    html += '        </button>';
    html += '        <button onclick="window.BlogApp.toggleBookmark(\'' + post.id + '\')" class="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300">';
    html += '          ' + (window.BlogIcons ? window.BlogIcons.get('bookmark', 'w-4 h-4 ' + (isBookmarked ? 'text-amber-500 fill-amber-500' : '')) : '') + ' <span>' + (isBookmarked ? '已收藏' : '收藏') + '</span>';
    html += '        </button>';
    html += '      </div>';
    html += '      <div class="text-xs text-slate-400 text-center sm:text-right"><div>许可协议：CC BY-NC 4.0 商业使用请联系作者</div><div>本文由极光随笔原创发布</div></div>';
    html += '    </div>';

    html += '    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 pt-6 border-t border-slate-100 dark:border-slate-700/60">';
    if (prevPost) {
      html += '      <a href="#/post/' + prevPost.id + '" class="p-4 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 transition-colors flex flex-col">';
      html += '        <span class="text-[11px] text-slate-400 flex items-center gap-1 mb-1">' + (window.BlogIcons ? window.BlogIcons.get('chevron-left', 'w-3 h-3') : '') + ' 上一篇</span>';
      html += '        <span class="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">' + prevPost.title + '</span>';
      html += '      </a>';
    } else {
      html += '      <div></div>';
    }
    if (nextPost) {
      html += '      <a href="#/post/' + nextPost.id + '" class="p-4 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 transition-colors flex flex-col items-end text-right">';
      html += '        <span class="text-[11px] text-slate-400 flex items-center gap-1 mb-1">下一篇 ' + (window.BlogIcons ? window.BlogIcons.get('chevron-right', 'w-3 h-3') : '') + '</span>';
      html += '        <span class="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">' + nextPost.title + '</span>';
      html += '      </a>';
    } else {
      html += '      <div></div>';
    }
    html += '    </div>';

    // Comments Section
    html += '    <section class="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">';
    html += '      <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">';
    html += '        ' + (window.BlogIcons ? window.BlogIcons.get('message-square', 'w-5 h-5 text-blue-500') : '') + ' 评论讨论 (' + comments.length + ')';
    html += '      </h3>';
    html += '      <div class="bg-slate-50 dark:bg-slate-700/40 rounded-2xl p-5 mb-8 border border-slate-200/80 dark:border-slate-700/80">';
    html += '        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">';
    html += '          <input id="comment-author" type="text" placeholder="您的昵称 (必填)" class="w-full text-xs px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200">';
    html += '          <input id="comment-email" type="email" placeholder="电子邮箱 (选填，不公开)" class="w-full text-xs px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200">';
    html += '        </div>';
    html += '        <textarea id="comment-content" rows="3" placeholder="写下您的思考与建议..." class="w-full text-xs p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200 mb-3"></textarea>';
    html += '        <div class="flex items-center justify-between">';
    html += '          <div class="flex items-center gap-1.5">';
    ['👍', '❤️', '🚀', '🔥', '💡', '🎉'].forEach(function(emoji) {
      html += '            <button type="button" onclick="window.BlogApp.insertEmoji(\'' + emoji + '\')" class="px-2 py-1 rounded bg-white dark:bg-slate-800 hover:bg-slate-100 text-xs border border-slate-200 dark:border-slate-600">' + emoji + '</button>';
    });
    html += '          </div>';
    html += '          <button type="button" onclick="window.BlogApp.submitComment(\'' + post.id + '\')" class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all">';
    html += '            ' + (window.BlogIcons ? window.BlogIcons.get('send', 'w-3.5 h-3.5') : '') + ' 发表评论';
    html += '          </button>';
    html += '        </div>';
    html += '      </div>';

    html += '      <div id="comments-list" class="space-y-4">';
    if (comments.length === 0) {
      html += '        <div class="text-center py-8 text-xs text-slate-400">暂无评论，快来抢占沙发吧！</div>';
    } else {
      comments.forEach(function(c) {
        html += '        <div class="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 shadow-sm flex gap-3.5">';
        html += '          <img src="' + c.avatar + '" class="w-9 h-9 rounded-full object-cover flex-shrink-0 mt-0.5">';
        html += '          <div class="flex-grow">';
        html += '            <div class="flex items-center justify-between mb-1">';
        html += '              <div class="flex items-center gap-2">';
        html += '                <span class="text-xs font-bold text-slate-800 dark:text-slate-200">' + c.author + '</span>';
        html += '                <span class="text-[10px] text-slate-400 font-mono">' + c.date + '</span>';
        html += '              </div>';
        html += '              <button onclick="window.BlogApp.likeComment(\'' + post.id + '\', \'' + c.id + '\', this)" class="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors">';
        html += '                ' + (window.BlogIcons ? window.BlogIcons.get('thumbs-up', 'w-3 h-3') : '') + ' <span class="like-num">' + (c.likes || 0) + '</span>';
        html += '              </button>';
        html += '            </div>';
        html += '            <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">' + c.content + '</p>';
        html += '          </div>';
        html += '        </div>';
      });
    }
    html += '      </div>';
    html += '    </section>';

    html += '  </div>';

    // TOC
    if (toc.length > 0) {
      html += '  <aside class="hidden lg:block lg:col-span-4 sticky top-24">';
      html += '    <div class="bg-white dark:bg-slate-800/90 rounded-3xl p-6 border border-slate-200/90 dark:border-slate-700/80 shadow-sm max-h-[calc(100vh-8rem)] overflow-y-auto">';
      html += '      <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">';
      html += '        ' + (window.BlogIcons ? window.BlogIcons.get('book-open', 'w-4 h-4 text-blue-500') : '') + ' 目录导航 (TOC)';
      html += '      </h4>';
      html += '      <nav class="space-y-1 text-xs">';
      toc.forEach(function(item) {
        html += '        <a href="#' + item.id + '" data-target="' + item.id + '" class="toc-item block py-1.5 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors border-l-2 border-transparent ' + (item.level === 1 ? 'pl-2 font-medium' : item.level === 2 ? 'pl-4' : 'pl-6 text-[11px] text-slate-500') + '">' + item.text + '</a>';
      });
      html += '      </nav>';
      html += '    </div>';
      html += '  </aside>';
    }

    html += '</div></div>';
    container.innerHTML = html;
  },

  toggleLike: function(postId) {
    var res = window.BlogStore.toggleLikePost(postId);
    var countEl = document.getElementById('post-like-count');
    var btn = document.getElementById('post-like-btn');
    if (countEl) countEl.innerText = res.count;
    if (btn) {
      if (res.liked) {
        btn.classList.add('bg-red-500', 'text-white', 'animate-heart');
        btn.classList.remove('bg-slate-100', 'text-slate-700');
        this.showToast('点赞成功，感谢认可！', 'success');
      } else {
        btn.classList.remove('bg-red-500', 'text-white');
        btn.classList.add('bg-slate-100', 'text-slate-700');
        this.showToast('已取消点赞', 'info');
      }
    }
  },

  toggleBookmark: function(postId) {
    var isBookmarked = window.BlogStore.toggleBookmark(postId);
    if (isBookmarked) this.showToast('已添加至个人书签', 'success');
    else this.showToast('已从个人书签移除', 'info');
    if (this.currentRoute.name === 'post') this.renderPostView(postId);
  },

  sharePost: function(postId) {
    var url = window.location.origin + window.location.pathname + '#/post/' + postId;
    var self = this;
    navigator.clipboard.writeText(url).then(function() {
      self.showToast('文章链接已复制到剪贴板！', 'success');
    }).catch(function() {
      prompt('请复制链接：', url);
    });
  },

  insertEmoji: function(emoji) {
    var textarea = document.getElementById('comment-content');
    if (textarea) {
      textarea.value += emoji;
      textarea.focus();
    }
  },

  submitComment: function(postId) {
    var authorInput = document.getElementById('comment-author');
    var contentInput = document.getElementById('comment-content');
    var author = authorInput ? authorInput.value.trim() : '';
    var content = contentInput ? contentInput.value.trim() : '';

    if (!author) {
      this.showToast('请输入您的昵称', 'warning');
      if (authorInput) authorInput.focus();
      return;
    }
    if (!content) {
      this.showToast('请输入评论内容', 'warning');
      if (contentInput) contentInput.focus();
      return;
    }

    window.BlogStore.addComment(postId, { author: author, content: content });
    this.showToast('评论发表成功！', 'success');
    this.renderPostView(postId);
  },

  likeComment: function(postId, commentId, btn) {
    var newLikes = window.BlogStore.likeComment(postId, commentId);
    if (btn) {
      var numSpan = btn.querySelector('.like-num');
      if (numSpan) numSpan.innerText = newLikes;
      btn.classList.add('text-red-500');
    }
    this.showToast('感谢为精彩评论点赞', 'success');
  },

  
  renderColumnsView: function() {
    var container = document.getElementById('app-main');
    var columns = window.BlogStore.getColumns();

    var html = '<div class="max-w-5xl mx-auto space-y-12">';
    html += '  <div class="text-center">';
    html += '    <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-mono mb-3">';
    html += '      ' + (window.BlogIcons ? window.BlogIcons.get('layers', 'w-3.5 h-3.5') : '') + ' CURATED SERIES & COLUMNS';
    html += '    </div>';
    html += '    <h1 class="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">系统化专题技术专栏</h1>';
    html += '    <p class="text-slate-500 text-xs max-w-xl mx-auto">循序渐进的系统化系列长文。支持在 posts/columns/ 目录下建立专属文件夹自动归档与连载。</p>';
    html += '  </div>';

    html += '  <div class="space-y-8">';
    if (columns.length === 0) {
      html += '    <div class="text-center py-16 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 text-slate-400 text-xs">暂无专栏数据</div>';
    } else {
      columns.forEach(function(col) {
        var totalWords = (col.totalWords || 0);
        var totalMinutes = Math.max(1, Math.ceil(totalWords / 400));
        var posts = col.posts || [];

        html += '    <div class="quantum-panel rounded-3xl overflow-hidden shadow-xl mb-8">';
        
        // Column Hero Header
        html += '      <div class="p-6 md:p-8 bg-gradient-to-r ' + (col.color || 'from-indigo-600 to-purple-600') + ' text-white flex flex-col md:flex-row md:items-center justify-between gap-6">';
        html += '        <div>';
        html += '          <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-semibold tracking-wider mb-2 uppercase">';
        html += '            <span>专栏连载中</span>';
        html += '          </div>';
        html += '          <h2 class="text-xl md:text-2xl font-bold mb-2">' + col.name + '</h2>';
        html += '          <p class="text-xs text-white/90 leading-relaxed max-w-2xl">' + col.desc + '</p>';
        html += '        </div>';
        html += '        <div class="flex items-center gap-4 text-xs font-mono bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/15 flex-shrink-0">';
        html += '          <div class="text-center"><div class="text-base font-bold">' + col.postsCount + '</div><div class="text-[10px] text-white/80">章节讲数</div></div>';
        html += '          <div class="w-px h-6 bg-white/20"></div>';
        html += '          <div class="text-center"><div class="text-base font-bold">' + (totalWords / 1000).toFixed(1) + 'k</div><div class="text-[10px] text-white/80">专栏字数</div></div>';
        html += '          <div class="w-px h-6 bg-white/20"></div>';
        html += '          <div class="text-center"><div class="text-base font-bold">' + totalMinutes + '</div><div class="text-[10px] text-white/80">预计分</div></div>';
        html += '        </div>';
        html += '      </div>';

        // Chapter Timeline List
        html += '      <div class="p-6 md:p-8 divide-y divide-slate-100 dark:divide-slate-700/60">';
        posts.forEach(function(p, idx) {
          var chapterNum = p.order || (idx + 1);
          html += '        <div class="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">';
          html += '          <div class="flex items-start sm:items-center gap-3.5">';
          html += '            <span class="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-mono font-bold text-xs text-slate-700 dark:text-slate-300 flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">' + chapterNum + '</span>';
          html += '            <div>';
          html += '              <a href="#/post/' + p.id + '" class="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">';
          html += '                ' + p.title;
          html += '              </a>';
          html += '              <p class="text-xs text-slate-500 line-clamp-1 mt-0.5">' + p.excerpt + '</p>';
          html += '            </div>';
          html += '          </div>';
          html += '          <div class="flex items-center gap-3 text-xs text-slate-400 flex-shrink-0 self-end sm:self-center">';
          html += '            <span class="font-mono text-[11px]">' + p.readTime + '</span>';
          html += '            <a href="#/post/' + p.id + '" class="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-700/60 group-hover:bg-blue-600 group-hover:text-white text-slate-600 dark:text-slate-300 transition-all font-medium text-xs flex items-center gap-1">';
          html += '              阅读 ' + (window.BlogIcons ? window.BlogIcons.get('chevron-right', 'w-3 h-3') : '');
          html += '            </a>';
          html += '          </div>';
          html += '        </div>';
        });
        html += '      </div>';

        html += '    </div>';
      });
    }
    html += '  </div>';

    // Folder sync guide callout
    html += '  <div class="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between gap-4">';
    html += '    <div class="flex items-center gap-3">';
    html += '      <div class="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">' + (window.BlogIcons ? window.BlogIcons.get('folder', 'w-4 h-4') : '') + '</div>';
    html += '      <div><div class="font-bold text-slate-900 dark:text-white">如何新建文件夹专栏？</div><div>只需在 posts/columns/ 下新建子文件夹（例如 posts/columns/rust-primer/01-start.md），系统自动提取并编排专栏。</div></div>';
    html += '    </div>';
    html += '    <a href="#/editor" class="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white font-medium flex-shrink-0">立即写作</a>';
    html += '  </div>';

    html += '</div>';

    container.innerHTML = html;
  },
  renderArchivesView: function() {
    var container = document.getElementById('app-main');
    var posts = window.BlogStore.getPosts();
    var groups = {};
    posts.forEach(function(p) {
      var year = p.date.split('-')[0];
      var month = p.date.split('-')[1];
      var key = year + '年' + month + '月';
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });

    var html = '<div class="max-w-4xl mx-auto">';
    html += '  <div class="mb-10 text-center">';
    html += '    <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-mono mb-3">';
    html += '      ' + (window.BlogIcons ? window.BlogIcons.get('calendar', 'w-3.5 h-3.5') : '') + ' TIMELINE ARCHIVES';
    html += '    </div>';
    html += '    <h1 class="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">文章时间轴归档</h1>';
    html += '    <p class="text-slate-500 text-xs">共计 ' + posts.length + ' 篇长文，记录技术沉淀与成长轨迹</p>';
    html += '  </div>';

    html += '  <div class="relative border-l-2 border-slate-200 dark:border-slate-700 ml-4 md:ml-32 space-y-12">';
    Object.entries(groups).forEach(function(entry) {
      var timeGroup = entry[0];
      var groupPosts = entry[1];
      html += '    <div class="relative pl-6 md:pl-8">';
      html += '      <div class="absolute -left-2.5 top-0 w-5 h-5 rounded-full border-4 border-white dark:border-slate-900 bg-blue-600 shadow-sm"></div>';
      html += '      <div class="mb-4">';
      html += '        <span class="text-lg font-bold text-slate-800 dark:text-slate-200">' + timeGroup + '</span>';
      html += '        <span class="text-xs text-slate-400 font-mono ml-2">(' + groupPosts.length + ' 篇)</span>';
      html += '      </div>';
      html += '      <div class="space-y-3">';
      groupPosts.forEach(function(p) {
        html += '        <div class="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:border-blue-300 dark:hover:border-blue-500 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group">';
        html += '          <div class="flex items-center gap-3">';
        html += '            <span class="text-xs text-slate-400 font-mono flex-shrink-0">' + p.date.slice(5) + '</span>';
        html += '            <a href="#/post/' + p.id + '" class="text-sm font-semibold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">' + p.title + '</a>';
        html += '          </div>';
        html += '          <div class="flex items-center gap-2 flex-shrink-0 text-xs">';
        html += '            <span class="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 text-[11px]">' + p.categoryName + '</span>';
        html += '            <span class="text-slate-400 font-mono text-[11px]">' + p.readTime + '</span>';
        html += '          </div>';
        html += '        </div>';
      });
      html += '      </div>';
      html += '    </div>';
    });
    html += '  </div>';
    html += '</div>';
    container.innerHTML = html;
  },

  renderCategoriesView: function() {
    var container = document.getElementById('app-main');
    var categories = window.BlogStore.categories;
    var allTags = window.BlogStore.getAllTags();

    var html = '<div class="max-w-4xl mx-auto space-y-12">';
    html += '  <div class="text-center">';
    html += '    <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-mono mb-3">';
    html += '      ' + (window.BlogIcons ? window.BlogIcons.get('layers', 'w-3.5 h-3.5') : '') + ' TAXONOMY';
    html += '    </div>';
    html += '    <h1 class="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">多维分类与标签云</h1>';
    html += '    <p class="text-slate-500 text-xs">通过知识领域或技术关键字快速定位感兴趣的主题</p>';
    html += '  </div>';

    html += '  <div>';
    html += '    <h2 class="text-base font-bold text-slate-800 dark:text-slate-200 mb-5 flex items-center gap-2">';
    html += '      ' + (window.BlogIcons ? window.BlogIcons.get('folder', 'w-4 h-4 text-blue-500') : '') + ' 主题分类 (' + categories.length + ')';
    html += '    </h2>';
    html += '    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">';
    categories.forEach(function(c) {
      var count = window.BlogStore.posts.filter(function(p) { return p.category === c.id; }).length;
      html += '      <div onclick="window.location.hash=\'#/\'; window.BlogApp.setCategory(\'' + c.id + '\')" class="cursor-pointer group p-6 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 transition-all flex flex-col justify-between">';
      html += '        <div>';
      html += '          <div class="w-10 h-10 rounded-xl bg-gradient-to-r ' + c.color + ' text-white flex items-center justify-center mb-4 shadow-sm group-hover:scale-105 transition-transform">';
      html += '            ' + (window.BlogIcons ? window.BlogIcons.get(c.icon || 'folder', 'w-5 h-5') : '');
      html += '          </div>';
      html += '          <h3 class="text-base font-bold text-slate-900 dark:text-white mb-2">' + c.name + '</h3>';
      html += '          <p class="text-xs text-slate-500 leading-relaxed mb-4">' + c.desc + '</p>';
      html += '        </div>';
      html += '        <div class="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700/60 text-xs text-blue-600 dark:text-blue-400 font-semibold">';
      html += '          <span>' + count + ' 篇文章</span><span class="group-hover:translate-x-1 transition-transform">浏览 →</span>';
      html += '        </div>';
      html += '      </div>';
    });
    html += '    </div>';
    html += '  </div>';

    html += '  <div class="bg-white dark:bg-slate-800/90 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-700/80 shadow-sm">';
    html += '    <h2 class="text-base font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">';
    html += '      ' + (window.BlogIcons ? window.BlogIcons.get('tag', 'w-4 h-4 text-purple-500') : '') + ' 全站标签矩阵 (' + allTags.length + ')';
    html += '    </h2>';
    html += '    <div class="flex flex-wrap gap-3">';
    allTags.forEach(function(t) {
      html += '      <button onclick="window.location.hash=\'#/\'; window.BlogApp.setTag(\'' + t.name + '\')" class="px-3.5 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-700 hover:bg-blue-600 hover:text-white text-slate-700 dark:text-slate-300 transition-all border border-slate-200 dark:border-slate-600 shadow-sm flex items-center gap-1.5">';
      html += '        <span>#' + t.name + '</span><span class="px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-600 text-[10px] font-mono">' + t.count + '</span>';
      html += '      </button>';
    });
    html += '    </div>';
    html += '  </div>';
    html += '</div>';
    container.innerHTML = html;
  },

    renderEditorView: function() {
    var container = document.getElementById('app-main');
    var categories = window.BlogStore.categories;
    var draft = window.BlogStore.getDraft() || {
      title: '',
      category: 'frontend',
      tags: '',
      content: '## 新文章标题\n\n在这里开始书写您的精彩见解...\n\n### 支持数学公式\n$\n\\sum_{i=1}^n i = \\frac{n(n+1)}{2}\n$\n\n### 支持代码高亮\n' + BT3 + 'javascript\nconsole.log("Hello, Aurora Blog!");\n' + BT3 + '\n\n::: tip 写作小贴士\n支持直接从剪贴板 ⌘V 粘贴屏幕截图，或拖拽本地 .md 文件自动载入！\n:::\n'
    };

    var html = '<div class="max-w-6xl mx-auto space-y-6">';
    html += '  <div class="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">';
    html += '    <div class="flex items-center gap-3">';
    html += '      <div class="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">' + (window.BlogIcons ? window.BlogIcons.get('edit-3', 'w-4 h-4') : '') + '</div>';
    html += '      <div><h2 class="text-sm font-bold text-slate-900 dark:text-white">在线 Markdown 文章发布器</h2><p class="text-[11px] text-slate-400">实时双栏分屏渲染 · 支持图片粘贴自动压缩 · 本地 .md 文件一键导入</p></div>';
    html += '    </div>';
    html += '    <div class="flex items-center gap-2">';
    html += '      <button type="button" onclick="document.getElementById(\'editor-md-upload\').click()" class="px-3.5 py-1.5 rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/60 dark:bg-blue-900/20 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors flex items-center gap-1.5 font-medium">';
    html += '        ' + (window.BlogIcons ? window.BlogIcons.get('file-plus', 'w-3.5 h-3.5') : '') + '<span>导入 .md 文档</span>';
    html += '      </button>';
    html += '      <input type="file" id="editor-md-upload" accept=".md,.markdown,.txt" class="hidden" onchange="window.BlogApp.handleMarkdownFileUpload(event)">';
    html += '      <button type="button" onclick="window.BlogApp.saveEditorDraft()" class="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">保存草稿</button>';
    html += '      <button type="button" onclick="window.BlogApp.publishPost()" class="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all">' + (window.BlogIcons ? window.BlogIcons.get('send', 'w-3.5 h-3.5') : '') + ' 立即发布</button>';
    html += '    </div>';
    html += '  </div>';

    html += '  <div class="grid grid-cols-1 md:grid-cols-12 gap-4 p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">';
    html += '    <div class="md:col-span-6">';
    html += '      <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">文章标题 *</label>';
    html += '      <input id="editor-title" type="text" value="' + (draft.title || '').replace(/"/g, '&quot;') + '" placeholder="例如：2026 年现代 Web 开发最佳实践" class="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100">';
    html += '    </div>';
    html += '    <div class="md:col-span-3">';
    html += '      <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">分类 *</label>';
    html += '      <select id="editor-category" class="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100">';
    categories.forEach(function(c) {
      html += '        <option value="' + c.id + '" ' + (draft.category === c.id ? 'selected' : '') + '>' + c.name + '</option>';
    });
    html += '      </select>';
    html += '    </div>';
    html += '    <div class="md:col-span-3">';
    html += '      <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">标签 (逗号分隔)</label>';
    html += '      <input id="editor-tags" type="text" value="' + (draft.tags || '').replace(/"/g, '&quot;') + '" placeholder="React, 性能优化, 思考" class="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100">';
    html += '    </div>';
    html += '  </div>';

    // Toolbar with Image and Markdown upload
    html += '  <div class="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">';
    html += '    <div class="flex flex-wrap items-center gap-1.5">';
    html += '      <button type="button" onclick="window.BlogApp.insertMarkdown(\'**\', \'**\')" class="px-2.5 py-1 rounded bg-white dark:bg-slate-700 font-bold hover:bg-slate-50 shadow-xs" title="加粗">B</button>';
    html += '      <button type="button" onclick="window.BlogApp.insertMarkdown(\'*\', \'*\')" class="px-2.5 py-1 rounded bg-white dark:bg-slate-700 italic hover:bg-slate-50 shadow-xs" title="斜体">I</button>';
    html += '      <button type="button" onclick="window.BlogApp.insertMarkdown(\'## \', \'\')" class="px-2.5 py-1 rounded bg-white dark:bg-slate-700 font-semibold hover:bg-slate-50 shadow-xs" title="二级标题">H2</button>';
    html += '      <button type="button" onclick="window.BlogApp.insertMarkdown(\'### \', \'\')" class="px-2.5 py-1 rounded bg-white dark:bg-slate-700 font-semibold hover:bg-slate-50 shadow-xs" title="三级标题">H3</button>';
    html += '      <button type="button" onclick="window.BlogApp.insertMarkdown(\'> \', \'\')" class="px-2.5 py-1 rounded bg-white dark:bg-slate-700 hover:bg-slate-50 shadow-xs" title="引用">引用</button>';
    html += '      <button type="button" onclick="window.BlogApp.insertCodeInline()" class="px-2.5 py-1 rounded bg-white dark:bg-slate-700 font-mono hover:bg-slate-50 shadow-xs" title="行内代码">&lt;code&gt;</button>';
    html += '      <button type="button" onclick="window.BlogApp.insertCodeBlock()" class="px-2.5 py-1 rounded bg-white dark:bg-slate-700 font-mono hover:bg-slate-50 shadow-xs" title="代码块">代码块</button>';
    html += '      <button type="button" onclick="window.BlogApp.insertMarkdown(\'$\\n\', \'\\n$\')" class="px-2.5 py-1 rounded bg-white dark:bg-slate-700 font-mono text-purple-600 dark:text-purple-400 hover:bg-slate-50 shadow-xs" title="数学公式">$\\sqrt{x}$</button>';
    html += '      <button type="button" onclick="window.BlogApp.insertMarkdown(\'::: tip 提示\\n\', \'\\n:::\')" class="px-2.5 py-1 rounded bg-white dark:bg-slate-700 text-green-600 hover:bg-slate-50 shadow-xs" title="提示框">:::Tip</button>';
    html += '      <button type="button" onclick="window.BlogApp.insertMarkdown(\'::: warning 警告\\n\', \'\\n:::\')" class="px-2.5 py-1 rounded bg-white dark:bg-slate-700 text-amber-600 hover:bg-slate-50 shadow-xs" title="警告框">:::Warn</button>';
    html += '      <span class="text-slate-300 dark:text-slate-600">|</span>';
    html += '      <button type="button" onclick="document.getElementById(\'editor-img-upload\').click()" class="px-2.5 py-1 rounded bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 hover:bg-slate-50 shadow-xs flex items-center gap-1 font-medium" title="选择本地图片，将自动压缩并插入">';
    html += '        ' + (window.BlogIcons ? window.BlogIcons.get('image', 'w-3.5 h-3.5') : '') + '<span>插入图片</span>';
    html += '      </button>';
    html += '      <input type="file" id="editor-img-upload" accept="image/*" class="hidden" onchange="window.BlogApp.handleImageUpload(event)">';
    html += '    </div>';
    html += '    <div class="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1.5 hidden sm:flex">';
    html += '      <span>💡 剪贴板 ⌘V 粘贴图片 / 拖拽图片或 .md 自动载入</span>';
    html += '    </div>';
    html += '  </div>';

    // Split Editor Pane
    html += '  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">';
    html += '    <div id="editor-source-box" class="flex flex-col bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden h-[580px] transition-all">';
    html += '      <div class="px-4 py-2 bg-slate-50 dark:bg-slate-700/60 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs font-mono text-slate-500">';
    html += '        <span>MARKDOWN SOURCE</span><span id="editor-word-count">0 字</span>';
    html += '      </div>';
    html += '      <textarea id="editor-content" oninput="window.BlogApp.updateEditorPreview()" class="w-full flex-grow p-4 font-mono text-xs leading-relaxed bg-transparent focus:outline-none resize-none text-slate-800 dark:text-slate-100" placeholder="在此键入 Markdown 正文... 支持直接 ⌘V 粘贴图片或将 .md / 图片拖拽至此...">' + (draft.content || '') + '</textarea>';
    html += '    </div>';

    html += '    <div class="flex flex-col bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden h-[580px]">';
    html += '      <div class="px-4 py-2 bg-slate-50 dark:bg-slate-700/60 border-b border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-500">';
    html += '        <span>LIVE PREVIEW</span>';
    html += '      </div>';
    html += '      <div id="editor-preview" class="p-6 overflow-y-auto flex-grow markdown-body"></div>';
    html += '    </div>';
    html += '  </div>';
    html += '</div>';

    container.innerHTML = html;
    this.updateEditorPreview();
    this.bindEditorPasteAndDrop();
  },

  bindEditorPasteAndDrop: function() {
    var self = this;
    var textarea = document.getElementById('editor-content');
    var sourceBox = document.getElementById('editor-source-box');
    if (!textarea) return;

    // Clipboard Paste Listener
    textarea.addEventListener('paste', function(e) {
      if (e.clipboardData && e.clipboardData.items) {
        for (var i = 0; i < e.clipboardData.items.length; i++) {
          var item = e.clipboardData.items[i];
          if (item.type.indexOf('image') !== -1) {
            e.preventDefault();
            var file = item.getAsFile();
            self.compressAndInsertImage(file);
            return;
          }
        }
      }
    });

    // Drag and Drop Listeners
    var targetBox = sourceBox || textarea;
    targetBox.addEventListener('dragover', function(e) {
      e.preventDefault();
      targetBox.classList.add('ring-2', 'ring-blue-500', 'bg-blue-50/10');
    });
    targetBox.addEventListener('dragleave', function(e) {
      targetBox.classList.remove('ring-2', 'ring-blue-500', 'bg-blue-50/10');
    });
    targetBox.addEventListener('drop', function(e) {
      e.preventDefault();
      targetBox.classList.remove('ring-2', 'ring-blue-500', 'bg-blue-50/10');
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        for (var i = 0; i < e.dataTransfer.files.length; i++) {
          var file = e.dataTransfer.files[i];
          if (file.type.indexOf('image/') !== -1) {
            self.compressAndInsertImage(file);
          } else if (file.name.endsWith('.md') || file.name.endsWith('.markdown') || file.name.endsWith('.txt')) {
            self.handleImportMarkdownFile(file);
          }
        }
      }
    });
  },

  handleImageUpload: function(event) {
    var file = event.target.files && event.target.files[0];
    if (file) {
      this.compressAndInsertImage(file);
    }
    event.target.value = '';
  },

  handleMarkdownFileUpload: function(event) {
    var file = event.target.files && event.target.files[0];
    if (file) {
      this.handleImportMarkdownFile(file);
    }
    event.target.value = '';
  },

  compressAndInsertImage: function(file) {
    if (!file) return;
    var self = this;
    var reader = new FileReader();
    reader.onload = function(e) {
      var img = new Image();
      img.onload = function() {
        var canvas = document.createElement('canvas');
        var maxDim = 1400;
        var w = img.width;
        var h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);

        var dataUrl = canvas.toDataURL('image/webp', 0.82);
        if (dataUrl.indexOf('data:image/webp') === -1) {
          dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        }

        var cleanName = (file.name ? file.name.replace(/\.[^/.]+$/, '') : '剪贴板插图') + '-' + new Date().getHours() + new Date().getMinutes() + new Date().getSeconds();
        var mdTag = '\n\n![' + cleanName + '](' + dataUrl + ')\n\n';

        self.insertAtCursor(mdTag);
        self.showToast('📸 图片已自动高保真压缩并插入 Markdown！', 'success');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  },

  handleImportMarkdownFile: function(file) {
    if (!file) return;
    var self = this;
    var reader = new FileReader();
    reader.onload = function(e) {
      var raw = e.target.result;
      self.parseAndLoadMarkdown(raw, file.name);
    };
    reader.readAsText(file);
  },

  parseAndLoadMarkdown: function(rawText, filename) {
    var title = '';
    var category = 'frontend';
    var tags = '';
    var content = rawText;

    // Parse Frontmatter
    var fmMatch = rawText.match(/^---[\r\n]+([\s\S]*?)[\r\n]+---[\r\n]+([\s\S]*)$/);
    if (fmMatch) {
      var fm = fmMatch[1];
      content = fmMatch[2].trim();

      var tMatch = fm.match(/^title:\s*['"]?(.*?)['"]?$/m);
      if (tMatch) title = tMatch[1].trim();

      var cMatch = fm.match(/^category:\s*['"]?(.*?)['"]?$/m);
      if (cMatch) {
        var catInput = cMatch[1].trim();
        var found = window.BlogStore.categories.find(function(c) {
          return c.id.toLowerCase() === catInput.toLowerCase() || c.name === catInput;
        });
        if (found) category = found.id;
      }

      var tagsMatch = fm.match(/^tags:\s*\[?(.*?)\]?$/m);
      if (tagsMatch) {
        tags = tagsMatch[1].replace(/[\[\]'"]/g, '').trim();
      }
    } else {
      var h1Match = content.match(/^#\s+(.+)$/m);
      if (h1Match) {
        title = h1Match[1].trim();
        content = content.replace(/^#\s+.+[\r\n]+/, '').trim();
      }
    }

    if (!title && filename) {
      title = filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    }

    var titleInput = document.getElementById('editor-title');
    var catSelect = document.getElementById('editor-category');
    var tagsInput = document.getElementById('editor-tags');
    var textarea = document.getElementById('editor-content');

    if (titleInput) titleInput.value = title || '未命名导入文档';
    if (catSelect) catSelect.value = category;
    if (tagsInput) tagsInput.value = tags;
    if (textarea) textarea.value = content;

    this.updateEditorPreview();
    this.showToast('📄 成功载入 ' + (filename || 'Markdown 文件') + '！可预览、修改或点击“立即发布”。', 'success');
  },

  insertAtCursor: function(text) {
    var textarea = document.getElementById('editor-content');
    if (!textarea) return;
    var start = textarea.selectionStart || textarea.value.length;
    var end = textarea.selectionEnd || textarea.value.length;
    textarea.value = textarea.value.substring(0, start) + text + textarea.value.substring(end);
    textarea.selectionStart = textarea.selectionEnd = start + text.length;
    textarea.focus();
    this.updateEditorPreview();
  },

  updateEditorPreview: function() {
    var textarea = document.getElementById('editor-content');
    var preview = document.getElementById('editor-preview');
    var countEl = document.getElementById('editor-word-count');
    if (!textarea || !preview) return;
    var raw = textarea.value;
    if (countEl) countEl.innerText = raw.length + ' 字';
    var res = window.BlogMarkdown.render(raw);
    preview.innerHTML = res.html;
  },

  
  insertCodeInline: function() {
    this.insertMarkdown(BT, BT);
  },

  insertCodeBlock: function() {
    this.insertMarkdown(BT3 + 'javascript\n', '\n' + BT3);
  },
  insertMarkdown: function(prefix, suffix) {
    var textarea = document.getElementById('editor-content');
    if (!textarea) return;
    var start = textarea.selectionStart;
    var end = textarea.selectionEnd;
    var selected = textarea.value.substring(start, end);
    var replacement = prefix + (selected || '文本') + suffix;
    textarea.value = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
    textarea.focus();
    textarea.selectionStart = start + prefix.length;
    textarea.selectionEnd = start + replacement.length - suffix.length;
    this.updateEditorPreview();
  },

  saveEditorDraft: function() {
    var title = (document.getElementById('editor-title')?.value || '').trim();
    var category = document.getElementById('editor-category')?.value || 'frontend';
    var tags = (document.getElementById('editor-tags')?.value || '').trim();
    var content = (document.getElementById('editor-content')?.value || '');
    window.BlogStore.saveDraft({ title: title, category: category, tags: tags, content: content });
    this.showToast('草稿已成功保存至本地', 'success');
  },

  publishPost: function() {
    var title = (document.getElementById('editor-title')?.value || '').trim();
    var category = document.getElementById('editor-category')?.value || 'frontend';
    var rawTags = (document.getElementById('editor-tags')?.value || '').trim();
    var content = (document.getElementById('editor-content')?.value || '').trim();

    if (!title) {
      this.showToast('请输入文章标题', 'warning');
      document.getElementById('editor-title')?.focus();
      return;
    }
    if (!content) {
      this.showToast('文章内容不能为空', 'warning');
      document.getElementById('editor-content')?.focus();
      return;
    }

    var tags = rawTags.split(/[,，\s]+/).filter(Boolean);
    var gradients = ['from-blue-600 to-indigo-600', 'from-purple-600 to-pink-600', 'from-emerald-600 to-teal-600', 'from-amber-600 to-rose-600'];
    var coverGradient = gradients[Math.floor(Math.random() * gradients.length)];

    var newPost = window.BlogStore.addPost({
      title: title,
      category: category,
      tags: tags,
      content: content,
      coverGradient: coverGradient
    });

    window.BlogStore.clearDraft();
    this.showToast('🎉 文章发布成功！正在跳转...', 'success');
    setTimeout(function() { window.location.hash = '#/post/' + newPost.id; }, 600);
  },

  renderAboutView: function() {
    var container = document.getElementById('app-main');
    var author = window.BlogStore.author;
    var html = '<div class="max-w-4xl mx-auto space-y-10">';
    html += '  <div class="p-8 md:p-12 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-sm text-center relative overflow-hidden">';
    html += '    <div class="w-28 h-28 mx-auto mb-5 relative">';
    html += '      <img src="' + author.avatar + '" class="w-28 h-28 rounded-full object-cover ring-4 ring-blue-500/30 shadow-lg">';
    html += '    </div>';
    html += '    <h1 class="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white mb-2">' + author.name + '</h1>';
    html += '    <p class="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-4">' + author.title + '</p>';
    html += '    <p class="text-xs text-slate-500 max-w-xl mx-auto mb-6 leading-relaxed">' + author.bio + '</p>';
    html += '    <div class="flex flex-wrap justify-center items-center gap-3">';
    html += '      <a href="mailto:' + author.email + '" class="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold shadow-sm hover:bg-blue-700 transition-colors flex items-center gap-1.5">' + (window.BlogIcons ? window.BlogIcons.get('mail', 'w-3.5 h-3.5') : '') + ' 发送邮件</a>';
    html += '      <a href="' + author.github + '" target="_blank" class="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-200 transition-colors flex items-center gap-1.5">' + (window.BlogIcons ? window.BlogIcons.get('github', 'w-3.5 h-3.5') : '') + ' GitHub 主页</a>';
    html += '      <button onclick="window.BlogApp.resetSampleData()" class="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium hover:bg-red-50 hover:text-red-600 transition-colors" title="恢复博客初始示例文章与评论">重置演示数据</button>';
    html += '    </div>';
    html += '  </div>';

    html += '  <div class="p-8 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-sm">';
    html += '    <h2 class="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">';
    html += '      ' + (window.BlogIcons ? window.BlogIcons.get('terminal', 'w-5 h-5 text-blue-500') : '') + ' 技术栈与工程武器库';
    html += '    </h2>';
    html += '    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">';
    html += '      <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200/60 dark:border-slate-600/60">';
    html += '        <h3 class="text-xs font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-blue-500"></span> 现代前端 (Frontend)</h3>';
    html += '        <div class="flex flex-wrap gap-1.5">';
    ['TypeScript', 'React 19', 'Next.js', 'Vue 3', 'Tailwind CSS', 'Vite', 'WebAssembly'].forEach(function(s) {
      html += '          <span class="text-xs px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">' + s + '</span>';
    });
    html += '        </div>';
    html += '      </div>';
    html += '      <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200/60 dark:border-slate-600/60">';
    html += '        <h3 class="text-xs font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-emerald-500"></span> 云原生后端 (Backend)</h3>';
    html += '        <div class="flex flex-wrap gap-1.5">';
    ['Go (Golang)', 'Python / FastAPI', 'Node.js', 'PostgreSQL', 'Redis', 'Docker', 'Kubernetes'].forEach(function(s) {
      html += '          <span class="text-xs px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">' + s + '</span>';
    });
    html += '        </div>';
    html += '      </div>';
    html += '      <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200/60 dark:border-slate-600/60">';
    html += '        <h3 class="text-xs font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-purple-500"></span> 人工智能 (AI / ML)</h3>';
    html += '        <div class="flex flex-wrap gap-1.5">';
    ['LLM 微调', 'RAG 向量检索', 'ChromaDB', 'LangChain', 'PyTorch', 'Agentic Workflow'].forEach(function(s) {
      html += '          <span class="text-xs px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">' + s + '</span>';
    });
    html += '        </div>';
    html += '      </div>';
    html += '    </div>';
    html += '  </div>';

    html += '  <div class="p-8 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-sm">';
    html += '    <h2 class="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">';
    html += '      ' + (window.BlogIcons ? window.BlogIcons.get('sparkles', 'w-5 h-5 text-amber-500') : '') + ' 开源项目与实践作品';
    html += '    </h2>';
    html += '    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">';
    html += '      <div class="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-blue-400 transition-colors">';
    html += '        <div class="flex items-center justify-between mb-2">';
    html += '          <h3 class="text-sm font-bold text-slate-900 dark:text-white">Aurora Blog Engine</h3>';
    html += '          <span class="text-[10px] px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/30 text-green-600">Active</span>';
    html += '        </div>';
    html += '        <p class="text-xs text-slate-500 mb-4 leading-relaxed">现代化轻量级个人独立博客系统，内置 KaTeX 公式、全文本地检索与 Markdown 在线编辑器。</p>';
    html += '        <div class="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400"><span>JavaScript · Tailwind CSS · SPA</span></div>';
    html += '      </div>';
    html += '      <div class="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-blue-400 transition-colors">';
    html += '        <div class="flex items-center justify-between mb-2">';
    html += '          <h3 class="text-sm font-bold text-slate-900 dark:text-white">VectorFlow RAG</h3>';
    html += '          <span class="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600">Open Source</span>';
    html += '        </div>';
    html += '        <p class="text-xs text-slate-500 mb-4 leading-relaxed">高召回率多路混合检索（Dense + BM25）流水线库，支持流式生成与 Citation 溯源。</p>';
    html += '        <div class="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400"><span>Python · FastAPI · ChromaDB</span></div>';
    html += '      </div>';
    html += '    </div>';
    html += '  </div>';
    html += '</div>';

    container.innerHTML = html;
  },

  resetSampleData: function() {
    if (confirm('确认重置演示数据吗？这将还原默认的 5 篇高质量文章和预设评论。')) {
      window.BlogStore.resetToDefault();
      this.showToast('已成功重置为默认演示数据！', 'success');
      var self = this;
      setTimeout(function() {
        window.location.hash = '#/';
        self.renderHomeView();
      }, 500);
    }
  },

  openSearchModal: function() {
    var modal = document.getElementById('search-modal');
    var input = document.getElementById('search-modal-input');
    if (modal) {
      modal.classList.remove('hidden');
      if (input) {
        input.value = '';
        input.focus();
        this.runModalSearch('');
      }
    }
  },

  closeSearchModal: function() {
    var modal = document.getElementById('search-modal');
    if (modal) modal.classList.add('hidden');
  },

  runModalSearch: function(query) {
    var resultsContainer = document.getElementById('search-modal-results');
    if (!resultsContainer) return;
    var trimmed = query.trim().toLowerCase();
    var posts = window.BlogStore.posts.filter(function(p) {
      if (!trimmed) return true;
      return (
        (p.title && p.title.toLowerCase().indexOf(trimmed) !== -1) ||
        (p.excerpt && p.excerpt.toLowerCase().indexOf(trimmed) !== -1) ||
        (p.content && p.content.toLowerCase().indexOf(trimmed) !== -1) ||
        (p.tags && p.tags.some(function(t) { return t.toLowerCase().indexOf(trimmed) !== -1; }))
      );
    });

    if (posts.length === 0) {
      resultsContainer.innerHTML = '<div class="text-center py-12 text-slate-400 text-xs">没有找到匹配 "' + query + '" 的文章</div>';
      return;
    }

    var html = '';
    posts.forEach(function(p) {
      html += '<a href="#/post/' + p.id + '" onclick="window.BlogApp.closeSearchModal()" class="block p-3.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors group">';
      html += '  <div class="flex items-center justify-between text-xs mb-1">';
      html += '    <span class="font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">' + p.title + '</span>';
      html += '    <span class="text-slate-400 font-mono text-[11px]">' + p.date + '</span>';
      html += '  </div>';
      html += '  <p class="text-xs text-slate-500 line-clamp-1 mb-1.5">' + p.excerpt + '</p>';
      html += '  <div class="flex items-center gap-2 text-[11px] text-slate-400">';
      html += '    <span class="px-2 py-0.5 rounded bg-slate-200/60 dark:bg-slate-700 text-slate-600 dark:text-slate-300">' + p.categoryName + '</span>';
      (p.tags || []).slice(0, 3).forEach(function(t) { html += '<span>#' + t + '</span>'; });
      html += '  </div>';
      html += '</a>';
    });
    resultsContainer.innerHTML = html;
  },

  showToast: function(message, type) {
    var container = document.getElementById('toast-container');
    if (!container) return;
    var colors = {
      success: 'bg-emerald-600 text-white',
      error: 'bg-red-600 text-white',
      warning: 'bg-amber-600 text-white',
      info: 'bg-slate-900 dark:bg-white dark:text-slate-900 text-white'
    }[type || 'info'] || 'bg-slate-900 text-white';

    var toast = document.createElement('div');
    toast.className = 'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-lg ' + colors + ' animate-modal transition-all';
    toast.innerHTML = '<span>' + message + '</span>';
    container.appendChild(toast);

    setTimeout(function() {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(function() { toast.remove(); }, 200);
    }, 2800);
  }
};