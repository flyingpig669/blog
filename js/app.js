/**
 * ==============================================================================
 * Aurora Blog - 核心应用控制器 (Core Application & Modular Views)
 * ==============================================================================
 * 设计美学：Linear / Vercel / Raycast 冷静克制深色科技风。
 * 遵循 8px 间距系统，极细边框，充足呼吸感与留白。
 */

window.BlogApp = {
  currentRoute: { name: 'home', params: {} },
  activeTag: null,
  searchQuery: '',

  // ----------------------------------------------------------------------------
  // 1. 初始化与全局 Chrome 渲染
  // ----------------------------------------------------------------------------
  init: function() {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }

    // 初始化数据层
    window.BlogStore.init();

    // 动态渲染导航栏、页脚与站点基础配置
    this.renderGlobalChrome();

    // 挂载事件监听器
    this.setupEventListeners();

    // 执行当前路由分发
    this.handleRoute();

    var self = this;
    window.addEventListener('hashchange', function() {
      self.handleRoute();
    });
  },

  // 渲染全局导航、页脚与品牌标识 (数据源自 blog.config.js)
  renderGlobalChrome: function() {
    var config = window.BlogStore.config || window.BlogConfig || {};
    var site = config.site || {};
    var nav = config.nav || [];
    var social = config.social || [];

    // 1. 设置网页标题
    if (site.title) {
      document.title = site.title;
    }

    // 2. 顶部 Brand 标识
    var brandLogoEl = document.querySelector('header a[href="#/"] span:last-child');
    if (brandLogoEl && site.brand) {
      brandLogoEl.textContent = site.brand;
    }

    // 3. 桌面端导航菜单
    var desktopNavEl = document.querySelector('header nav');
    if (desktopNavEl && nav.length > 0) {
      var navHtml = '';
      nav.forEach(function(item) {
        var href = item.href || (item.route ? '#' + (item.route.startsWith('/') ? item.route : '/' + item.route) : '#/' + item.id);
        var isExternal = href.indexOf('http') === 0;
        navHtml += '<a href="' + href + '" data-nav-link="' + item.id + '" ' + (isExternal ? 'target="_blank" rel="noopener noreferrer"' : '') + ' class="nav-link">' + item.label + '</a>';
      });
      desktopNavEl.innerHTML = navHtml;
    }

    // 4. 移动端抽屉菜单
    var mobileDrawerEl = document.getElementById('mobile-drawer');
    if (mobileDrawerEl && nav.length > 0) {
      var drawerHtml = '';
      nav.forEach(function(item) {
        var href = item.href || (item.route ? '#' + (item.route.startsWith('/') ? item.route : '/' + item.route) : '#/' + item.id);
        var isExternal = href.indexOf('http') === 0;
        drawerHtml += '<a href="' + href + '" ' + (isExternal ? 'target="_blank" rel="noopener noreferrer"' : '') + ' onclick="window.BlogApp.closeMobileDrawer()" class="block py-1.5 text-[14px] text-[#8B8B8E] hover:text-[#EDEDED] transition-colors">' + item.label + '</a>';
      });
      drawerHtml += '<a href="#/editor" onclick="document.getElementById(\'mobile-drawer\').classList.add(\'hidden\')" class="block py-1.5 text-[14px] text-[#3B82F6] font-mono">Write Article</a>';
      mobileDrawerEl.innerHTML = drawerHtml;
    }

    // 5. 页脚版权 (联系方式仅在 About 页面独占展示)
    var footerEl = document.querySelector('footer');
    if (footerEl) {
      var copyEl = footerEl.querySelector('#footer-copyright') || footerEl.querySelector('div:first-child');
      if (copyEl && site.footerText) {
        copyEl.textContent = site.footerText;
      }
    }
  },

  // ----------------------------------------------------------------------------
  // 2. 全局事件监听 (快捷键、滚动侦听、代码复制、目录导航)
  // ----------------------------------------------------------------------------
  setupEventListeners: function() {
    var self = this;

    // 键盘快捷键 (Cmd+K / Ctrl+K 搜索, ESC 关闭)
    window.addEventListener('keydown', function(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        self.openSearchModal();
      }
      if (e.key === 'Escape') {
        self.closeSearchModal();
        self.closeMobileOutline();
      }
    });

    // Delegated Outline 标题跳转点击拦截器
    document.addEventListener('click', function(e) {
      var outlineBtn = e.target.closest('[data-outline-target]');
      if (outlineBtn) {
        var targetId = outlineBtn.getAttribute('data-outline-target');
        if (targetId && self && typeof self.scrollToHeading === 'function') {
          e.preventDefault();
          e.stopPropagation();
          self.scrollToHeading(targetId);
        }
      }
    });

    // Delegated 代码块一键复制处理器
    document.addEventListener('click', function(e) {
      var copyBtn = e.target.closest('.code-copy-btn');
      if (copyBtn) {
        var rawCode = decodeURIComponent(copyBtn.getAttribute('data-code') || '');
        if (navigator.clipboard) {
          navigator.clipboard.writeText(rawCode).then(function() {
            var orig = copyBtn.innerHTML;
            copyBtn.innerHTML = '<span>Copied</span>';
            setTimeout(function() { copyBtn.innerHTML = orig; }, 1800);
          });
        }
      }
    });

    // 滚动事件监听器: 进度条 + Active Outline Scrollspy 高亮
    window.addEventListener('scroll', function() {
      // 1. 阅读进度条
      var progressBar = document.getElementById('reading-progress-bar');
      var container = document.getElementById('reading-progress-container');
      var total = document.documentElement.scrollHeight - window.innerHeight;
      if (progressBar && container) {
        if (total > 200 && self.currentRoute.name === 'post') {
          container.classList.remove('hidden');
          var progress = Math.min(100, Math.max(0, (window.scrollY / total) * 100));
          progressBar.style.width = progress + '%';
        } else {
          container.classList.add('hidden');
        }
      }

      // 2. Active Outline Scrollspy (右侧悬浮目录高亮指示)
      if (self.currentRoute.name === 'post') {
        var headings = document.querySelectorAll('.markdown-body h1, .markdown-body h2, .markdown-body h3');
        if (headings && headings.length > 0) {
          var currentId = '';
          headings.forEach(function(h) {
            var top = h.getBoundingClientRect().top;
            if (top <= 120) {
              currentId = h.id;
            }
          });
          // 滚动至文档底部时激活最后一个标题
          if ((window.innerHeight + window.scrollY) >= (document.documentElement.scrollHeight - 60)) {
            currentId = headings[headings.length - 1].id;
          }
          if (currentId) {
            document.querySelectorAll('#desktop-outline-nav button, #desktop-toc-nav button').forEach(function(btn) {
              var t = btn.getAttribute('data-outline-target') || btn.getAttribute('data-target');
              if (t === currentId) {
                btn.classList.add('active');
              } else {
                btn.classList.remove('active');
              }
            });
          }
        }
      }
    });
  },

  // ----------------------------------------------------------------------------
  // 3. 目录跳转与移动端抽屉动画
  // ----------------------------------------------------------------------------
  scrollToHeading: function(id) {
    if (!id) return;
    var el = document.getElementById(id);
    if (el) {
      var navHeight = 76; // 56px sticky header + 20px padding buffer
      var rect = el.getBoundingClientRect();
      var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      var targetY = rect.top + scrollTop - navHeight;
      window.scrollTo({
        top: Math.max(0, targetY),
        behavior: 'smooth'
      });

      // 立即触发高亮状态反馈
      document.querySelectorAll('#desktop-outline-nav button, #desktop-toc-nav button, #mobile-outline-drawer button, #mobile-toc-drawer button').forEach(function(btn) {
        var t = btn.getAttribute('data-outline-target') || btn.getAttribute('data-target');
        if (t === id) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    }
    this.closeMobileOutline();
  },

  toggleMobileOutline: function() {
    var drawer = document.getElementById('mobile-outline-drawer') || document.getElementById('mobile-toc-drawer');
    if (drawer) {
      if (drawer.classList.contains('hidden')) {
        drawer.classList.remove('hidden');
        setTimeout(function() { drawer.classList.remove('translate-x-full'); }, 10);
      } else {
        drawer.classList.add('translate-x-full');
        setTimeout(function() { drawer.classList.add('hidden'); }, 200);
      }
    }
  },

  closeMobileDrawer: function() { var d = document.getElementById('mobile-drawer'); if (d) d.classList.add('hidden'); },

  closeMobileOutline: function() {
    var drawer = document.getElementById('mobile-outline-drawer') || document.getElementById('mobile-toc-drawer');
    if (drawer && !drawer.classList.contains('hidden')) {
      drawer.classList.add('translate-x-full');
      setTimeout(function() { drawer.classList.add('hidden'); }, 200);
    }
  },

  toggleMobileToc: function() { this.toggleMobileOutline(); },
  closeMobileToc: function() { this.closeMobileOutline(); },

  // ----------------------------------------------------------------------------
  // 4. 路由分发系统 (Hash Router)
  // ----------------------------------------------------------------------------
  handleRoute: function() {
    window.scrollTo(0, 0);
    var drawer = document.getElementById('mobile-drawer');
    if (drawer) drawer.classList.add('hidden');
    this.closeMobileOutline();

    var hash = window.location.hash.slice(1) || '/';
    var path = hash.split('?')[0];

    document.querySelectorAll('.nav-link').forEach(function(link) {
      link.classList.remove('active');
    });

    if (path.indexOf('/post/') === 0) {
      var id = path.replace('/post/', '');
      this.currentRoute = { name: 'post', params: { id: id } };
      this.renderPostView(id);
      return;
    }

    if (path === '/editor') {
      this.currentRoute = { name: 'editor', params: {} };
      this.renderEditorView();
      return;
    }

    var nav = (window.BlogStore.config && window.BlogStore.config.nav) || (window.BlogConfig && window.BlogConfig.nav) || [];
    var matchedNavItem = nav.find(function(item) {
      var r = item.route || item.href || '';
      if (r.indexOf('#') === 0) r = r.slice(1);
      if (!r.startsWith('/')) r = '/' + r;
      return r === path || (r === '/' && (path === '' || path === '/'));
    });

    if (matchedNavItem) {
      var navId = matchedNavItem.id;
      this.setActiveNav(navId);

      if (navId === 'home') {
        this.currentRoute = { name: 'home', params: {} };
        this.renderHomeView();
      } else if (navId === 'columns') {
        this.currentRoute = { name: 'columns', params: {} };
        this.renderColumnsView();
      } else if (navId === 'archives') {
        this.currentRoute = { name: 'archives', params: {} };
        this.renderArchivesView();
      } else if (navId === 'categories' || navId === 'tags') {
        this.currentRoute = { name: 'tags', params: {} };
        this.renderTagsView();
      } else if (navId === 'about') {
        this.currentRoute = { name: 'about', params: {} };
        this.renderAboutView();
      } else {
        this.currentRoute = { name: navId, params: {}, navItem: matchedNavItem };
        this.renderDynamicNavView(matchedNavItem);
      }
      return;
    }

    this.setActiveNav('home');
    this.renderHomeView();
  },

  setActiveNav: function(id) {
    var link = document.querySelector('[data-nav-link="' + id + '"]');
    if (link) link.classList.add('active');
  },

  // 5.1 首页视图 (Home View)
  renderHomeView: function() {
    var container = document.getElementById('app-main');
    var site = (window.BlogStore.config && window.BlogStore.config.site) || {};
    var posts = window.BlogStore.getPosts();

    if (this.activeTag) {
      posts = posts.filter(function(p) {
        return (p.tags || []).indexOf(window.BlogApp.activeTag) !== -1;
      });
    }

    var html = '<div class="max-w-[720px] mx-auto">';

    // Hero Section
    html += '<section class="pt-20 md:pt-24 pb-12 border-b border-white/[0.06]">';
    html += '  <h1 class="text-[40px] sm:text-[46px] md:text-[50px] font-bold text-[#EDEDED] tracking-[-0.03em] leading-[1.15] mb-4 font-sans">';
    html += site.title || 'Aurora Notes';
    html += '  </h1>';
    html += '  <p class="text-[17px] sm:text-[18px] text-[#8B8B8E] leading-relaxed max-w-[620px]">';
    html += site.tagline || 'Curated technical writings, system architecture notes, and computing fundamentals.';
    html += '  </p>';

    if (this.activeTag) {
      html += '  <div class="mt-6 flex items-center gap-2 text-[13px] font-mono text-[#8B8B8E]">';
      html += '    <span>Filtering by: <span class="text-[#3B82F6]">#' + this.activeTag + '</span></span>';
      html += '    <button type="button" onclick="window.BlogApp.clearTag()" class="text-[#5A5A5E] hover:text-[#EDEDED] ml-2 cursor-pointer">✕ clear</button>';
      html += '  </div>';
    }
    html += '</section>';

    // Article List
    html += '<section class="divide-y divide-white/[0.06]">';
    if (posts.length === 0) {
      html += '<div class="py-24 text-center text-[#5A5A5E] font-mono text-[14px]">';
      html += '  <p class="mb-3 text-[#8B8B8E]">No articles found.</p>';
      html += '  <p class="text-[12px]">Add a Markdown file to <code class="text-[#EDEDED] bg-white/[0.06] px-1.5 py-0.5 rounded">posts/</code> or click <a href="#/editor" class="text-[#3B82F6] hover:underline">Write</a> to publish your first post.</p>';
      html += '</div>';
    } else {
      posts.forEach(function(post) {
        html += '<article class="post-item group">';
        // Row 1: Date & Metadata
        html += '  <div class="flex items-center gap-2 text-[12px] font-mono text-[#5A5A5E] mb-2">';
        html += '    <span>' + post.date + '</span>';
        if (post.readTime) {
          html += '    <span>·</span>';
          html += '    <span>' + post.readTime + '</span>';
        }
        if (post.pinned) {
          html += '    <span class="px-1.5 py-0.2 rounded text-[10px] bg-[#3B82F6]/15 text-[#3B82F6] font-medium">PINNED</span>';
        }
        html += '  </div>';

        // Row 2: Title
        html += '  <h2 class="mb-2">';
        html += '    <a href="#/post/' + post.id + '" class="post-item-title block leading-snug">';
        html += post.title;
        html += '    </a>';
        html += '  </h2>';

        // Row 3: Excerpt
        if (post.excerpt) {
          html += '  <p class="text-[14px] text-[#8B8B8E] leading-relaxed line-clamp-2 mb-3.5">';
          html += post.excerpt;
          html += '  </p>';
        }

        // Row 4: Tag Pills
        if ((post.tags || []).length > 0) {
          html += '  <div class="flex flex-wrap items-center gap-2">';
          post.tags.forEach(function(tag) {
            html += '    <a href="#/" onclick="window.BlogApp.setTag(decodeURIComponent(\'' + encodeURIComponent(tag) + '\'))" class="tag-pill">#' + tag + '</a>';
          });
          html += '  </div>';
        }
        html += '</article>';
      });
    }
    html += '</section>';
    html += '</div>';

    container.innerHTML = html;
  },

  // 5.2 文章详情视图 (Post Detail View - 附带常驻右侧 Outline 浮动导航)
  renderPostView: function(postId) {
    var container = document.getElementById('app-main');
    var post = window.BlogStore.getPostById(postId);

    if (!post) {
      container.innerHTML = '<div class="py-32 text-center text-[#8B8B8E]"><h2 class="text-[20px] font-semibold text-[#EDEDED] mb-3">Article Not Found</h2><a href="#/" class="text-[#3B82F6] text-[14px]">← Back to home</a></div>';
      return;
    }

    window.BlogStore.incrementView(post.id);
    var mdResult = window.BlogMarkdown.render(post.content);
    var renderedHtml = mdResult.html;
    var toc = mdResult.toc || [];

    var allPosts = window.BlogStore.posts;
    var currentIndex = allPosts.findIndex(function(p) { return p.id === post.id; });
    var prevPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
    var nextPost = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;

    var columnInfo = post.column ? window.BlogStore.getColumnById(post.column) : null;
    var partNumber = post.order ? (post.order < 10 ? '0' + post.order : post.order) : '01';

    // 双栏布局容器: 最大宽度 1000px 居中
    var html = '<div class="max-w-[1000px] mx-auto pt-12 md:pt-16 pb-20 flex justify-between items-start gap-6 lg:gap-10 relative">';

    // 左侧正文列: 自适应 680px 宽度
    html += '<div class="flex-1 max-w-[680px] min-w-0">';

    // 返回按钮
    html += '<div class="mb-8">';
    html += '  <a href="#/" class="text-[13px] font-mono text-[#8B8B8E] hover:text-[#3B82F6] transition-colors inline-flex items-center gap-1.5">← Back to writing</a>';
    html += '</div>';

    // 专栏系列横幅 (若属于某个专栏)
    if (columnInfo) {
      html += '<div class="mb-6 py-2 px-3.5 rounded-[6px] bg-[#161618] border border-white/[0.08] flex items-center justify-between text-[12px] font-mono text-[#8B8B8E]">';
      html += '  <div class="flex items-center gap-2 min-w-0">';
      html += '    <span class="px-1.5 py-0.5 rounded bg-[#3B82F6]/15 text-[#3B82F6] text-[11px] font-medium shrink-0">PART ' + partNumber + '</span>';
      html += '    <span class="text-[#EDEDED] font-sans truncate">' + columnInfo.name + '</span>';
      html += '  </div>';
      html += '  <a href="#/columns" class="text-[#8B8B8E] hover:text-[#3B82F6] transition-colors shrink-0 ml-3">Series Index →</a>';
      html += '</div>';
    }

    // 文章头部
    html += '<header class="mb-8 pb-6 border-b border-white/[0.06]">';
    html += '  <h1 class="text-[30px] sm:text-[34px] md:text-[36px] font-bold text-[#EDEDED] tracking-[-0.02em] leading-[1.25] mb-4 font-sans">' + post.title + '</h1>';
    
    // 元信息行: 日期 · 阅读时长 · 字数 · 标签
    html += '  <div class="flex flex-wrap items-center gap-2 text-[12px] font-mono text-[#5A5A5E]">';
    html += '    <span>' + post.date + '</span>';
    html += '    <span>·</span>';
    html += '    <span>' + (post.readTime || '3 min read') + '</span>';
    if (post.words) {
      html += '    <span>·</span>';
      html += '    <span>' + post.words + ' words</span>';
    }
    if ((post.tags || []).length > 0) {
      html += '    <span>·</span>';
      html += '    <div class="inline-flex flex-wrap gap-1.5">';
      post.tags.forEach(function(t) {
        html += '      <span class="text-[#8B8B8E]">#' + t + '</span>';
      });
      html += '    </div>';
    }
    html += '  </div>';
    html += '</header>';

    // Markdown 正文
    html += '<article class="markdown-body mb-16">';
    html += renderedHtml;
    html += '</article>';

    // 上一篇 / 下一篇导航
    html += '<div class="pt-8 border-t border-white/[0.06] grid grid-cols-1 sm:grid-cols-2 gap-4">';
    if (prevPost) {
      html += '<a href="#/post/' + prevPost.id + '" class="linear-card p-4 text-left group block">';
      html += '  <div class="text-[11px] font-mono text-[#5A5A5E] mb-1">← PREVIOUS</div>';
      html += '  <div class="text-[14px] font-medium text-[#EDEDED] group-hover:text-[#3B82F6] transition-colors line-clamp-1">' + prevPost.title + '</div>';
      html += '</a>';
    } else {
      html += '<div></div>';
    }

    if (nextPost) {
      html += '<a href="#/post/' + nextPost.id + '" class="linear-card p-4 text-right group block">';
      html += '  <div class="text-[11px] font-mono text-[#5A5A5E] mb-1">NEXT →</div>';
      html += '  <div class="text-[14px] font-medium text-[#EDEDED] group-hover:text-[#3B82F6] transition-colors line-clamp-1">' + nextPost.title + '</div>';
      html += '</a>';
    }
    html += '</div>';

    html += '</div>'; // 结束左侧列

    // 右侧列: 常驻悬浮 Outline 侧边栏 (屏幕宽度 >= 600px 自动展开)
    if (toc.length > 0) {
      html += '<aside class="outline-floating-sidebar toc-floating-sidebar w-[180px] lg:w-[220px] shrink-0 sticky top-20 font-mono text-[12px]">';
      html += '  <div class="text-[11px] font-mono uppercase tracking-wider text-[#5A5A5E] mb-3">Outline</div>';
      html += '  <nav id="desktop-outline-nav" class="space-y-1 border-l border-white/[0.08] pl-3 max-h-[calc(100vh-140px)] overflow-y-auto">';
      toc.forEach(function(item) {
        var indentClass = item.level === 3 ? 'pl-2.5 text-[11px] text-[#5A5A5E]' : 'text-[12.5px] text-[#8B8B8E]';
        var escapedTitle = (item.text || '').replace(/"/g, '&quot;');
        html += '  <div class="toc-item">';
        html += '    <button type="button" data-outline-target="' + item.id + '" data-target="' + item.id + '" data-level="' + item.level + '" onclick="window.BlogApp.scrollToHeading(&apos;' + item.id + '&apos;)" class="outline-nav-btn text-left w-full block ' + indentClass + ' hover:text-[#3B82F6] transition-colors truncate leading-relaxed cursor-pointer bg-transparent border-none p-0 py-0.5" title="' + escapedTitle + '">';
        html += item.text;
        html += '    </button>';
        html += '  </div>';
      });
      html += '  </nav>';
      html += '</aside>';
    }

    html += '</div>'; // 结束外层双栏

    // 小屏浮动胶囊 (# Outline) 与侧滑抽屉 (< 600px)
    if (toc.length > 0) {
      html += '<div class="outline-floating-fab toc-floating-fab">';
      html += '  <button type="button" onclick="window.BlogApp.toggleMobileOutline()" class="fixed right-5 bottom-20 z-40 px-3 py-2 rounded-full bg-[#111113]/90 backdrop-blur-md border border-white/[0.12] text-[12px] font-mono text-[#EDEDED] shadow-xl hover:border-[#3B82F6] flex items-center gap-1.5 cursor-pointer" title="Outline">';
      html += '    <span class="text-[#3B82F6]">#</span>';
      html += '    <span>Outline</span>';
      html += '  </button>';
      html += '  <div id="mobile-outline-drawer" class="fixed inset-y-0 right-0 w-[280px] max-w-[85vw] bg-[#0A0A0B]/95 backdrop-blur-xl border-l border-white/[0.08] z-50 p-6 transform translate-x-full transition-transform duration-200 overflow-y-auto hidden">';
      html += '    <div class="flex items-center justify-between pb-4 border-b border-white/[0.06] mb-4">';
      html += '      <span class="text-[12px] font-mono uppercase tracking-wider text-[#5A5A5E]">Outline</span>';
      html += '      <button type="button" onclick="window.BlogApp.toggleMobileOutline()" class="text-[#8B8B8E] hover:text-[#EDEDED] text-[16px] cursor-pointer">✕</button>';
      html += '    </div>';
      html += '    <nav class="space-y-2 font-mono text-[13px]">';
      toc.forEach(function(item) {
        var indent = item.level === 3 ? 'pl-3 text-[12px] text-[#5A5A5E]' : 'text-[13px] text-[#8B8B8E]';
        var escapedTitle = (item.text || '').replace(/"/g, '&quot;');
        html += '      <button type="button" data-outline-target="' + item.id + '" onclick="window.BlogApp.scrollToHeading(&apos;' + item.id + '&apos;)" class="outline-nav-btn text-left w-full block ' + indent + ' hover:text-[#3B82F6] transition-colors truncate cursor-pointer bg-transparent border-none p-0 py-1 leading-relaxed" title="' + escapedTitle + '">' + item.text + '</button>';
      });
      html += '    </nav>';
      html += '  </div>';
      html += '</div>';
    }

    container.innerHTML = html;
  },

  // 5.3 专栏视图 (Series / Columns View)
  renderColumnsView: function() {
    var container = document.getElementById('app-main');
    var columns = window.BlogStore.getColumns() || [];

    var html = '<div class="max-w-[720px] mx-auto pt-16 md:pt-20 pb-20">';
    html += '  <header class="mb-8 pb-8 border-b border-white/[0.06]">';
    html += '    <h1 class="text-[36px] sm:text-[44px] md:text-[48px] font-bold text-[#EDEDED] tracking-[-0.02em] leading-[1.15] mb-4 font-sans">Series</h1>';
    html += '    <p class="text-[17px] text-[#8B8B8E] leading-relaxed max-w-[620px]">Curated technical collections and deep dives into computing fundamentals.</p>';
    html += '  </header>';

    if (columns.length === 0) {
      html += '<div class="py-24 text-center text-[#5A5A5E] font-mono text-[14px]">';
      html += '  <p class="mb-3 text-[#8B8B8E]">No series collections created yet.</p>';
      html += '  <p class="text-[12px]">Add Markdown posts to <code class="text-[#EDEDED] bg-white/[0.06] px-1.5 py-0.5 rounded">posts/columns/&lt;series-name&gt;/</code> to form a series automatically.</p>';
      html += '</div>';
    } else {
      html += '<div class="space-y-12">';
      columns.forEach(function(col, idx) {
        var num = idx + 1 < 10 ? '0' + (idx + 1) : (idx + 1);
        html += '<section class="border-b border-white/[0.06] pb-10 last:border-b-0">';
        html += '  <div class="flex items-center gap-2 text-[12px] font-mono text-[#5A5A5E] mb-2">';
        html += '    <span>SERIES ' + num + '</span>';
        html += '    <span>·</span>';
        html += '    <span>' + (col.postsCount || (col.posts || []).length) + ' Parts</span>';
        if (col.totalWords) {
          html += '    <span>·</span>';
          html += '    <span>' + Math.round(col.totalWords / 1000) + 'k words</span>';
        }
        html += '  </div>';

        html += '  <h2 class="text-[22px] font-semibold text-[#EDEDED] tracking-tight mb-2">' + col.name + '</h2>';
        if (col.desc) {
          html += '  <p class="text-[14px] text-[#8B8B8E] leading-relaxed mb-5 max-w-[640px]">' + col.desc + '</p>';
        }

        html += '  <div class="space-y-2 border-l border-white/[0.08] pl-4">';
        (col.posts || []).forEach(function(p) {
          var partNum = p.order < 10 ? '0' + p.order : p.order;
          html += '    <a href="#/post/' + p.id + '" class="group flex items-baseline gap-3 py-1 text-[14px] text-[#8B8B8E] hover:text-[#3B82F6] transition-colors">';
          html += '      <span class="font-mono text-[12px] text-[#5A5A5E] shrink-0">' + partNum + '</span>';
          html += '      <span class="font-sans group-hover:text-[#3B82F6] text-[#EDEDED] transition-colors">' + p.title + '</span>';
          html += '    </a>';
        });
        html += '  </div>';
        html += '</section>';
      });
      html += '</div>';
    }

    html += '</div>';
    container.innerHTML = html;
  },

  // 5.4 归档时间线视图 (Archives View)
  renderArchivesView: function() {
    var container = document.getElementById('app-main');
    var posts = window.BlogStore.getPosts();

    var yearMap = {};
    posts.forEach(function(p) {
      var yr = (p.date || '2026').slice(0, 4);
      if (!yearMap[yr]) yearMap[yr] = [];
      yearMap[yr].push(p);
    });

    var years = Object.keys(yearMap).sort().reverse();

    var html = '<div class="max-w-[720px] mx-auto pt-16 md:pt-20 pb-20">';
    html += '  <header class="mb-12 pb-6 border-b border-white/[0.06]">';
    html += '    <h1 class="text-[32px] font-bold text-[#EDEDED] tracking-[-0.02em] mb-2 font-sans">Archive</h1>';
    html += '    <p class="text-[16px] text-[#8B8B8E]">Chronological timeline of research essays, architecture notes, and publications.</p>';
    html += '  </header>';

    years.forEach(function(yr) {
      html += '<div class="mb-12">';
      html += '  <div class="font-mono text-[22px] font-bold text-[#5A5A5E] mb-4">' + yr + '</div>';
      html += '  <div class="space-y-3">';
      yearMap[yr].forEach(function(p) {
        var dateFormatted = (p.date || '').slice(5);
        html += '<a href="#/post/' + p.id + '" class="flex items-baseline gap-4 py-1.5 group">';
        html += '  <span class="font-mono text-[12.5px] text-[#5A5A5E] shrink-0">' + dateFormatted + '</span>';
        html += '  <span class="text-[15px] text-[#EDEDED] group-hover:text-[#3B82F6] transition-colors">' + p.title + '</span>';
        html += '</a>';
      });
      html += '  </div>';
      html += '</div>';
    });

    html += '</div>';
    container.innerHTML = html;
  },

  // 5.5 标签视图 (Tags View)
  renderTagsView: function() {
    var container = document.getElementById('app-main');
    var allTags = window.BlogStore.getAllTags();

    var html = '<div class="max-w-[720px] mx-auto pt-16 md:pt-20 pb-20">';
    html += '  <header class="mb-10 pb-6 border-b border-white/[0.06]">';
    html += '    <h1 class="text-[32px] font-bold text-[#EDEDED] tracking-[-0.02em] mb-2 font-sans">Tags</h1>';
    html += '    <p class="text-[16px] text-[#8B8B8E]">Curated topics and domain tags across computer science and mathematical physics.</p>';
    html += '  </header>';

    html += '  <div class="flex flex-wrap gap-2.5">';
    allTags.forEach(function(item) {
      var tagName = item.name || item;
      var count = item.count || 1;
      html += '    <a href="#/" onclick="window.BlogApp.setTag(decodeURIComponent(\'' + encodeURIComponent(tagName) + '\'))" class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.12] hover:border-[#3B82F6] hover:text-[#3B82F6] text-[#EDEDED] text-[13px] font-mono transition-all hover:-translate-y-[1px] bg-[#111113]">';
      html += '      <span>#' + tagName + '</span>';
      html += '      <span class="text-[11px] text-[#5A5A5E]">' + count + '</span>';
      html += '    </a>';
    });
    html += '  </div>';
    html += '</div>';

    container.innerHTML = html;
  },

    // 5.6 关于作者视图 (About View - 纯正 Linear / Vercel 极简科技风组件化呈现)
  renderAboutView: function() {
    var container = document.getElementById('app-main');
    var config = window.BlogStore.config || window.BlogConfig || {};
    var author = config.author || {};
    var social = config.social || [];
    var about = (window.BlogPostsData && window.BlogPostsData.about) || {};

    var statusText = about.status || author.title || 'Physics, Math & CS';
    var quoteText = about.quote || '';
    var bioText = about.bio || author.bio || '';
    var timeline = Array.isArray(about.timeline) ? about.timeline : [];
    var focusAreas = Array.isArray(about.focusAreas) ? about.focusAreas : [];
    var projects = Array.isArray(about.projects) ? about.projects : [];
    var notes = about.notes || '';

    var html = '<div class="max-w-[680px] mx-auto pt-16 md:pt-20 pb-24">';

    // 1. 顶部个人名片区 (Profile Hero)
    html += '<div class="about-hero-card">';
    if (author.avatar) {
      html += '  <div class="about-avatar-wrapper">';
      html += '    <img src="' + author.avatar + '" alt="' + (author.name || 'Author') + '" class="about-avatar-img">';
      html += '  </div>';
    }
    html += '  <div>';
    html += '    <h1 class="about-name">' + (author.name || 'Alex Chen') + '</h1>';
    html += '    <div class="about-meta-row">';
    html += '      <span>' + (author.title || 'Researcher & Engineer') + '</span>';
    if (author.location) {
      html += '      <span>·</span>';
      html += '      <span>' + author.location + '</span>';
    }
    html += '    </div>';
    if (statusText) {
      html += '    <div class="about-status-pill">';
      html += '      <span class="about-status-dot"></span>';
      html += '      <span>' + statusText + '</span>';
      html += '    </div>';
    }
    html += '  </div>';
    html += '</div>';

    // 2. 个人格言 (Quote Banner)
    if (quoteText) {
      html += '<div class="about-quote-box">“' + quoteText + '”</div>';
    }

    // 3. 个人简介 (Bio)
    if (bioText) {
      html += '<div class="about-bio-text">' + bioText + '</div>';
    }

    // 4. 经历与时间线 (Timeline & Milestones)
    if (timeline.length > 0) {
      html += '<section class="mb-14">';
      html += '  <div class="about-section-header">';
      html += '    <h2 class="about-section-title">Timeline & Milestones</h2>';
      html += '    <span class="about-section-badge">' + timeline.length + ' Milestones</span>';
      html += '  </div>';
      html += '  <div class="about-timeline-track">';
      timeline.forEach(function(item) {
        html += '<div class="about-timeline-item">';
        html += '  <div class="about-timeline-node"></div>';
        if (item.period) {
          html += '  <div class="about-timeline-period">' + item.period + '</div>';
        }
        if (item.title) {
          html += '  <h3 class="about-timeline-heading">' + item.title + '</h3>';
        }
        if (item.desc) {
          html += '  <p class="about-timeline-desc">' + item.desc + '</p>';
        }
        html += '</div>';
      });
      html += '  </div>';
      html += '</section>';
    }

    // 5. 核心关注领域 (Focus Areas)
    if (focusAreas.length > 0) {
      html += '<section class="mb-14">';
      html += '  <div class="about-section-header">';
      html += '    <h2 class="about-section-title">Focus Areas</h2>';
      html += '  </div>';
      html += '  <div class="about-focus-grid">';
      focusAreas.forEach(function(item) {
        html += '<div class="about-focus-card">';
        html += '  <div class="about-focus-title">' + item.title + '</div>';
        html += '  <p class="about-focus-desc">' + item.desc + '</p>';
        html += '</div>';
      });
      html += '  </div>';
      html += '</section>';
    }

    // 6. 精选项目 (Selected Projects)
    if (projects.length > 0) {
      html += '<section class="mb-14">';
      html += '  <div class="about-section-header">';
      html += '    <h2 class="about-section-title">Selected Projects</h2>';
      html += '  </div>';
      html += '  <div class="about-project-list">';
      projects.forEach(function(item) {
        var isLink = item.url && item.url !== '#';
        html += '<a href="' + (item.url || '#') + '" ' + (isLink ? 'target="_blank" rel="noopener noreferrer"' : '') + ' class="about-project-card group">';
        html += '  <div class="about-project-top">';
        html += '    <span class="about-project-name">' + item.name + '</span>';
        if (item.tag) {
          html += '    <span class="about-project-tag">' + item.tag + '</span>';
        }
        html += '  </div>';
        if (item.desc) {
          html += '  <p class="about-project-desc">' + item.desc + '</p>';
        }
        html += '</a>';
      });
      html += '  </div>';
      html += '</section>';
    }

    // 7. 附加自由 Markdown 内容 (如有)
    if (notes && notes.trim().length > 0) {
      var mdResult = window.BlogMarkdown.render(notes);
      html += '<section class="mb-14 border-t border-white/[0.06] pt-8">';
      html += '  <article class="markdown-body">' + mdResult.html + '</article>';
      html += '</section>';
    }

    // 8. 独占联系方式 (Connect & Contact)
    if (social && social.length > 0) {
      html += '<section class="pt-8 border-t border-white/[0.06]">';
      html += '  <div class="about-section-header">';
      html += '    <h2 class="about-section-title">Connect / Contact</h2>';
      html += '  </div>';
      html += '  <div class="about-contact-grid">';
      social.forEach(function(item) {
        var isExternal = item.url.indexOf('http') === 0;
        var iconName = item.icon || item.name.toLowerCase();
        var iconSvg = window.BlogIcons ? window.BlogIcons.get(iconName, 'w-4 h-4 text-current') : '';
        html += '<a href="' + item.url + '" ' + (isExternal ? 'target="_blank" rel="noopener noreferrer"' : '') + ' class="about-contact-card group">';
        html += '  <div class="about-contact-left">';
        if (iconSvg) {
          html += '    <div class="about-contact-icon">' + iconSvg + '</div>';
        }
        html += '    <span class="about-contact-name">' + item.name + '</span>';
        html += '  </div>';
        html += '  <span class="about-contact-arrow">↗</span>';
        html += '</a>';
      });
      html += '  </div>';
      html += '</section>';
    }

    html += '</div>';
    container.innerHTML = html;
  },

  // 5.7 在线 Markdown 创作器视图 (Editor View)
  renderEditorView: function() {
    var container = document.getElementById('app-main');
    var draft = window.BlogStore.getDraft() || { title: '', tags: '', content: '' };

    var html = '<div class="max-w-[720px] mx-auto pt-14 pb-20">';
    html += '  <div class="flex items-center justify-between pb-6 border-b border-white/[0.06] mb-8">';
    html += '    <h1 class="text-[24px] font-bold text-[#EDEDED]">Write Article</h1>';
    html += '    <button onclick="window.BlogApp.publishArticle()" class="linear-btn linear-btn-primary">Publish</button>';
    html += '  </div>';

    html += '  <div class="space-y-5">';
    html += '    <div>';
    html += '      <label class="block text-[12px] font-mono text-[#5A5A5E] mb-2">TITLE</label>';
    html += '      <input id="editor-title" type="text" value="' + (draft.title || '') + '" oninput="window.BlogApp.saveDraftDebounced()" placeholder="Article title..." class="w-full bg-[#111113] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-[15px] text-[#EDEDED] focus:border-[#3B82F6] focus:outline-none transition-colors">';
    html += '    </div>';

    html += '    <div>';
    html += '      <label class="block text-[12px] font-mono text-[#5A5A5E] mb-2">TAGS (Comma separated)</label>';
    html += '      <input id="editor-tags" type="text" value="' + (draft.tags || '') + '" oninput="window.BlogApp.saveDraftDebounced()" placeholder="Tech, Architecture, Algorithms..." class="w-full bg-[#111113] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-[14px] text-[#EDEDED] focus:border-[#3B82F6] focus:outline-none transition-colors">';
    html += '    </div>';

    html += '    <div>';
    html += '      <label class="block text-[12px] font-mono text-[#5A5A5E] mb-2">MARKDOWN CONTENT</label>';
    html += '      <textarea id="editor-content" rows="18" oninput="window.BlogApp.saveDraftDebounced()" placeholder="Write your thoughts in Markdown..." class="w-full bg-[#111113] border border-white/[0.08] rounded-lg p-4 text-[14px] font-mono text-[#EDEDED] focus:border-[#3B82F6] focus:outline-none transition-colors leading-relaxed">' + (draft.content || '') + '</textarea>';
    html += '    </div>';
    html += '  </div>';
    html += '</div>';

    container.innerHTML = html;
  },

  // ----------------------------------------------------------------------------
  // 6. 编辑器与本地发布逻辑
  // ----------------------------------------------------------------------------
  saveDraftDebounced: function() {
    clearTimeout(this._draftTimer);
    this._draftTimer = setTimeout(function() {
      var title = document.getElementById('editor-title').value;
      var tags = document.getElementById('editor-tags').value;
      var content = document.getElementById('editor-content').value;
      window.BlogStore.saveDraft({ title: title, tags: tags, content: content });
    }, 400);
  },

  publishArticle: function() {
    var title = (document.getElementById('editor-title').value || '').trim();
    var tagsRaw = (document.getElementById('editor-tags').value || '').trim();
    var content = (document.getElementById('editor-content').value || '').trim();

    if (!title) {
      alert('Please enter an article title.');
      return;
    }
    if (!content) {
      alert('Article content cannot be empty.');
      return;
    }

    var tags = tagsRaw ? tagsRaw.split(',').map(function(t) { return t.trim(); }).filter(Boolean) : ['general'];
    var newPost = window.BlogStore.addPost({
      title: title,
      tags: tags,
      content: content
    });

    window.BlogStore.clearDraft();
    window.location.hash = '#/post/' + newPost.id;
  },

  // ----------------------------------------------------------------------------
  // 7. 搜索弹窗逻辑 (Search Modal Cmd+K)
  // ----------------------------------------------------------------------------
  openSearchModal: function() {
    var modal = document.getElementById('search-modal');
    if (modal) {
      modal.classList.remove('hidden');
      var input = document.getElementById('search-modal-input');
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
    var resultsEl = document.getElementById('search-modal-results');
    if (!resultsEl) return;

    var posts = window.BlogStore.getPosts({ query: query });
    if (posts.length === 0) {
      resultsEl.innerHTML = '<div class="py-8 text-center text-[#5A5A5E] font-mono text-[13px]">No matching articles found.</div>';
      return;
    }

    var html = '';
    posts.slice(0, 8).forEach(function(p) {
      html += '<a href="#/post/' + p.id + '" onclick="window.BlogApp.closeSearchModal()" class="block p-2.5 rounded-[6px] hover:bg-white/[0.04] transition-colors group">';
      html += '  <div class="text-[14px] font-medium text-[#EDEDED] group-hover:text-[#3B82F6] transition-colors truncate">' + p.title + '</div>';
      html += '  <div class="text-[12px] font-mono text-[#5A5A5E] mt-0.5">' + p.date + ' · ' + (p.readTime || '3 min read') + '</div>';
      html += '</a>';
    });
    resultsEl.innerHTML = html;
  },

  // ----------------------------------------------------------------------------
  // 8. 标签过滤辅助
  // ----------------------------------------------------------------------------
  // ----------------------------------------------------------------------------
  // 5.8 统一通用动态栏目渲染器 (Zero-Code Dynamic Section View)
  // ----------------------------------------------------------------------------
  renderDynamicNavView: function(item) {
    var container = document.getElementById('app-main');
    var title = item.title || item.label || 'Section';
    var subtitle = item.subtitle || '';
    var posts = window.BlogStore.posts || [];
    var customPages = (window.BlogPostsData && window.BlogPostsData.customPages) || {};

    var html = '<div class="max-w-[720px] mx-auto pt-16 md:pt-20 pb-20">';

    // 统一页面头部 (严格遵循整站留白、字号与 1px 分割线规范)
    html += '<header class="mb-10 pb-6 border-b border-white/[0.06]">';
    html += '  <h1 class="text-[32px] sm:text-[36px] font-bold text-[#EDEDED] tracking-[-0.02em] leading-[1.15] mb-2 font-sans">' + title + '</h1>';
    if (subtitle) {
      html += '  <p class="text-[16px] text-[#8B8B8E] leading-relaxed max-w-[620px]">' + subtitle + '</p>';
    }
    html += '</header>';

    // 场景 A: 按分类或标签过滤博文流
    if (item.category || item.tag) {
      var filtered = posts.filter(function(p) {
        if (item.category && p.category === item.category) return true;
        if (item.tag && (p.tags || []).indexOf(item.tag) !== -1) return true;
        return false;
      });

      html += '<section class="divide-y divide-white/[0.06]">';
      if (filtered.length === 0) {
        html += '<div class="py-20 text-center text-[#5A5A5E] font-mono text-[14px]">';
        html += '  <p class="mb-2 text-[#8B8B8E]">No articles in this section yet.</p>';
        html += '  <p class="text-[12px]">Add Markdown posts with <code class="text-[#EDEDED] bg-white/[0.06] px-1.5 py-0.5 rounded">category: "' + (item.category || item.tag) + '"</code> in posts/ to show here.</p>';
        html += '</div>';
      } else {
        filtered.forEach(function(post) {
          html += '<article class="post-item group">';
          html += '  <div class="flex items-center gap-2 text-[12px] font-mono text-[#5A5A5E] mb-2">';
          html += '    <span>' + post.date + '</span>';
          if (post.readTime) html += '<span>·</span><span>' + post.readTime + '</span>';
          html += '  </div>';
          html += '  <h2 class="mb-2"><a href="#/post/' + post.id + '" class="post-item-title block leading-snug">' + post.title + '</a></h2>';
          if (post.excerpt) html += '  <p class="text-[14px] text-[#8B8B8E] leading-relaxed line-clamp-2 mb-3.5">' + post.excerpt + '</p>';
          if ((post.tags || []).length > 0) {
            html += '  <div class="flex flex-wrap items-center gap-2">';
            post.tags.forEach(function(t) {
              html += '    <a href="#/" onclick="window.BlogApp.setTag(decodeURIComponent(&apos;' + encodeURIComponent(t) + '&apos;))" class="tag-pill">#' + t + '</a>';
            });
            html += '  </div>';
          }
          html += '</article>';
        });
      }
      html += '</section>';

    // 场景 B: 卡片集合 (如 projects, tools, links)
    } else if (item.items && Array.isArray(item.items) && item.items.length > 0) {
      html += '<div class="space-y-3">';
      item.items.forEach(function(card) {
        var isLink = card.url && card.url !== '#';
        html += '<a href="' + (card.url || '#') + '" ' + (isLink ? 'target="_blank" rel="noopener noreferrer"' : '') + ' class="p-4 rounded-xl bg-[#111113] border border-white/[0.08] hover:border-white/[0.16] block transition-all hover:-translate-y-[2px] group">';
        html += '  <div class="flex items-center justify-between mb-1.5">';
        html += '    <h3 class="text-[15px] font-semibold text-[#EDEDED] group-hover:text-[#3B82F6] transition-colors font-sans">' + card.title + '</h3>';
        if (card.tag) html += '    <span class="text-[11px] font-mono text-[#5A5A5E] px-2 py-0.5 rounded bg-white/[0.04]">' + card.tag + '</span>';
        html += '  </div>';
        if (card.desc) html += '  <p class="text-[13.5px] leading-relaxed text-[#8B8B8E]">' + card.desc + '</p>';
        html += '</a>';
      });
      html += '</div>';

    // 场景 C: 独立 Markdown 文档渲染 (例如 projects.md 等)
    } else {
      var fileKey = item.file ? item.file.replace(/\.md$/i, '') : item.id;
      var mdContent = customPages[fileKey] || customPages[item.id] || '';

      if (mdContent) {
        var rendered = window.BlogMarkdown.render(mdContent);
        html += '<article class="markdown-body mb-12">';
        html += rendered.html;
        html += '</article>';
      } else {
        var targetFile = item.file || (item.id + '.md');
        html += '<div id="dynamic-md-container" class="py-12 text-[#8B8B8E]">';
        html += '  <div class="p-5 rounded-xl bg-[#111113] border border-white/[0.08]">';
        html += '    <div class="text-[14px] font-semibold text-[#EDEDED] mb-2 font-mono">Section Ready</div>';
        html += '    <p class="text-[13.5px] text-[#8B8B8E] mb-3">To populate this page, simply create <code class="text-[#3B82F6] font-mono px-1.5 py-0.5 bg-white/[0.06] rounded">' + targetFile + '</code> in your blog directory.</p>';
        html += '    <p class="text-[12px] text-[#5A5A5E] font-mono">Route: ' + (item.route || item.href) + '</p>';
        html += '  </div>';
        html += '</div>';

        // 异步尝试 fetch 目标 markdown 文件 (本地服务/Pages 支持)
        setTimeout(function() {
          if (window.fetch) {
            fetch(targetFile)
              .then(function(res) { return res.ok ? res.text() : null; })
              .then(function(text) {
                if (text) {
                  var dom = document.getElementById('dynamic-md-container');
                  if (dom) {
                    var renderedMd = window.BlogMarkdown.render(text);
                    dom.innerHTML = '<article class="markdown-body">' + renderedMd.html + '</article>';
                  }
                }
              })
              .catch(function() {});
          }
        }, 10);
      }
    }

    html += '</div>';
    container.innerHTML = html;
  },

    setTag: function(tag) {
    this.activeTag = tag;
    window.location.hash = '#/';
    this.renderHomeView();
  },

  clearTag: function() {
    this.activeTag = null;
    this.renderHomeView();
  }
};
