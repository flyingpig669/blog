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

  toggleMobileDrawer: function() { var d = document.getElementById('mobile-drawer'); if (d) d.classList.toggle('hidden'); },
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

    // 专栏统一多级路由: #/columns, #/columns/:colId, #/columns/:colId/:postSlug
    if (path.indexOf('/columns') === 0) {
      var colParts = path.replace(/^\/columns\/?/, '').split('/').filter(Boolean);
      this.setActiveNav('columns');
      if (colParts.length === 0) {
        this.currentRoute = { name: 'columns', params: {} };
        this.renderColumnsView();
      } else if (colParts.length === 1) {
        this.currentRoute = { name: 'column-detail', params: { colId: decodeURIComponent(colParts[0]) } };
        this.renderColumnsView(decodeURIComponent(colParts[0]));
      } else {
        var postSlug = colParts.slice(1).join('/');
        this.currentRoute = { name: 'post', params: { id: postSlug, column: decodeURIComponent(colParts[0]) } };
        this.renderPostView(postSlug);
      }
      return;
    }

    // 项目统一多级路由: #/projects, #/projects/:projId, #/projects/:projId/:postSlug
    if (path.indexOf('/projects') === 0) {
      var projParts = path.replace(/^\/projects\/?/, '').split('/').filter(Boolean);
      this.setActiveNav('projects');
      if (projParts.length === 0) {
        this.currentRoute = { name: 'projects', params: {} };
        this.renderProjectsView();
      } else if (projParts.length === 1) {
        this.currentRoute = { name: 'project-detail', params: { projId: decodeURIComponent(projParts[0]) } };
        this.renderProjectsView(decodeURIComponent(projParts[0]));
      } else {
        var postSlug = projParts.slice(1).join('/');
        this.currentRoute = { name: 'post', params: { id: postSlug, project: decodeURIComponent(projParts[0]) } };
        this.renderPostView(postSlug);
      }
      return;
    }

        // 标签分类多维检索路由: #/categories, #/tags, 支持 ?tag=xxx 或 /:tag 参数
    if (path.indexOf('/categories') === 0 || path.indexOf('/tags') === 0) {
      this.setActiveNav('categories');
      var tagParts = path.replace(/^\/(categories|tags)\/?/, '').split('/').filter(Boolean);
      var queryTag = null;
      if (hash.indexOf('?') !== -1) {
        var queryStr = hash.split('?')[1];
        var params = new URLSearchParams(queryStr);
        queryTag = params.get('tag');
      }
      var targetTag = tagParts.length > 0 ? decodeURIComponent(tagParts[0]) : (queryTag ? decodeURIComponent(queryTag) : null);
      if (targetTag) {
        this.selectedSortedTags = new Set([targetTag]);
      } else if (!queryTag && tagParts.length === 0 && hash.indexOf('?') === -1) {
        this.selectedSortedTags = new Set();
      }
      this.currentRoute = { name: 'tags', params: { tag: targetTag } };
      this.renderTagsView();
      return;
    }

    if (path === '/editor' || path === '/write') {
      window.location.hash = '#/';
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



    var html = '<div class="max-w-[720px] mx-auto">';

    // Hero Section
    html += '<section class="pt-10 md:pt-14 pb-8 border-b border-white/[0.06] mb-2">';
    html += '  <h1 class="text-[34px] sm:text-[38px] md:text-[42px] font-bold text-[#EDEDED] tracking-[-0.03em] leading-[1.15] mb-2.5 font-sans">';
    html += site.title || 'Aurora Notes';
    html += '  </h1>';
    html += '  <p class="text-[15px] sm:text-[16px] text-[#8B8B8E] leading-relaxed max-w-[620px]">';
    html += site.tagline || 'Curated technical writings, system architecture notes, and computing fundamentals.';
    html += '  </p>';

    html += '</section>';

    // Article List
    html += '<section class="divide-y divide-white/[0.06]">';
    if (posts.length === 0) {
      html += '<div class="py-24 text-center text-[#5A5A5E] font-mono text-[14px]">';
      html += '  <p class="mb-3 text-[#8B8B8E]">No articles found.</p>';
      html += '  <p class="text-[12px]">Add a Markdown file to <code class="text-[#EDEDED] bg-white/[0.06] px-1.5 py-0.5 rounded">posts/</code> to publish your first post.</p>';
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
        if (post.columnName || post.column) {
          var colTitle = post.columnName || post.column;
          var partText = post.order ? ('PART ' + (post.order < 10 ? '0' + post.order : post.order)) : 'SERIES';
          html += '    <span>·</span>';
          html += '    <a href="#/columns/' + encodeURIComponent(post.column) + '" class="px-1.5 py-0.2 rounded text-[10px] bg-[#3B82F6]/10 text-[#3B82F6] hover:bg-[#3B82F6]/20 transition-colors font-medium shrink-0 font-mono">' + partText + ' · ' + colTitle + '</a>';
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
            html += '    <a href="#/categories?tag=' + encodeURIComponent(tag) + '" class="tag-pill">#' + tag + '</a>';
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

  // 5.2 文章详情视图 (Post Detail View - 高信息密度排版与专栏内聚导航)
  renderPostView: function(postId) {
    var container = document.getElementById('app-main');
    var post = window.BlogStore.getPostById(postId);

    if (!post) {
      container.innerHTML = '<div class="py-24 text-center text-[#8B8B8E]"><h2 class="text-[20px] font-semibold text-[#EDEDED] mb-3 font-sans">Article Not Found</h2><a href="#/" class="text-[#3B82F6] text-[13px] font-mono hover:underline">← Back to home</a></div>';
      return;
    }

    window.BlogStore.incrementView(post.id);
    var mdResult = window.BlogMarkdown.render(post.content);
    var renderedHtml = mdResult.html;
    var toc = mdResult.toc || [];

    // 专栏内部上下一篇与章节解析
    var columnInfo = post.column ? window.BlogStore.getColumnById(post.column) : null;
    var colPosts = [];
    var prevPost = null;
    var nextPost = null;
    var prevLabel = '← PREVIOUS';
    var nextLabel = 'NEXT →';
    var colIndex = -1;

    if (columnInfo && Array.isArray(columnInfo.posts) && columnInfo.posts.length > 0) {
      // 专栏内部定向导航 (严格按章节 order 升序排布)
      colPosts = columnInfo.posts.slice().sort(function(a, b) {
        return (a.order || 999) - (b.order || 999);
      });
      colIndex = colPosts.findIndex(function(p) {
        return p.id === post.id || p.slug === post.slug;
      });
      if (colIndex !== -1) {
        prevPost = colIndex > 0 ? colPosts[colIndex - 1] : null;
        nextPost = colIndex < colPosts.length - 1 ? colPosts[colIndex + 1] : null;
        if (prevPost) {
          var pOrder = prevPost.order ? (prevPost.order < 10 ? '0' + prevPost.order : prevPost.order) : (colIndex);
          prevLabel = '← PART ' + pOrder;
        }
        if (nextPost) {
          var nOrder = nextPost.order ? (nextPost.order < 10 ? '0' + nextPost.order : nextPost.order) : (colIndex + 2);
          nextLabel = 'PART ' + nOrder + ' →';
        }
      }
    } else {
      // 普通独立博文：按全局发布列表获取前后相邻文章
      var allPosts = window.BlogStore.getPosts();
      var currentIndex = allPosts.findIndex(function(p) { return p.id === post.id; });
      prevPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
      nextPost = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;
    }

    var partNumber = post.order ? (post.order < 10 ? '0' + post.order : post.order) : '01';
    var totalParts = colPosts.length || (columnInfo ? columnInfo.postsCount : 1);

    // 双栏布局容器: 紧凑高信息密度版心 (pt-8 md:pt-10 pb-16)
    var html = '<div class="max-w-[1000px] mx-auto pt-8 md:pt-10 pb-16 flex justify-between items-start gap-6 lg:gap-10 relative">';

    // 左侧正文列: 自适应 680px 宽度
    html += '<div class="flex-1 max-w-[680px] min-w-0">';

    // 紧凑一体式面包屑导航
    html += '<nav class="mb-4 flex items-center gap-1.5 text-[12px] font-mono text-[#5A5A5E] overflow-x-auto no-scrollbar">';
    html += '  <a href="#/" class="text-[#8B8B8E] hover:text-[#3B82F6] transition-colors shrink-0">Writing</a>';
    if (columnInfo) {
      html += '  <span>/</span>';
      html += '  <a href="#/columns/' + encodeURIComponent(columnInfo.id) + '" class="text-[#8B8B8E] hover:text-[#3B82F6] transition-colors truncate max-w-[220px]" title="' + columnInfo.name.replace(/"/g, '&quot;') + '">' + columnInfo.name + '</a>';
      html += '  <span>/</span>';
      html += '  <span class="text-[#3B82F6] shrink-0 font-semibold">Part ' + partNumber + '</span>';
    } else {
      html += '  <span>/</span>';
      html += '  <span class="text-[#8B8B8E] shrink-0">Article</span>';
    }
    html += '</nav>';

    // 专栏系列横幅 (高信息密度紧凑型导引条)
    if (columnInfo) {
      html += '<div class="mb-5 py-2 px-3 rounded-[6px] bg-[#161618] border border-white/[0.08] flex items-center justify-between text-[12px] font-mono text-[#8B8B8E]">';
      html += '  <div class="flex items-center gap-2 min-w-0">';
      html += '    <span class="px-1.5 py-0.2 rounded bg-[#3B82F6]/15 text-[#3B82F6] text-[10.5px] font-semibold shrink-0">PART ' + partNumber + ' / ' + (totalParts < 10 ? '0' + totalParts : totalParts) + '</span>';
      html += '    <span class="text-[#EDEDED] font-sans truncate">' + columnInfo.name + '</span>';
      html += '  </div>';
      html += '  <a href="#/columns/' + encodeURIComponent(columnInfo.id) + '" class="text-[#8B8B8E] hover:text-[#3B82F6] transition-colors shrink-0 ml-3 text-[11px]">Series Index →</a>';
      html += '</div>';
    }

    // 项目系列横幅 (若属于某个项目)
    var projectInfo = post.project ? window.BlogStore.getProjectById(post.project) : null;
    if (projectInfo) {
      html += '<div class="mb-5 py-2 px-3 rounded-[6px] bg-[#161618] border border-white/[0.08] flex items-center justify-between text-[12px] font-mono text-[#8B8B8E]">';
      html += '  <div class="flex items-center gap-2 min-w-0">';
      html += '    <span class="px-1.5 py-0.2 rounded bg-[#22D3EE]/15 text-[#22D3EE] text-[10.5px] font-medium shrink-0">PROJECT</span>';
      html += '    <span class="text-[#EDEDED] font-sans truncate">' + projectInfo.name + '</span>';
      html += '  </div>';
      html += '  <a href="#/projects/' + encodeURIComponent(projectInfo.id) + '" class="text-[#8B8B8E] hover:text-[#3B82F6] transition-colors shrink-0 ml-3 text-[11px]">Project Index →</a>';
      html += '</div>';
    }

    // 文章头部 (标题紧凑沉稳，信息聚集)
    html += '<header class="mb-6 pb-4 border-b border-white/[0.06]">';
    html += '  <h1 class="text-[26px] sm:text-[30px] md:text-[32px] font-bold text-[#EDEDED] tracking-[-0.02em] leading-[1.25] mb-2.5 font-sans">' + post.title + '</h1>';
    
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
        html += '      <a href="#/categories?tag=' + encodeURIComponent(t) + '" class="text-[#8B8B8E] hover:text-[#3B82F6] transition-colors">#' + t + '</a>';
      });
      html += '    </div>';
    }
    html += '  </div>';
    html += '</header>';

    // Markdown 正文 (正文内部可能包含一处或多处 ::: slide 演示文稿)
    html += '<article class="markdown-body mb-12">';
    html += renderedHtml;
    html += '</article>';

    // 上一篇 / 下一篇导航 (专栏内严格按专栏章节排布，普通文章按时间流)
    html += '<div class="pt-6 border-t border-white/[0.06] space-y-3">';
    if (columnInfo && colPosts.length > 0) {
      var currentDisplayPart = colIndex !== -1 ? (colIndex + 1) : (post.order || 1);
      html += '<div class="flex items-center justify-between text-[11px] font-mono text-[#5A5A5E]">';
      html += '  <span class="text-[#3B82F6] font-medium">SERIES · Chapter ' + currentDisplayPart + ' of ' + colPosts.length + ' in ' + columnInfo.name + '</span>';
      html += '  <a href="#/columns/' + encodeURIComponent(columnInfo.id) + '" class="hover:text-[#3B82F6] transition-colors">All ' + colPosts.length + ' Chapters →</a>';
      html += '</div>';
    }
    html += '<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">';
    if (prevPost) {
      html += '<a href="#/post/' + (prevPost.slug || prevPost.id) + '" class="linear-card p-3.5 text-left group block">';
      html += '  <div class="text-[10px] font-mono text-[#5A5A5E] mb-1 flex items-center gap-1.5">';
      html += '    <span>' + prevLabel + '</span>';
      if (columnInfo) html += '<span class="text-[#3B82F6]">IN SERIES</span>';
      html += '  </div>';
      html += '  <div class="text-[13.5px] font-medium text-[#EDEDED] group-hover:text-[#3B82F6] transition-colors line-clamp-1">' + prevPost.title + '</div>';
      html += '</a>';
    } else {
      html += '<div class="linear-card p-3.5 text-left opacity-35 border-dashed border-white/[0.04]">';
      html += '  <div class="text-[10px] font-mono text-[#5A5A5E] mb-1">' + (columnInfo ? 'SERIES START' : 'FIRST ARTICLE') + '</div>';
      html += '  <div class="text-[12px] text-[#5A5A5E]">No earlier chapters.</div>';
      html += '</div>';
    }

    if (nextPost) {
      html += '<a href="#/post/' + (nextPost.slug || nextPost.id) + '" class="linear-card p-3.5 text-right group block">';
      html += '  <div class="text-[10px] font-mono text-[#5A5A5E] mb-1 flex items-center justify-end gap-1.5">';
      if (columnInfo) html += '<span class="text-[#3B82F6]">IN SERIES</span>';
      html += '    <span>' + nextLabel + '</span>';
      html += '  </div>';
      html += '  <div class="text-[13.5px] font-medium text-[#EDEDED] group-hover:text-[#3B82F6] transition-colors line-clamp-1">' + nextPost.title + '</div>';
      html += '</a>';
    } else {
      html += '<div class="linear-card p-3.5 text-right opacity-35 border-dashed border-white/[0.04]">';
      html += '  <div class="text-[10px] font-mono text-[#5A5A5E] mb-1">' + (columnInfo ? 'SERIES COMPLETED' : 'LATEST ARTICLE') + '</div>';
      html += '  <div class="text-[12px] text-[#5A5A5E]">Reached the final chapter.</div>';
      html += '</div>';
    }
    html += '</div>';
    html += '</div>';

    html += '</div>'; // 结束左侧列

    // 右侧列: 常驻悬浮 Outline 侧边栏 (屏幕宽度 >= 600px 自动展开)
    // 包含系列专栏全景章节 (如有) 与当前文章大纲，大幅提升信息密度
    var hasSidebar = (columnInfo && colPosts.length > 1) || toc.length > 0;
    if (hasSidebar) {
      html += '<aside class="outline-floating-sidebar toc-floating-sidebar w-[200px] lg:w-[230px] shrink-0 sticky top-20 font-mono text-[12px]">';
      
      // 如果属于专栏：呈现本专栏的完整章节速览
      if (columnInfo && colPosts.length > 1) {
        html += '<div class="mb-5 pb-4 border-b border-white/[0.06]">';
        html += '  <div class="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-[#3B82F6] font-semibold mb-2">';
        html += '    <span>Series Chapters</span>';
        html += '    <a href="#/columns/' + encodeURIComponent(columnInfo.id) + '" class="text-[#5A5A5E] hover:text-[#3B82F6] transition-colors">Index →</a>';
        html += '  </div>';
        html += '  <div class="space-y-1 max-h-[190px] overflow-y-auto no-scrollbar pr-1">';
        colPosts.forEach(function(cp, cidx) {
          var isCurrent = cp.id === post.id || cp.slug === post.slug;
          var cOrder = cp.order ? (cp.order < 10 ? '0' + cp.order : cp.order) : ('0' + (cidx + 1));
          var linkClass = isCurrent 
            ? 'bg-[#3B82F6]/10 text-[#3B82F6] font-medium border-l-2 border-[#3B82F6] pl-2 py-1' 
            : 'text-[#8B8B8E] hover:text-[#EDEDED] pl-2.5 py-1 border-l border-white/[0.06] hover:border-white/[0.2]';
          html += '  <a href="#/post/' + (cp.slug || cp.id) + '" class="flex items-baseline gap-2 text-[11.5px] transition-all block truncate ' + linkClass + '" title="' + cp.title.replace(/"/g, '&quot;') + '">';
          html += '    <span class="text-[10px] shrink-0 font-mono opacity-80">' + cOrder + '</span>';
          html += '    <span class="truncate">' + cp.title + '</span>';
          html += '  </a>';
        });
        html += '  </div>';
        html += '</div>';
      }

      // 本文内部大纲 (On this page)
      if (toc.length > 0) {
        html += '  <div class="text-[11px] font-mono uppercase tracking-wider text-[#5A5A5E] mb-2">On this page</div>';
        html += '  <nav id="desktop-outline-nav" class="space-y-0.5 border-l border-white/[0.08] pl-2.5 max-h-[calc(100vh-280px)] overflow-y-auto">';
        toc.forEach(function(item) {
          var indentClass = item.level === 3 ? 'pl-2 text-[11px] text-[#5A5A5E]' : 'text-[12px] text-[#8B8B8E]';
          var escapedTitle = (item.text || '').replace(/"/g, '&quot;');
          html += '  <div class="toc-item">';
          html += '    <button type="button" data-outline-target="' + item.id + '" data-target="' + item.id + '" data-level="' + item.level + '" onclick="window.BlogApp.scrollToHeading(&apos;' + item.id + '&apos;)" class="outline-nav-btn text-left w-full block ' + indentClass + ' hover:text-[#3B82F6] transition-colors truncate leading-relaxed cursor-pointer bg-transparent border-none p-0 py-0.5" title="' + escapedTitle + '">';
          html += item.text;
          html += '    </button>';
          html += '  </div>';
        });
        html += '  </nav>';
      }
      html += '</aside>';
    }

    html += '</div>'; // 结束外层双栏

    // 小屏浮动胶囊 (# Outline) 与侧滑抽屉 (< 600px)
    if (hasSidebar) {
      html += '<div class="outline-floating-fab toc-floating-fab">';
      html += '  <button type="button" onclick="window.BlogApp.toggleMobileOutline()" class="fixed right-5 bottom-20 z-40 px-3 py-2 rounded-full bg-[#111113]/90 backdrop-blur-md border border-white/[0.12] text-[12px] font-mono text-[#EDEDED] shadow-xl hover:border-[#3B82F6] flex items-center gap-1.5 cursor-pointer" title="Outline & Chapters">';
      html += '    <span class="text-[#3B82F6]">#</span>';
      html += '    <span>Outline</span>';
      html += '  </button>';
      html += '  <div id="mobile-outline-drawer" class="fixed inset-y-0 right-0 w-[280px] max-w-[85vw] bg-[#0A0A0B]/95 backdrop-blur-xl border-l border-white/[0.08] z-50 p-5 transform translate-x-full transition-transform duration-200 overflow-y-auto hidden">';
      html += '    <div class="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-3">';
      html += '      <span class="text-[12px] font-mono uppercase tracking-wider text-[#5A5A5E]">Outline & Chapters</span>';
      html += '      <button type="button" onclick="window.BlogApp.toggleMobileOutline()" class="text-[#8B8B8E] hover:text-[#EDEDED] text-[16px] cursor-pointer">✕</button>';
      html += '    </div>';

      if (columnInfo && colPosts.length > 1) {
        html += '<div class="mb-4 pb-3 border-b border-white/[0.06]">';
        html += '  <div class="text-[11px] font-mono text-[#3B82F6] mb-2 uppercase tracking-wider font-semibold">Series Chapters</div>';
        html += '  <div class="space-y-1 font-mono text-[12px]">';
        colPosts.forEach(function(cp, cidx) {
          var isCur = cp.id === post.id || cp.slug === post.slug;
          var ord = cp.order ? (cp.order < 10 ? '0' + cp.order : cp.order) : ('0' + (cidx + 1));
          html += '<a href="#/post/' + (cp.slug || cp.id) + '" onclick="window.BlogApp.toggleMobileOutline()" class="block py-1 truncate ' + (isCur ? 'text-[#3B82F6] font-semibold' : 'text-[#8B8B8E]') + '">';
          html += '  <span class="opacity-60 mr-1.5">' + ord + '</span>' + cp.title;
          html += '</a>';
        });
        html += '  </div>';
        html += '</div>';
      }

      if (toc.length > 0) {
        html += '    <div class="text-[11px] font-mono text-[#5A5A5E] mb-2 uppercase tracking-wider">Page Outline</div>';
        html += '    <nav class="space-y-1.5 font-mono text-[13px]">';
        toc.forEach(function(item) {
          var indent = item.level === 3 ? 'pl-2 text-[12px] text-[#5A5A5E]' : 'text-[12.5px] text-[#8B8B8E]';
          var escapedTitle = (item.text || '').replace(/"/g, '&quot;');
          html += '      <button type="button" data-outline-target="' + item.id + '" onclick="window.BlogApp.scrollToHeading(&apos;' + item.id + '&apos;)" class="outline-nav-btn text-left w-full block ' + indent + ' hover:text-[#3B82F6] transition-colors truncate cursor-pointer bg-transparent border-none p-0 py-0.5 leading-relaxed" title="' + escapedTitle + '">' + item.text + '</button>';
        });
        html += '    </nav>';
      }
      html += '  </div>';
      html += '</div>';
    }

    container.innerHTML = html;

    // 扫描并实例化正文内的所有演示文稿播放器 (支持单篇文章内出现多个 PDF / 幻灯片演示)
    var slideMounts = container.querySelectorAll('.article-slide-player-mount');
    if (slideMounts.length > 0 && window.BlogSlideViewer) {
      slideMounts.forEach(function(mountEl) {
        var url = mountEl.getAttribute('data-slide-url');
        var title = mountEl.getAttribute('data-slide-title') || post.title;
        if (url) {
          window.BlogSlideViewer.mount(mountEl, {
            url: url,
            title: title
          });
        }
      });
    }
  },

  // 5.3 专栏视图 (Series / Columns View)
  renderColumnsView: function(selectedColId) {
    var container = document.getElementById('app-main');
    var columns = window.BlogStore.getColumns() || [];

    var html = '<div class="max-w-[720px] mx-auto pt-16 md:pt-20 pb-20">';

    if (selectedColId) {
      var col = window.BlogStore.getColumnById(selectedColId);
      if (!col) {
        html += '<div class="py-24 text-center text-[#5A5A5E] font-mono text-[14px]">';
        html += '  <p class="mb-3 text-[#8B8B8E]">Series not found.</p>';
        html += '  <a href="#/columns" class="text-[#3B82F6] hover:underline">← Back to all series</a>';
        html += '</div></div>';
        container.innerHTML = html;
        return;
      }
      html += '<a href="#/columns" class="inline-flex items-center gap-1.5 text-[13px] font-mono text-[#8B8B8E] hover:text-[#3B82F6] transition-colors mb-6">← All Series</a>';
      html += '<header class="mb-8 pb-6 border-b border-white/[0.06]">';
      html += '  <div class="flex items-center gap-2 text-[12px] font-mono text-[#5A5A5E] mb-2">';
      html += '    <span>SERIES</span><span>·</span><span>' + (col.postsCount || (col.posts || []).length) + ' Parts</span>';
      html += '  </div>';
      html += '  <h1 class="text-[32px] sm:text-[36px] font-bold text-[#EDEDED] tracking-[-0.02em] leading-[1.15] mb-3 font-sans">' + col.name + '</h1>';
      if (col.desc) html += '  <p class="text-[16px] text-[#8B8B8E] leading-relaxed">' + col.desc + '</p>';
      html += '</header>';

      html += '<div class="space-y-3 border-l border-white/[0.08] pl-5">';
      (col.posts || []).forEach(function(p) {
        var partNum = p.order < 10 ? '0' + p.order : p.order;
        html += '  <a href="#/columns/' + encodeURIComponent(col.id) + '/' + encodeURIComponent(p.slug || p.id) + '" class="group flex items-baseline gap-3 py-1.5 text-[14px] text-[#8B8B8E] hover:text-[#3B82F6] transition-colors">';
        html += '    <span class="font-mono text-[12px] text-[#5A5A5E] shrink-0">' + partNum + '</span>';
        html += '    <span class="font-sans group-hover:text-[#3B82F6] text-[#EDEDED] transition-colors">' + p.title + '</span>';
        if (p.slide) html += '<span class="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#3B82F6]/10 text-[#3B82F6]">SLIDE</span>';
        html += '  </a>';
      });
      html += '</div></div>';
      container.innerHTML = html;
      return;
    }

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

        html += '  <h2 class="text-[22px] font-semibold text-[#EDEDED] tracking-tight mb-2"><a href="#/columns/' + encodeURIComponent(col.id) + '" class="hover:text-[#3B82F6] transition-colors">' + col.name + '</a></h2>';
        if (col.desc) {
          html += '  <p class="text-[14px] text-[#8B8B8E] leading-relaxed mb-5 max-w-[640px]">' + col.desc + '</p>';
        }

        html += '  <div class="space-y-2 border-l border-white/[0.08] pl-4">';
        (col.posts || []).forEach(function(p) {
          var partNum = p.order < 10 ? '0' + p.order : p.order;
          html += '    <a href="#/columns/' + encodeURIComponent(col.id) + '/' + encodeURIComponent(p.slug || p.id) + '" class="group flex items-baseline gap-3 py-1 text-[14px] text-[#8B8B8E] hover:text-[#3B82F6] transition-colors">';
          html += '      <span class="font-mono text-[12px] text-[#5A5A5E] shrink-0">' + partNum + '</span>';
          html += '      <span class="font-sans group-hover:text-[#3B82F6] text-[#EDEDED] transition-colors">' + p.title + '</span>';
          if (p.slide) html += '  <span class="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#3B82F6]/10 text-[#3B82F6]">SLIDE</span>';
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

  // 5.3.1 项目视图 (Projects View - 与 Series / Columns 遵循完全相同架构)
  renderProjectsView: function(selectedProjId) {
    var container = document.getElementById('app-main');
    var projects = window.BlogStore.getProjects() || [];
    var customPages = (window.BlogPostsData && window.BlogPostsData.customPages) || {};
    var standaloneProjectsMd = customPages['projects'] || '';

    var html = '<div class="max-w-[720px] mx-auto pt-16 md:pt-20 pb-20">';

    if (selectedProjId) {
      var proj = window.BlogStore.getProjectById(selectedProjId);
      if (!proj) {
        html += '<div class="py-24 text-center text-[#5A5A5E] font-mono text-[14px]">';
        html += '  <p class="mb-3 text-[#8B8B8E]">Project not found.</p>';
        html += '  <a href="#/projects" class="text-[#3B82F6] hover:underline">← Back to all projects</a>';
        html += '</div></div>';
        container.innerHTML = html;
        return;
      }
      html += '<a href="#/projects" class="inline-flex items-center gap-1.5 text-[13px] font-mono text-[#8B8B8E] hover:text-[#3B82F6] transition-colors mb-6">← All Projects</a>';
      html += '<header class="mb-8 pb-6 border-b border-white/[0.06]">';
      html += '  <div class="flex items-center gap-2 text-[12px] font-mono text-[#5A5A5E] mb-2">';
      html += '    <span>PROJECT</span><span>·</span><span>' + (proj.postsCount || (proj.posts || []).length) + ' Documents</span>';
      html += '  </div>';
      html += '  <h1 class="text-[32px] sm:text-[36px] font-bold text-[#EDEDED] tracking-[-0.02em] leading-[1.15] mb-3 font-sans">' + proj.name + '</h1>';
      if (proj.desc) html += '  <p class="text-[16px] text-[#8B8B8E] leading-relaxed">' + proj.desc + '</p>';
      html += '</header>';

      html += '<div class="space-y-3 border-l border-white/[0.08] pl-5">';
      (proj.posts || []).forEach(function(p) {
        var partNum = p.order < 10 ? '0' + p.order : p.order;
        html += '  <a href="#/projects/' + encodeURIComponent(proj.id) + '/' + encodeURIComponent(p.slug || p.id) + '" class="group flex items-baseline gap-3 py-1.5 text-[14px] text-[#8B8B8E] hover:text-[#3B82F6] transition-colors">';
        html += '    <span class="font-mono text-[12px] text-[#5A5A5E] shrink-0">' + partNum + '</span>';
        html += '    <span class="font-sans group-hover:text-[#3B82F6] text-[#EDEDED] transition-colors">' + p.title + '</span>';
        if (p.slide) html += '<span class="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#3B82F6]/10 text-[#3B82F6]">SLIDE</span>';
        html += '  </a>';
      });
      html += '</div></div>';
      container.innerHTML = html;
      return;
    }

    // All Projects Overview
    html += '  <header class="mb-8 pb-8 border-b border-white/[0.06]">';
    html += '    <h1 class="text-[36px] sm:text-[44px] md:text-[48px] font-bold text-[#EDEDED] tracking-[-0.02em] leading-[1.15] mb-4 font-sans">Projects</h1>';
    html += '    <p class="text-[17px] text-[#8B8B8E] leading-relaxed max-w-[620px]">Selected engineering systems, open-source architectures, and interactive prototypes.</p>';
    html += '  </header>';

    if (projects.length === 0 && !standaloneProjectsMd) {
      html += '<div class="py-24 text-center text-[#5A5A5E] font-mono text-[14px]">';
      html += '  <p class="mb-3 text-[#8B8B8E]">No project collections created yet.</p>';
      html += '  <p class="text-[12px]">Add Markdown posts to <code class="text-[#EDEDED] bg-white/[0.06] px-1.5 py-0.5 rounded">posts/projects/&lt;project-name&gt;/</code> to form a project showcase automatically.</p>';
      html += '</div>';
    } else {
      if (projects.length > 0) {
        html += '<div class="space-y-12 mb-16">';
        projects.forEach(function(proj, idx) {
          var num = idx + 1 < 10 ? '0' + (idx + 1) : (idx + 1);
          html += '<section class="border-b border-white/[0.06] pb-10 last:border-b-0">';
          html += '  <div class="flex items-center gap-2 text-[12px] font-mono text-[#5A5A5E] mb-2">';
          html += '    <span>PROJECT ' + num + '</span>';
          html += '    <span>·</span>';
          html += '    <span>' + (proj.postsCount || (proj.posts || []).length) + ' Documents</span>';
          if (proj.totalWords) {
            html += '    <span>·</span>';
            html += '    <span>' + Math.round(proj.totalWords / 1000) + 'k words</span>';
          }
          html += '  </div>';

          html += '  <h2 class="text-[22px] font-semibold text-[#EDEDED] tracking-tight mb-2">';
          html += '    <a href="#/projects/' + encodeURIComponent(proj.id) + '" class="hover:text-[#3B82F6] transition-colors">' + proj.name + '</a>';
          html += '  </h2>';
          if (proj.desc) {
            html += '  <p class="text-[14px] text-[#8B8B8E] leading-relaxed mb-5 max-w-[640px]">' + proj.desc + '</p>';
          }

          html += '  <div class="space-y-2 border-l border-white/[0.08] pl-4">';
          (proj.posts || []).forEach(function(p) {
            var partNum = p.order < 10 ? '0' + p.order : p.order;
            html += '    <a href="#/projects/' + encodeURIComponent(proj.id) + '/' + encodeURIComponent(p.slug || p.id) + '" class="group flex items-baseline gap-3 py-1 text-[14px] text-[#8B8B8E] hover:text-[#3B82F6] transition-colors">';
            html += '      <span class="font-mono text-[12px] text-[#5A5A5E] shrink-0">' + partNum + '</span>';
            html += '      <span class="font-sans group-hover:text-[#3B82F6] text-[#EDEDED] transition-colors">' + p.title + '</span>';
            if (p.slide) html += '  <span class="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#3B82F6]/10 text-[#3B82F6]">SLIDE</span>';
            html += '    </a>';
          });
          html += '  </div>';
          html += '</section>';
        });
        html += '</div>';
      }

      if (standaloneProjectsMd) {
        var renderedProjMd = window.BlogMarkdown.render(standaloneProjectsMd);
        html += '<section class="pt-8 border-t border-white/[0.06]">';
        html += '  <article class="markdown-body mb-12">' + renderedProjMd.html + '</article>';
        html += '</section>';
      }
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
  // 5.5 标签多选检索视图 (Sorted / Categories View - 支持多选复合筛选)
  selectedSortedTags: new Set(),

  toggleSortedTag: function(tagName) {
    if (!this.selectedSortedTags) this.selectedSortedTags = new Set();
    if (this.selectedSortedTags.has(tagName)) {
      this.selectedSortedTags.delete(tagName);
    } else {
      this.selectedSortedTags.add(tagName);
    }
    this.renderTagsView();
  },

  clearSortedTags: function() {
    if (this.selectedSortedTags) this.selectedSortedTags.clear();
    if (window.location.hash.indexOf('?') !== -1) {
      window.location.hash = '#/categories';
      return;
    }
    this.renderTagsView();
  },

  renderTagsView: function() {
    var container = document.getElementById('app-main');
    var allTags = window.BlogStore.getAllTags() || [];
    var posts = window.BlogStore.getPosts() || [];
    var selected = this.selectedSortedTags || new Set();

    // 多选 Tag 复合交集筛选
    var selectedArr = Array.from(selected);
    var filteredPosts = posts;
    if (selectedArr.length > 0) {
      filteredPosts = posts.filter(function(p) {
        return selectedArr.every(function(t) {
          return p.tags && p.tags.indexOf(t) !== -1;
        });
      });
    }

    var html = '<div class="max-w-[720px] mx-auto pt-16 md:pt-20 pb-20">';
    html += '  <header class="mb-8 pb-6 border-b border-white/[0.06]">';
    html += '    <h1 class="text-[32px] sm:text-[36px] font-bold text-[#EDEDED] tracking-[-0.02em] mb-2 font-sans">Tags & Sorted Topics</h1>';
    html += '    <p class="text-[16px] text-[#8B8B8E]">Select single or multiple tags to filter articles with precise multi-dimensional intersection.</p>';
    html += '  </header>';

    // 可多选标签胶囊云
    html += '  <div class="mb-8">';
    html += '    <div class="flex items-center justify-between mb-3">';
    html += '      <span class="text-[12px] font-mono text-[#5A5A5E] uppercase tracking-wider">Available Tags (' + allTags.length + ')</span>';
    if (selected.size > 0) {
      html += '      <button type="button" onclick="window.BlogApp.clearSortedTags()" class="text-[12px] font-mono text-[#3B82F6] hover:underline cursor-pointer">Clear Selection (' + selected.size + ')</button>';
    }
    html += '    </div>';
    html += '    <div class="flex flex-wrap gap-2">';
    allTags.forEach(function(item) {
      var tagName = item.name || item;
      var count = item.count || 1;
      var isAct = selected.has(tagName);
      var enc = encodeURIComponent(tagName);
      html += '<button type="button" data-tag="' + enc + '" onclick="window.BlogApp.toggleSortedTag(decodeURIComponent(this.getAttribute(&quot;data-tag&quot;)))" class="tag-filter-pill ' + (isAct ? "active" : "") + '"><span class="font-mono">#' + tagName + '</span> <span class="opacity-60 text-[10px] font-mono">' + count + '</span></button>';
    });
    html += '    </div>';
    html += '  </div>';

    // 筛选结果列表
    html += '  <section class="pt-6 border-t border-white/[0.06]">';
    html += '    <div class="flex items-center justify-between mb-6">';
    html += '      <div class="text-[13px] font-mono text-[#8B8B8E]">';
    if (selected.size > 0) {
      html += '        <span>Matching <span class="text-[#3B82F6] font-semibold">' + filteredPosts.length + '</span> articles for: </span>';
      selectedArr.forEach(function(t) {
        html += '<span class="text-[#EDEDED] mr-1.5 font-medium">#' + t + '</span>';
      });
    } else {
      html += '        <span>All articles (' + posts.length + ') — click any tag above to combine filters</span>';
    }
    html += '      </div>';
    html += '    </div>';

    if (filteredPosts.length === 0) {
      html += '    <div class="py-16 text-center text-[#5A5A5E] font-mono text-[14px] bg-[#111113] rounded-xl border border-white/[0.08] p-8">';
      html += '      <p class="mb-2 text-[#8B8B8E]">No articles match all selected tags.</p>';
      html += '      <button type="button" onclick="window.BlogApp.clearSortedTags()" class="text-[12px] text-[#3B82F6] hover:underline cursor-pointer">Reset filters</button>';
      html += '    </div>';
    } else {
      html += '    <div class="divide-y divide-white/[0.06]">';
      filteredPosts.forEach(function(post) {
        html += '      <article class="post-item group">';
        html += '        <div class="flex items-center gap-2 text-[12px] font-mono text-[#5A5A5E] mb-2">';
        html += '          <span>' + post.date + '</span>';
        if (post.readTime) html += '<span>·</span><span>' + post.readTime + '</span>';
        if (post.columnName) html += '<span class="text-[#3B82F6]">' + post.columnName + '</span>';
        html += '        </div>';
        html += '        <h2 class="mb-2">';
        html += '          <a href="#/post/' + (post.slug || post.id) + '" class="post-item-title block leading-snug">' + post.title + '</a>';
        html += '        </h2>';
        if (post.excerpt) {
          html += '        <p class="text-[14px] text-[#8B8B8E] leading-relaxed line-clamp-2 mb-3.5">' + post.excerpt + '</p>';
        }
        if ((post.tags || []).length > 0) {
          html += '        <div class="flex flex-wrap items-center gap-1.5">';
          post.tags.forEach(function(t) {
            var isSel = selected.has(t);
          html += '<button type="button" data-tag="' + encodeURIComponent(t) + '" onclick="window.BlogApp.toggleSortedTag(decodeURIComponent(this.getAttribute(&quot;data-tag&quot;)))" class="text-[11px] font-mono px-2 py-0.5 rounded-full border transition-all ' + (isSel ? "border-[#3B82F6] text-[#3B82F6] bg-[#3B82F6]/10" : "border-white/[0.08] text-[#8B8B8E] hover:border-white/[0.16] hover:text-[#EDEDED]") + '">#' + t + '</button>';
          });
          html += '        </div>';
        }
        html += '      </article>';
      });
      html += '    </div>';
    }

    html += '  </section>';
    html += '</div>';

    container.innerHTML = html;
  },

        // 5.6 关于作者视图 (About View - 纯粹极简科技排版，绝无厚重色块大卡片)
  renderAboutView: function() {
    var container = document.getElementById('app-main');
    var config = window.BlogStore.config || window.BlogConfig || {};
    var author = window.BlogStore.author || config.author || {};
    var social = config.social || [];
    var about = (window.BlogPostsData && window.BlogPostsData.about) || {};

    var statusText = about.status || author.title || 'Physics, Math & CS';
    var quoteText = about.quote || '';
    var bioText = about.bio || author.bio || '';
    var timeline = Array.isArray(about.timeline) ? about.timeline : [];
    var focusAreas = Array.isArray(about.focusAreas) ? about.focusAreas : [];
    var projects = Array.isArray(about.projects) ? about.projects : [];
    var notes = about.notes || '';

    var html = '<div class="max-w-[640px] mx-auto pt-16 md:pt-20 pb-24">';

    // 1. 顶部个人名片区 (Profile Hero)
    html += '<div class="about-hero-card">';
    if (author.avatar) {
      html += '  <div class="about-avatar-wrapper">';
      html += '    <img src="' + author.avatar + '" alt="' + (author.name || 'Author') + '" class="about-avatar-img">';
      html += '  </div>';
    }
    html += '  <div>';
    html += '    <h1 class="about-name">' + (author.name || 'CCC') + '</h1>';
    html += '    <div class="about-meta-row">';
    html += '      <span>' + (author.title || 'Student') + '</span>';
    if (author.location) {
      html += '      <span>·</span>';
      html += '      <span>' + author.location + '</span>';
    }
    html += '    </div>';
    if (statusText) {
      html += '    <div class="about-status-pill">';
      html += '      <span class="about-status-dot-pulse"><span class="about-status-dot-ping"></span><span class="about-status-dot-core"></span></span>';
      html += '      <span>' + statusText + '</span>';
      html += '    </div>';
    }

    // 社交渠道与主页联系方式 (纯文字极简展示，无Logo，无边框，易于自由扩展)
    var contactLinks = (about.social && about.social.length > 0) ? about.social : ((about.contacts && about.contacts.length > 0) ? about.contacts : ((about.links && about.links.length > 0) ? about.links : (social || [])));
    if (contactLinks.length > 0) {
      html += '    <div class="about-contacts-row">';
      contactLinks.forEach(function(item) {
        var href = item.url || item.href || '#';
        var isExternal = href.indexOf('http') === 0;
        var label = item.name || item.title || item.label || 'Link';
        html += '      <a href="' + href + '" ' + (isExternal ? 'target="_blank" rel="noopener noreferrer"' : '') + ' class="about-contact-text-link group">';
        html += '        <span>' + label + '</span>';
        if (isExternal) {
          html += '        <span class="about-contact-arrow">↗</span>';
        }
        html += '      </a>';
      });
      html += '    </div>';
    }
    html += '  </div>';
    html += '</div>';

    // 2. 个人格言 (Quote Banner)
    if (quoteText) {
      html += '<div class="about-quote-box">“' + quoteText + '”</div>';
    }

    // 3. 个人简介段落 (Bio)
    if (bioText) {
      html += '<div class="about-bio-text">' + bioText + '</div>';
    }

    // 4. 经历与时间线 (Timeline & Milestones - Linear 极简发光导轨)
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

    // 5. 核心关注领域 (Focus Areas - 极简纯净条目，绝无厚重大色块网格)
    if (focusAreas.length > 0) {
      html += '<section class="mb-14">';
      html += '  <div class="about-section-header">';
      html += '    <h2 class="about-section-title">Focus Areas</h2>';
      html += '  </div>';
      html += '  <div class="space-y-4">';
      focusAreas.forEach(function(item) {
        html += '<div class="flex items-start gap-3 py-1">';
        html += '  <span class="text-[#3B82F6] font-mono text-[13px] mt-0.5 shrink-0">/</span>';
        html += '  <div>';
        html += '    <h3 class="text-[15px] font-semibold text-[#EDEDED] mb-1 font-sans">' + item.title + '</h3>';
        html += '    <p class="text-[13.5px] leading-relaxed text-[#8B8B8E] m-0">' + item.desc + '</p>';
        html += '  </div>';
        html += '</div>';
      });
      html += '  </div>';
      html += '</section>';
    }

    // 6. 精选项目 (Selected Projects - 极简行式条目，优雅轻盈)
    if (projects.length > 0) {
      html += '<section class="mb-14">';
      html += '  <div class="about-section-header">';
      html += '    <h2 class="about-section-title">Selected Projects</h2>';
      html += '  </div>';
      html += '  <div class="space-y-3">';
      projects.forEach(function(item) {
        var isLink = item.url && item.url !== '#';
        html += '<div class="py-2.5 border-b border-white/[0.04] last:border-b-0">';
        html += '  <div class="flex items-center justify-between mb-1">';
        if (isLink) {
          html += '    <a href="' + item.url + '" target="_blank" rel="noopener noreferrer" class="text-[15px] font-semibold text-[#EDEDED] hover:text-[#3B82F6] transition-colors inline-flex items-center gap-1.5 font-sans group">';
          html += '      <span>' + item.name + '</span>';
          html += '      <span class="text-[12px] font-mono text-[#5A5A5E] group-hover:text-[#3B82F6] transition-colors">↗</span>';
          html += '    </a>';
        } else {
          html += '    <span class="text-[15px] font-semibold text-[#EDEDED] font-sans">' + item.name + '</span>';
        }
        if (item.tag) {
          html += '    <span class="text-[11px] font-mono text-[#5A5A5E] px-2 py-0.5 rounded bg-white/[0.04]">' + item.tag + '</span>';
        }
        html += '  </div>';
        if (item.desc) {
          html += '  <p class="text-[13.5px] leading-relaxed text-[#8B8B8E] m-0">' + item.desc + '</p>';
        }
        html += '</div>';
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



    html += '</div>';
    container.innerHTML = html;
  },

  // ----------------------------------------------------------------------------
  // 6. 搜索弹窗逻辑 (Search Modal Cmd+K)
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
              html += '    <a href="#/categories?tag=' + encodeURIComponent(t) + '" class="tag-pill">#' + t + '</a>';
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

      goToTag: function(tag) {
    if (!tag) return;
    this.selectedSortedTags = new Set([tag]);
    window.location.hash = '#/categories?tag=' + encodeURIComponent(tag);
  },

  setTag: function(tag) {
    this.goToTag(tag);
  },

  clearTag: function() {
    this.clearSortedTags();
  }
};
