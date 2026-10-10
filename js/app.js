/**
 * ==============================================================================
 * Aurora Blog - 核心应用控制器 (Core Application & Modular Views)
 * ==============================================================================
 * 设计美学：Linear / Vercel / Raycast 冷静克制深色科技风。
 * 遵循 8px 间距系统，极细边框，充足呼吸感与留白。
 */

window.BlogApp = {
  currentRoute: { name: 'home', params: {} },

  // ----------------------------------------------------------------------------
  // 1. 初始化与全局 Chrome 渲染
  // ----------------------------------------------------------------------------
  init: function() {
    // 依赖健康检查：若核心数据/配置模块缺失（脚本加载失败），给出可读提示而非白屏
    if (!window.BlogConfig || !window.BlogStore || !window.BlogPostsData || !window.BlogHtml || !window.BlogSearch || !window.BlogScrollState || !window.BlogRouter || !window.BlogNavbar || !window.BlogFooter || !window.BlogPublications || !window.BlogPostItem || !window.DOMPurify || typeof window.BlogStore.init !== 'function') {
      this.renderFatalError('核心脚本 (blog.config.js / js/store.js) 未能加载，请刷新页面重试。');
      return;
    }
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    window.BlogScrollState.init();

    // 初始化数据层
    window.BlogStore.init();
    this.publications = window.BlogPublications.create({ store: window.BlogStore, config: window.BlogConfig, html: window.BlogHtml, formatLines: this.formatLines.bind(this), postHref: this.postHref.bind(this), tagHref: this.tagHref.bind(this) });
    window.BlogSearch.configure({ store: window.BlogStore, html: window.BlogHtml, postHref: this.postHref.bind(this) });

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

  // 辅助函数: 扁平化多级导航菜单 (展开数组折叠项与 items/children)
  // 为每个导航项预计算 _route（实际路由路径），供 handleRoute 匹配与高亮使用。
  ensureSlideViewer: function(callback) {
    var self = this;
    if (window.BlogSlideViewer) {
      callback();
      return;
    }
    if (!this._slideQueue) {
      this._slideQueue = [];
      var files = ['vendor/pdfjs/pdf.min.js', 'js/slide-viewer.js'];
      var loadNext = function(i) {
        if (i >= files.length) {
          var queue = self._slideQueue || [];
          self._slideQueue = null;
          queue.forEach(function(fn) {
            try { fn(); } catch (err) { console.error(err); }
          });
          return;
        }
        var script = document.createElement('script');
        script.src = files[i];
        script.onload = function() { loadNext(i + 1); };
        script.onerror = function() {
          var queue = self._slideQueue || [];
          self._slideQueue = null;
          script.remove();
          queue.forEach(function(fn) { fn(new Error('Unable to load ' + files[i])); });
        };
        document.head.appendChild(script);
      };
      loadNext(0);
    }
    this._slideQueue.push(callback);
  },

  // 安全的 Markdown 渲染：解析器脚本加载失败时降级为纯文本，避免整页崩溃
  safeMarkdown: function(markdownText, options) {
    if (window.BlogMarkdown && typeof window.BlogMarkdown.render === 'function') {
      return window.BlogMarkdown.render(markdownText, options);
    }
    var fallback = '<pre class="whitespace-pre-wrap text-[13.5px] leading-relaxed text-secondary m-0 font-mono">' +
      this.escapeHtml(String(markdownText == null ? '' : markdownText)) + '</pre>';
    return { html: fallback, toc: [] };
  },

  loadDocumentView: function(doc, render) {
    var self = this, revision = this.routeRevision;
    var savedScroll = history.state && history.state.auroraScroll;
    var container = document.getElementById('app-main');
    this.setDocumentTitle(doc.title);
    container.innerHTML = '<div class="shell mx-auto px-4 sm:px-6 pt-16 pb-20"><p class="view-status" role="status">Loading document…</p></div>';
    window.BlogStore.loadDocument(doc).then(function() {
      if (self.routeRevision !== revision) return;
      render();
      if (typeof savedScroll === 'number') history.replaceState(Object.assign({}, history.state, { auroraScroll: savedScroll }), '', window.location.href);
      self.restoreDocumentPosition();
    }).catch(function() {
      if (self.routeRevision !== revision) return;
      container.innerHTML = '<div class="shell mx-auto px-4 sm:px-6 pt-16 pb-20"><h1 class="text-[32px] text-primary font-bold mb-3">Document could not load</h1><p class="view-status">Check your connection and try again.</p><button type="button" class="btn-secondary" data-document-retry>Retry</button></div>';
      container.querySelector('[data-document-retry]').onclick = function() { self.loadDocumentView(doc, render); };
    });
  },

  restoreDocumentPosition: function() {
    var self = this, revision = this.routeRevision;
    var heading = new URLSearchParams(window.location.hash.split('?')[1] || '').get('heading');
    if (heading) requestAnimationFrame(function() { if (self.routeRevision === revision) self.scrollToHeading(heading); });
    else window.BlogScrollState.restore(function() { return self.routeRevision === revision; });
  },

  // 致命错误兜底视图：依赖缺失或初始化异常时避免空白页
  renderFatalError: function(message) {
    var container = document.getElementById('app-main');
    if (!container) return;
    container.innerHTML =
      '<div class="shell mx-auto px-4 sm:px-6 pt-20 pb-20 text-center">' +
      '<div class="text-[12px] font-mono text-muted mb-3">INITIALIZATION ERROR</div>' +
      '<h1 class="text-[26px] font-bold text-primary mb-3 font-sans">页面加载失败</h1>' +
      '<p class="text-[15px] text-secondary mb-6">' + this.escapeHtml(message) + '</p>' +
      '<button type="button" onclick="window.location.reload()" class="btn-primary inline-flex cursor-pointer">重新加载</button>' +
      '</div>';
  },

  routeHref: function(name, value) {
    var routes = this.getRoutes();
    var base = routes[name] || '/';
    if (value !== undefined && value !== null && value !== '') {
      base = base.replace(/\/$/, '') + '/' + encodeURIComponent(value);
    }
    return '#' + base;
  },

  postHref: function(post) {
    var slug = typeof post === 'string' ? post : (post.slug || post.id);
    return this.routeHref('posts', slug);
  },

  tagHref: function(tag) {
    return this.routeHref('tags', window.BlogStore.tagSlug(tag));
  },

  // 依据选中的标签集合生成 /tags 路由。多选以路径段串联（#/tags/a/b），
  // 排序后输出以保证同一组标签只有唯一 URL；空集合回落到 #/tags。
  tagsRouteHref: function(names) {
    var route = this.getRoutes().tags || '/tags';
    var arr = (names || []).filter(Boolean).map(function(name) { return window.BlogStore.tagSlug(name); }).sort();
    return '#' + route + (arr.length ? '/' + arr.map(encodeURIComponent).join('/') : '');
  },

  safeDecode: function(value) {
    try {
      return decodeURIComponent(value || '');
    } catch (e) {
      return value || '';
    }
  },

  // 站点绝对地址：用于 canonical / og:url。
  // 未配置 site.url 时退回「当前文档目录」，这样 GitHub Pages 子路径部署也能自洽。
  absoluteSiteUrl: function() {
    var cfg = (window.BlogStore && window.BlogStore.config) || window.BlogConfig || {};
    var base = String((cfg.site && cfg.site.url) || '').trim();
    if (base) return base.replace(/\/+$/, '') + '/';
    return window.location.origin + window.location.pathname;
  },

  setMetaContent: function(selector, value) {
    if (!value) return;
    var el = document.querySelector(selector);
    if (el) el.setAttribute('content', value);
  },

  setDocumentTitle: function(title) {
    var site = (window.BlogStore && window.BlogStore.site) || {};
    var siteTitle = site.title || 'Aurora Notes';
    var full = title && title !== siteTitle ? title + ' · ' + siteTitle : siteTitle;
    document.title = full;
    // Hash 路由下所有页面共享同一个物理 URL，故 og:url / canonical 始终指向站点根。
    var url = this.absoluteSiteUrl();
    this.setMetaContent('meta[property="og:title"]', full);
    this.setMetaContent('meta[name="twitter:title"]', full);
    this.setMetaContent('meta[property="og:url"]', url);
    // 分享图与站点根同源，写成绝对地址（部分抓取器不解析相对 og:image）。
    // 静态 HTML 里的 ./og-image.png 只是无 JS 时的兜底。
    this.setMetaContent('meta[property="og:image"]', url + 'og-image.png');
    this.setMetaContent('meta[name="twitter:image"]', url + 'og-image.png');
    var canonicalEl = document.getElementById('canonical-link');
    if (canonicalEl) canonicalEl.setAttribute('href', url);
  },

  // 渲染全局导航、页脚与品牌标识 (数据源自 blog.config.js)
  renderGlobalChrome: function() {
    window.BlogNavbar.render({ config: window.BlogConfig, escapeHtml: this.escapeHtml.bind(this), navItemHref: this.navItemHref.bind(this), routeHref: this.routeHref.bind(this), setDocumentTitle: this.setDocumentTitle.bind(this) });
    window.BlogFooter.render(window.BlogStore.site);
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
      var tagToggle = e.target.closest('[data-tag-toggle]');
      if (tagToggle) self.toggleSortedTag(tagToggle.getAttribute('data-tag-toggle'));
      if (e.target.closest('[data-mobile-nav]')) self.closeMobileDrawer();
      var sectionLink = e.target.closest('[data-copy-heading]');
      if (sectionLink) {
        var url = new URL(window.location.href);
        var hash = url.hash.slice(1).split('?');
        var params = new URLSearchParams(hash[1] || '');
        params.set('heading', sectionLink.getAttribute('data-copy-heading'));
        url.hash = hash[0] + '?' + params.toString();
        self.copyText(url.href, sectionLink);
      }
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

    // Delegated 导航下拉菜单开关：点击箭头展开/收起（兼顾触屏与键盘），点击外部自动收起
    document.addEventListener('click', function(e) {
      var toggle = e.target.closest('.nav-dropdown-toggle');
      if (toggle) {
        e.preventDefault();
        var dropdown = toggle.closest('.nav-dropdown');
        var opened = dropdown.classList.toggle('open');
        toggle.setAttribute('aria-expanded', opened ? 'true' : 'false');
        return;
      }
      if (!e.target.closest('.nav-dropdown')) {
        self.closeNavDropdowns();
      }
    });

    // Delegated 代码块一键复制处理器
    document.addEventListener('click', function(e) {
      var copyBtn = e.target.closest('.code-copy-btn');
      if (copyBtn) {
        var rawCode = decodeURIComponent(copyBtn.getAttribute('data-code') || '');
        self.copyText(rawCode, copyBtn);
      }
    });

    // 滚动事件监听器: 进度条 + Active Outline Scrollspy 高亮
    // 用 requestAnimationFrame 节流：scroll 事件触发频率远高于渲染帧，若在回调里直接
    // 做 querySelectorAll + getBoundingClientRect，长文滚动时会产生大量重复布局查询。
    var scrollTicking = false;
    window.addEventListener('scroll', function() {
      if (scrollTicking) return;
      scrollTicking = true;
      window.requestAnimationFrame(function() {
        scrollTicking = false;
        self.updateScrollUI();
      });
    }, { passive: true });
  },

  copyText: function(text, button) {
    var original = button.innerHTML;
    var task = navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject(new Error('Clipboard unavailable'));
    task.then(function() { button.textContent = 'Copied'; }).catch(function() { button.textContent = 'Copy unavailable'; }).finally(function() {
      setTimeout(function() { if (button.isConnected) button.innerHTML = original; }, 1800);
    });
  },

  // 滚动相关的 UI 更新（经 rAF 节流，每帧至多执行一次）
  updateScrollUI: function() {
    var features = (window.BlogStore.config && window.BlogStore.config.features) || {};

    // 1. 阅读进度条
    var progressBar = document.getElementById('reading-progress-bar');
    var container = document.getElementById('reading-progress-container');
    var total = document.documentElement.scrollHeight - window.innerHeight;
    if (progressBar && container) {
      if (features.readingProgress !== false && total > 200 && this.currentRoute.name === 'post') {
        container.classList.remove('hidden');
        var progress = Math.min(100, Math.max(0, (window.scrollY / total) * 100));
        progressBar.style.width = progress + '%';
      } else {
        container.classList.add('hidden');
      }
    }

    // 2. Active Outline Scrollspy (右侧悬浮目录高亮指示)
    if (this.currentRoute.name !== 'post') return;
    var headings = document.querySelectorAll('.markdown-body [id^="heading-"]');
    if (!headings || headings.length === 0) return;
    var currentId = '';
    headings.forEach(function(h) {
      if (h.getBoundingClientRect().top <= 120) currentId = h.id;
    });
    // 滚动至文档底部时激活最后一个标题
    if ((window.innerHeight + window.scrollY) >= (document.documentElement.scrollHeight - 60)) {
      currentId = headings[headings.length - 1].id;
    }
    if (!currentId) return;
    document.querySelectorAll('#desktop-outline-nav button, #desktop-toc-nav button, #mobile-outline-drawer button, #mobile-toc-drawer button').forEach(function(btn) {
      var t = btn.getAttribute('data-outline-target') || btn.getAttribute('data-target');
      btn.classList.toggle('active', t === currentId);
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

  toggleMobileDrawer: function() {
    var drawer = document.getElementById('mobile-drawer');
    var toggle = document.getElementById('mobile-nav-toggle');
    if (!drawer) return;
    drawer.classList.toggle('hidden');
    if (toggle) toggle.setAttribute('aria-expanded', drawer.classList.contains('hidden') ? 'false' : 'true');
  },

  closeMobileDrawer: function() {
    var drawer = document.getElementById('mobile-drawer');
    var toggle = document.getElementById('mobile-nav-toggle');
    if (drawer) drawer.classList.add('hidden');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  },

  // 收起所有桌面端下拉菜单（路由切换或点击外部时调用）
  closeNavDropdowns: function() {
    document.querySelectorAll('.nav-dropdown.open').forEach(function(dropdown) {
      dropdown.classList.remove('open');
      var toggle = dropdown.querySelector('.nav-dropdown-toggle');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
    });
  },

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
  renderDirView: function(dir, navItem) {
    var container = document.getElementById('app-main');
    var posts = window.BlogStore.getPostsByDir(dir) || [];
    var norm = String(dir || '').replace(/^\.\//, '').replace(/^\/+/, '').replace(/\/+$/, '');
    if (norm.indexOf('posts/') === 0) norm = norm.slice('posts/'.length);
    var title = (navItem && navItem.label) || norm.split('/').filter(Boolean).pop() || 'Notes';
    this.setDocumentTitle(title);

    var html = '<div class="shell mx-auto px-4 sm:px-6 pt-16 md:pt-20 pb-20">';
    html += '  <header class="mb-10 pb-6 border-b border-divider">';
    html += '    <h1 class="text-[32px] sm:text-[36px] font-bold text-primary tracking-[-0.02em] leading-[1.15] mb-2 font-sans">' + this.escapeHtml(title) + '</h1>';
    html += '    <p class="text-[16px] text-secondary leading-relaxed max-w-[620px]">' + posts.length + ' article' + (posts.length === 1 ? '' : 's') + ' under <code class="font-mono text-secondary">posts/' + this.escapeHtml(norm) + '/</code></p>';
    html += '  </header>';

    if (posts.length === 0) {
      html += '  <div class="py-24 text-center text-muted font-mono text-[14px]">';
      html += '    <p class="mb-3 text-secondary">No articles in this directory yet.</p>';
      html += '    <p class="text-[12px]">Add a Markdown file under <code class="text-primary bg-white/[0.06] px-1.5 py-0.5 rounded">posts/' + this.escapeHtml(norm) + '/</code> to list it here.</p>';
      html += '  </div>';
    } else {
      html += '  <section class="divide-y divide-white/[0.06]">';
      posts.forEach(function(post) { html += window.BlogApp.renderPostItem(post, null); });
      html += '  </section>';
    }
    html += '</div>';
    container.innerHTML = html;
  },

  setActiveNav: function(id) {
    document.querySelectorAll('[data-nav-link="' + id + '"]').forEach(function(link) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    });
  },

  renderNotFoundView: function(path) {
    var container = document.getElementById('app-main');
    this.setDocumentTitle('Page Not Found');
    container.innerHTML = '<div class="shell mx-auto px-4 sm:px-6 pt-20 pb-20 text-center">' +
      '<div class="text-[12px] font-mono text-muted mb-3">404 · ' + this.escapeHtml(path || '/') + '</div>' +
      '<h1 class="text-[32px] font-bold text-primary mb-3 font-sans">Page not found</h1>' +
      '<p class="text-[15px] text-secondary mb-6">The requested route does not exist or has moved.</p>' +
      '<a href="' + this.routeHref('home') + '" class="btn-primary inline-flex">Back to home</a>' +
      '</div>';
  },

  escapeHtml: function(value) {
    return window.BlogHtml.escapeHtml(value);
  },

  // 字词数的可读格式。本站中英混排，故用中性的「字词」而非 words。
  // 依据是 sync_posts.py 的 estimate_word_units()：英文按单词、CJK 按字符计。
  formatWordCount: function(n) {
    var num = Number(n) || 0;
    if (num >= 1000) return (Math.round(num / 100) / 10) + 'k 字词';
    return num + ' 字词';
  },

  // 结构化区块的文本字段（bio / quote / timeline[].desc / focusAreas[].desc）既可能是
  // 单个字符串，也可能是数组 —— FrontMatter 里写成 ["第一行", "第二行"] 时按行渲染，
  // 保留作者在配置里划分的行结构。两种形态都必须转义。
  formatLines: function(value) {
    if (Array.isArray(value)) {
      return value
        .map(function(line) { return window.BlogApp.escapeHtml(line); })
        .filter(function(line) { return line !== ''; })
        .join('<br>');
    }
    return window.BlogApp.escapeHtml(value);
  },

  // ---------------------------------------------------------------------------
  // 5.0.1 论著列表 (Publications) 与可展开条目 (Timeline / Focus Areas) 的公共工具
  // ---------------------------------------------------------------------------
  // FrontMatter 里 publications / timeline[].links 都写成普通 YAML，由 sync_posts.py
  // 解析成 JSON；这一层只负责把数据变成 DOM，不做任何二次格式化。

  // 论著链接的徽章文案。未登记的 key 一律大写直出，于是作者临时加一个
  // `dataset:` / `video:` 也能立即有徽章，不需要改代码。
  normalizeAuthors: function() { return this.publications.normalizeAuthors.apply(this.publications, arguments); },
  selfAuthorNames: function() { return this.publications.selfAuthorNames.apply(this.publications, arguments); },
  formatAuthors: function() { return this.publications.formatAuthors.apply(this.publications, arguments); },
  publicationYear: function() { return this.publications.publicationYear.apply(this.publications, arguments); },
  publicationCitations: function() { return this.publications.publicationCitations.apply(this.publications, arguments); },
  publicationLinks: function() { return this.publications.publicationLinks.apply(this.publications, arguments); },
  publicationLinkHref: function() { return this.publications.publicationLinkHref.apply(this.publications, arguments); },
  entryDetailText: function() { return this.publications.entryDetailText.apply(this.publications, arguments); },
  hasExpandableContent: function() { return this.publications.hasExpandableContent.apply(this.publications, arguments); },
  toggleHeadingHtml: function() { return this.publications.toggleHeadingHtml.apply(this.publications, arguments); },
  chipTextFromHref: function() { return this.publications.chipTextFromHref.apply(this.publications, arguments); },
  resolveTimelineLink: function() { return this.publications.resolveTimelineLink.apply(this.publications, arguments); },
  renderEntryPanel: function() { return this.publications.renderEntryPanel.apply(this.publications, arguments); },
  renderPublicationCard: function() { return this.publications.renderPublicationCard.apply(this.publications, arguments); },
  renderPublicationsSection: function() { return this.publications.renderPublicationsSection.apply(this.publications, arguments); },
  renderTimelineItem: function() { return this.publications.renderTimelineItem.apply(this.publications, arguments); },
  renderTimelineSection: function() { return this.publications.renderTimelineSection.apply(this.publications, arguments); },

  toggleExpandable: function(el, force) {
    var id = el.getAttribute('data-expand-target');
    var panel = id ? document.getElementById(id) : null;
    if (!panel) return;
    var open = typeof force === 'boolean' ? force : panel.hasAttribute('hidden');
    if (open) panel.removeAttribute('hidden');
    else panel.setAttribute('hidden', '');

    var scope = el.closest('.pub-card, .about-timeline-item, .about-focus-item') || panel.parentNode;
    if (scope && scope.classList && scope.classList.toggle) scope.classList.toggle('is-expanded', open);

    var triggers = scope && scope.querySelectorAll ? scope.querySelectorAll('[data-expand-target="' + id + '"]') : [];
    Array.prototype.forEach.call(triggers, function(node) {
      if (node.hasAttribute('aria-expanded')) node.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  },

  // 论著 PDF 预览：iframe 只在首次点击时创建，再次点击改为收起，
  // 这样「展开摘要」不会顺带把几 MB 的 PDF 一起拉下来。
  mountPaperPreview: function(btn) {
    var wrap = btn.closest('.pub-preview');
    if (!wrap) return;
    var slot = wrap.querySelector('.pub-preview-slot');
    if (!slot) return;
    var label = btn.querySelector('span');

    if (wrap.getAttribute('data-preview-state') === 'loaded') {
      var collapsed = slot.hasAttribute('hidden');
      if (collapsed) slot.removeAttribute('hidden');
      else slot.setAttribute('hidden', '');
      if (label) label.textContent = collapsed ? '收起预览' : '预览 PDF';
      return;
    }

    var src = window.BlogHtml.safeUrl(wrap.getAttribute('data-pdf-src'), true);
    if (!src) return;
    var frame = document.createElement('iframe');
    frame.className = 'pub-preview-frame';
    frame.loading = 'lazy';
    frame.setAttribute('title', '论文 PDF 预览');
    // PDF Open Parameters：按宽度自适应并隐藏侧栏，避免预览框里出现两套滚动条
    frame.src = src + (src.indexOf('#') === -1 ? '#' : '&') + 'view=FitH&navpanes=0&toolbar=1';
    slot.innerHTML = '';
    slot.appendChild(frame);
    wrap.setAttribute('data-preview-state', 'loaded');
    if (label) label.textContent = '收起预览';
  },

  // 时间线筹码「PAPER」的落点：滚动到对应论著卡片并展开
  jumpToPaper: function(seq) {
    var card = document.querySelector('.pub-card[data-pub-seq="' + String(seq) + '"]');
    if (!card) return;
    var trigger = card.querySelector('.pub-card-head[data-expand-target]');
    if (trigger) window.BlogApp.toggleExpandable(trigger, true);
    if (card.scrollIntoView) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    card.classList.add('is-highlighted');
    setTimeout(function() { card.classList.remove('is-highlighted'); }, 1600);
  },

  // 折叠交互全部走事件委托，因此 #app-main 的 innerHTML 被整体替换后无需重新绑定。
  bindExpandables: function(container) {
    var self = window.BlogApp;
    if (!container || container.getAttribute('data-expandables-bound') === '1') return;
    container.setAttribute('data-expandables-bound', '1');
    container.addEventListener('click', function(event) {
      var target = event.target;
      if (!target || !target.closest) return;

      // 关联论文筹码优先：点了它要滚动，而不是顺手把面板收起来
      var jump = target.closest('[data-pub-jump]');
      if (jump) {
        event.preventDefault();
        self.jumpToPaper(jump.getAttribute('data-pub-jump'));
        return;
      }
      // 其余链接（PDF / DOI / 外链）只做自己的事，不触发折叠
      if (target.closest('a, [data-copy-heading]')) return;

      var previewBtn = target.closest('[data-pub-preview]');
      if (previewBtn) {
        self.mountPaperPreview(previewBtn);
        return;
      }

      // 在条目里拖选文字时不要误触折叠
      var selection = window.getSelection && window.getSelection();
      if (selection && String(selection).trim().length > 0) return;

      var trigger = target.closest('[data-expand-target]');
      if (trigger) self.toggleExpandable(trigger);
    });
  },

  // 5.1 首页视图 (Home View)
  renderPostItem: function(post, selected) {
    return window.BlogPostItem.render(post, { escapeHtml: this.escapeHtml.bind(this), postHref: this.postHref.bind(this), tagHref: this.tagHref.bind(this), routeHref: this.routeHref.bind(this), selected: selected, showPinned: this.currentRoute.name === "home" });
  },

  renderHomeView: function() {
    var container = document.getElementById('app-main');
    var site = (window.BlogStore.config && window.BlogStore.config.site) || {};
    var posts = window.BlogStore.getPosts();

    this.setDocumentTitle(site.title);
    var html = '<div class="shell mx-auto px-4 sm:px-6">';

    // Hero Section
    html += '<section class="pt-10 md:pt-14 pb-8 border-b border-divider mb-2">';
    html += '  <h1 class="text-[34px] sm:text-[38px] md:text-[42px] font-bold text-primary tracking-[-0.03em] leading-[1.15] mb-2.5 font-sans">';
    html += this.escapeHtml(site.title || 'Aurora Notes');
    html += '  </h1>';
    html += '  <p class="text-[15px] sm:text-[16px] text-secondary leading-relaxed max-w-[620px]">';
    html += this.escapeHtml(site.tagline || 'Curated technical writings, system architecture notes, and computing fundamentals.');
    html += '  </p>';

    html += '</section>';

    // Article List
    html += '<section class="divide-y divide-white/[0.06]">';
    if (posts.length === 0) {
      html += '<div class="py-24 text-center text-muted font-mono text-[14px]">';
      html += '  <p class="mb-3 text-secondary">No articles found.</p>';
      html += '  <p class="text-[12px]">Add a Markdown file to <code class="text-primary bg-white/[0.06] px-1.5 py-0.5 rounded">posts/</code> to publish your first post.</p>';
      html += '</div>';
    } else {
      posts.forEach(function(post) { html += window.BlogApp.renderPostItem(post, null); });
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
      this.currentRoute = { name: 'not-found', params: { path: postId } };
      this.renderNotFoundView((this.getRoutes().posts || '/posts') + '/' + postId);
      return;
    }

    if (post.bodyUrl && !post._loaded) {
      var app = this;
      return this.loadDocumentView(post, function() { app.renderPostView(postId); });
    }

    this.setDocumentTitle(post.title);

    // 结构化独立页 (type: post / page) 直接交给单页渲染器，不走文章排版
    var isPage = post.type === 'post' || post.type === 'page' || post.layout === 'post' || post.layout === 'page';
    if (isPage) {
      this.renderPageView(post);
      return;
    }

    var features = (window.BlogStore.config && window.BlogStore.config.features) || {};
    var tocLevels = post.tocLevels !== null && post.tocLevels !== undefined ? post.tocLevels : features.tocLevels;
    var mdResult = this.safeMarkdown(post.content, { tocLevels: tocLevels, sourcePath: 'posts/' + post.relPath });
    var renderedHtml = mdResult.html;
    var toc = mdResult.toc || [];

    // 专栏内部上下一篇与章节解析
    var columnInfo = post.column ? window.BlogStore.getColumnById(post.column) : null;
    var colPosts = [];
    var prevPost = null;
    var nextPost = null;
    var prevLabel = '← PREVIOUS ARTICLE';
    var nextLabel = 'NEXT ARTICLE →';
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
      var allPosts = window.BlogStore.getPosts({ sort: 'date' }).reverse();
      var currentIndex = allPosts.findIndex(function(p) { return p.id === post.id; });
      prevPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
      nextPost = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;
    }

    var partNumber = post.order ? (post.order < 10 ? '0' + post.order : post.order) : '01';
    var totalParts = colPosts.length || (columnInfo ? columnInfo.postsCount : 1);

    // 双栏布局容器: 紧凑高信息密度版心 (pt-8 md:pt-10 pb-16)
    var html = '<div class="shell-detail mx-auto px-4 sm:px-6 pt-8 md:pt-10 pb-16 flex justify-between items-start gap-6 lg:gap-10 relative">';

    // 左侧正文列: 自适应 680px 宽度
    html += '<div class="flex-1 max-w-[680px] min-w-0">';

    // 紧凑一体式面包屑导航
    html += '<nav aria-label="Breadcrumb" class="mb-4 flex items-center gap-1.5 text-[12px] font-mono text-muted overflow-x-auto no-scrollbar">';
    html += '  <a href="' + this.routeHref('home') + '" class="text-secondary hover:text-accent transition-colors shrink-0">Writing</a>';
    if (columnInfo) {
      html += '  <span>/</span>';
      html += '  <a href="' + this.routeHref('columns', columnInfo.id) + '" class="text-secondary hover:text-accent transition-colors truncate max-w-[220px]" title="' + columnInfo.name.replace(/"/g, '&quot;') + '">' + window.BlogApp.escapeHtml(columnInfo.name) + '</a>';
      html += '  <span>/</span>';
      html += '  <span class="text-accent shrink-0 font-semibold">Part ' + partNumber + '</span>';
    } else {
      html += '  <span>/</span>';
      html += '  <span class="text-secondary shrink-0">Article</span>';
    }
    html += '</nav>';

    // 专栏系列横幅 (高信息密度紧凑型导引条)
    if (columnInfo) {
      html += '<div class="mb-5 py-2 px-3 rounded-[6px] bg-codebg border border-subtle flex items-center justify-between text-[12px] font-mono text-secondary">';
      html += '  <div class="flex items-center gap-2 min-w-0">';
      html += '    <span class="px-1.5 py-0.2 rounded bg-accent/15 text-accent text-[10.5px] font-semibold shrink-0">PART ' + partNumber + ' / ' + (totalParts < 10 ? '0' + totalParts : totalParts) + '</span>';
      html += '    <span class="text-primary font-sans truncate">' + window.BlogApp.escapeHtml(columnInfo.name) + '</span>';
      html += '  </div>';
      html += '  <a href="' + this.routeHref('columns', columnInfo.id) + '" class="text-secondary hover:text-accent transition-colors shrink-0 ml-3 text-[11px]">Series Index →</a>';
      html += '</div>';
    }

    // 文章头部
    html += '<header class="mb-6 pb-4 border-b border-divider">';
    html += '  <h1 class="text-[26px] sm:text-[30px] md:text-[32px] font-bold text-primary tracking-[-0.02em] leading-[1.25] mb-2.5 font-sans">' + window.BlogApp.escapeHtml(post.title) + '</h1>';
    // 文章元信息行: 日期 · 阅读时长 · 字数 · 标签
    html += '  <div class="flex flex-wrap items-center gap-2 text-[12px] font-mono text-muted">';
    html += '    <span>' + window.BlogApp.escapeHtml(post.date) + '</span>';
    html += '    <span>·</span>';
    html += '    <span>' + window.BlogApp.escapeHtml(post.readTime || '3 min read') + '</span>';
    if (post.words) {
      html += '    <span>·</span>';
      html += '    <span>' + this.formatWordCount(post.words) + '</span>';
    }
    if ((post.tags || []).length > 0) {
      html += '    <span>·</span>';
      html += '    <div class="inline-flex flex-wrap gap-1.5">';
      post.tags.forEach(function(t) {
        html += '      <a href="' + window.BlogApp.tagHref(t) + '" class="text-secondary hover:text-accent transition-colors">#' + window.BlogApp.escapeHtml(t) + '</a>';
      });
      html += '    </div>';
    }
    html += '  </div>';
    html += '</header>';

    // FrontMatter 声明的幻灯片（方式 B）：课件固定挂在页头之下、正文之上。
    // 规则（2026-10-11 调整）：FrontMatter 显式声明的 slide 永远在顶部挂载；正文若也
    // 内嵌了同一份 ::: slide，那个挂载点会在实例化阶段被剔除，同一份 PDF 不出现两个播放器。
    // 此前这里是「正文有 ::: slide 就整段跳过」—— 作者两处都写时 FrontMatter 被静默忽略，
    // 看起来像没生效。注意：FrontMatter 未写时 sync_posts.py 会从正文第一条 ::: slide 反向
    // 提取 slide 字段（slideExplicit=false），那种情况仍以正文书写位置为准，不挂顶。
    if (post.slide && (post.slideExplicit || renderedHtml.indexOf('article-slide-player-mount') === -1)) {
      html += '<div class="article-slide-player-mount my-8" data-slide-primary="1" data-slide-url="' + this.escapeHtml(post.slide) + '" data-slide-title="' + this.escapeHtml(post.title || '') + '"></div>';
    }

    // Markdown 正文 (正文内部可能包含一处或多处 ::: slide 演示文稿)
    html += '<article class="markdown-body mb-12">';
    html += renderedHtml;
    html += '</article>';

    // FrontMatter 声明的下载类附件 (attachments: ["attachments/xxx.zip"])
    if (Array.isArray(post.attachments) && post.attachments.length > 0) {
      html += '<section class="mb-12 py-4 px-4 rounded-[6px] bg-surface border border-subtle">';
      html += '  <div class="text-[11px] font-mono uppercase tracking-wider text-muted mb-3">Attachments (' + post.attachments.length + ')</div>';
      html += '  <div class="space-y-2">';
      post.attachments.forEach(function(file) {
        var fileName = String(file).split('/').pop();
        html += '    <a href="' + window.BlogApp.escapeHtml(file) + '" download class="flex items-center gap-2 text-[13.5px] text-secondary hover:text-accent transition-colors">';
        html += '      <span class="text-accent font-mono text-[11px] shrink-0">&darr;</span>';
        html += '      <span class="truncate">' + window.BlogApp.escapeHtml(fileName) + '</span>';
        html += '    </a>';
      });
      html += '  </div>';
      html += '</section>';
    }

    // 上一篇 / 下一篇导航（专栏内为章节导航，普通文章为相邻文章）
    html += '<div class="pt-6 border-t border-divider space-y-3">';
    if (columnInfo && colPosts.length > 0) {
      var currentDisplayPart = colIndex !== -1 ? (colIndex + 1) : (post.order || 1);
      html += '<div class="flex items-center justify-between text-[11px] font-mono text-muted">';
      html += '  <span class="text-accent font-medium">SERIES · Chapter ' + currentDisplayPart + ' of ' + colPosts.length + ' in ' + window.BlogApp.escapeHtml(columnInfo.name) + '</span>';
      html += '  <a href="' + this.routeHref('columns', columnInfo.id) + '" class="hover:text-accent transition-colors">All ' + colPosts.length + ' Chapters →</a>';
      html += '</div>';
    }
    html += '<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">';
    if (prevPost) {
      html += '<a href="' + this.postHref(prevPost) + '" class="linear-card p-3.5 text-left group block">';
      html += '  <div class="text-[10px] font-mono text-muted mb-1 flex items-center gap-1.5">';
      html += '    <span>' + prevLabel + '</span>';
      if (columnInfo) html += '<span class="text-accent">IN SERIES</span>';
      html += '  </div>';
      html += '  <div class="text-[13.5px] font-medium text-primary group-hover:text-accent transition-colors line-clamp-1">' + window.BlogApp.escapeHtml(prevPost.title) + '</div>';
      html += '</a>';
    } else {
      html += '<div class="linear-card p-3.5 text-left opacity-35 border-dashed border-white/[0.04]">';
      html += '  <div class="text-[10px] font-mono text-muted mb-1">' + (columnInfo ? 'SERIES START' : 'FIRST ARTICLE') + '</div>';
      html += '  <div class="text-[12px] text-muted">No earlier chapters.</div>';
      html += '</div>';
    }

    if (nextPost) {
      html += '<a href="' + this.postHref(nextPost) + '" class="linear-card p-3.5 text-right group block">';
      html += '  <div class="text-[10px] font-mono text-muted mb-1 flex items-center justify-end gap-1.5">';
      if (columnInfo) html += '<span class="text-accent">IN SERIES</span>';
      html += '    <span>' + nextLabel + '</span>';
      html += '  </div>';
      html += '  <div class="text-[13.5px] font-medium text-primary group-hover:text-accent transition-colors line-clamp-1">' + window.BlogApp.escapeHtml(nextPost.title) + '</div>';
      html += '</a>';
    } else {
      html += '<div class="linear-card p-3.5 text-right opacity-35 border-dashed border-white/[0.04]">';
      html += '  <div class="text-[10px] font-mono text-muted mb-1">' + (columnInfo ? 'SERIES COMPLETED' : 'LATEST ARTICLE') + '</div>';
      html += '  <div class="text-[12px] text-muted">Reached the final chapter.</div>';
      html += '</div>';
    }
    html += '</div>';
    html += '</div>';

    html += '</div>'; // 结束左侧列

    // 右侧列: 常驻悬浮 Outline 侧边栏 (屏幕宽度 >= 600px 自动展开)
    // 包含系列专栏全景章节 (如有) 与当前文章大纲，大幅提升信息密度
    var hasSidebar = features.outlineSidebar !== false && ((columnInfo && colPosts.length > 1) || toc.length > 0);
    if (hasSidebar) {
      html += '<aside class="outline-floating-sidebar toc-floating-sidebar w-[200px] lg:w-[230px] shrink-0 sticky top-20 font-mono text-[12px]">';
      
      // 如果属于专栏：呈现本专栏的完整章节速览
      if (columnInfo && colPosts.length > 1) {
        html += '<div class="mb-5 pb-4 border-b border-divider">';
        html += '  <div class="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-accent font-semibold mb-2">';
        html += '    <span>Series Chapters</span>';
        html += '    <a href="' + this.routeHref('columns', columnInfo.id) + '" class="text-muted hover:text-accent transition-colors">Index →</a>';
        html += '  </div>';
        html += '  <div class="space-y-1 max-h-[190px] overflow-y-auto no-scrollbar pr-1">';
        colPosts.forEach(function(cp, cidx) {
          var isCurrent = cp.id === post.id || cp.slug === post.slug;
          var cOrder = cp.order ? (cp.order < 10 ? '0' + cp.order : cp.order) : ('0' + (cidx + 1));
          var linkClass = isCurrent 
            ? 'bg-accent/10 text-accent font-medium border-l-2 border-accent pl-2 py-1'
            : 'text-secondary hover:text-primary pl-2.5 py-1 border-l border-divider hover:border-white/[0.2]';
          html += '  <a href="' + window.BlogApp.postHref(cp) + '" class="flex items-baseline gap-2 text-[11.5px] transition-all block truncate ' + linkClass + '" title="' + window.BlogApp.escapeHtml(cp.title) + '">';
          html += '    <span class="text-[10px] shrink-0 font-mono opacity-80">' + cOrder + '</span>';
          html += '    <span class="truncate">' + window.BlogApp.escapeHtml(cp.title) + '</span>';
          html += '  </a>';
        });
        html += '  </div>';
        html += '</div>';
      }

      // 本文内部大纲 (On this page)
      if (toc.length > 0) {
        html += '  <div class="text-[11px] font-mono uppercase tracking-wider text-muted mb-2">On this page</div>';
        html += '  <nav id="desktop-outline-nav" aria-label="On this page" class="space-y-0.5 border-l border-subtle pl-2.5 max-h-[calc(100vh-280px)] overflow-y-auto">';
        toc.forEach(function(item) {
          var indentClass = item.level === 3 ? 'pl-2 text-[11px] text-muted' : 'text-[12px] text-secondary';
          var escapedTitle = window.BlogApp.escapeHtml(item.text);
          html += '  <div class="toc-item">';
          html += '    <button type="button" data-outline-target="' + item.id + '" data-target="' + item.id + '" data-level="' + item.level + '" onclick="window.BlogApp.scrollToHeading(&apos;' + item.id + '&apos;)" class="outline-nav-btn text-left w-full block ' + indentClass + ' hover:text-accent transition-colors truncate leading-relaxed cursor-pointer bg-transparent border-none p-0 py-0.5" title="' + escapedTitle + '">';
          html += window.BlogApp.escapeHtml(item.text);
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
      html += '  <button type="button" onclick="window.BlogApp.toggleMobileOutline()" class="fixed right-5 bottom-20 z-40 px-3 py-2 rounded-full bg-surface/90 backdrop-blur-md border border-white/[0.12] text-[12px] font-mono text-primary shadow-xl hover:border-accent flex items-center gap-1.5 cursor-pointer" title="Outline & Chapters">';
      html += '    <span class="text-accent">#</span>';
      html += '    <span>Outline</span>';
      html += '  </button>';
      html += '  <div id="mobile-outline-drawer" class="fixed inset-y-0 right-0 w-[280px] max-w-[85vw] bg-page/95 backdrop-blur-xl border-l border-subtle z-50 p-5 transform translate-x-full transition-transform duration-200 overflow-y-auto hidden">';
      html += '    <div class="flex items-center justify-between pb-3 border-b border-divider mb-3">';
      html += '      <span class="text-[12px] font-mono uppercase tracking-wider text-muted">Outline & Chapters</span>';
      html += '      <button type="button" onclick="window.BlogApp.toggleMobileOutline()" class="text-secondary hover:text-primary text-[16px] cursor-pointer">✕</button>';
      html += '    </div>';

      if (columnInfo && colPosts.length > 1) {
        html += '<div class="mb-4 pb-3 border-b border-divider">';
        html += '  <div class="text-[11px] font-mono text-accent mb-2 uppercase tracking-wider font-semibold">Series Chapters</div>';
        html += '  <div class="space-y-1 font-mono text-[12px]">';
        colPosts.forEach(function(cp, cidx) {
          var isCur = cp.id === post.id || cp.slug === post.slug;
          var ord = cp.order ? (cp.order < 10 ? '0' + cp.order : cp.order) : ('0' + (cidx + 1));
          html += '<a href="' + window.BlogApp.postHref(cp) + '" onclick="window.BlogApp.toggleMobileOutline()" class="block py-1 truncate ' + (isCur ? 'text-accent font-semibold' : 'text-secondary') + '">';
          html += '  <span class="opacity-60 mr-1.5">' + ord + '</span>' + window.BlogApp.escapeHtml(cp.title);
          html += '</a>';
        });
        html += '  </div>';
        html += '</div>';
      }

      if (toc.length > 0) {
        html += '    <div class="text-[11px] font-mono text-muted mb-2 uppercase tracking-wider">Page Outline</div>';
        html += '    <nav aria-label="Page outline" class="space-y-1.5 font-mono text-[13px]">';
        toc.forEach(function(item) {
          var indent = item.level === 3 ? 'pl-2 text-[12px] text-muted' : 'text-[12.5px] text-secondary';
          var escapedTitle = window.BlogApp.escapeHtml(item.text);
          html += '      <button type="button" data-outline-target="' + item.id + '" onclick="window.BlogApp.scrollToHeading(&apos;' + item.id + '&apos;)" class="outline-nav-btn text-left w-full block ' + indent + ' hover:text-accent transition-colors truncate cursor-pointer bg-transparent border-none p-0 py-0.5 leading-relaxed" title="' + escapedTitle + '">' + window.BlogApp.escapeHtml(item.text) + '</button>';
        });
        html += '    </nav>';
      }
      html += '  </div>';
      html += '</div>';
    }

    container.innerHTML = html;

    // 扫描并实例化正文内的所有演示文稿播放器 (支持单篇文章内出现多个 PDF / 幻灯片演示)
    var slideMounts = container.querySelectorAll('.article-slide-player-mount');
    if (slideMounts.length > 0) {
      var self = this;
      var revision = this.routeRevision;
      var mountSlides = function(error) {
        if (self.routeRevision !== revision) return;
        slideMounts.forEach(function(mountEl) {
          if (!mountEl.isConnected) return;
          // FrontMatter 已在顶部挂载这份课件时，剔除正文里指向同一文件的挂载点
          // （连同占位与间距），同一份 PDF 不渲染两个播放器；其它课件不受影响。
          if (mountEl.getAttribute('data-slide-primary') !== '1' &&
              post.slideExplicit && post.slide &&
              mountEl.getAttribute('data-slide-url') === post.slide) {
            mountEl.remove();
            return;
          }
          if (error) {
            mountEl.innerHTML = '<p class="search-status">PDF viewer could not load. Check your connection.</p><button type="button" class="btn-secondary">Retry</button>';
            mountEl.querySelector('button').onclick = function() {
              mountEl.innerHTML = '<p class="search-status">Loading PDF viewer…</p>';
              self.ensureSlideViewer(mountSlides);
            };
            return;
          }
          var url = mountEl.getAttribute('data-slide-url');
          if (!url) return;
          window.BlogSlideViewer.mount(mountEl, {
            url: url,
            title: mountEl.getAttribute('data-slide-title') || post.title
          });
        });
      };
      slideMounts.forEach(function(el) { el.innerHTML = '<p class="search-status">Loading PDF viewer…</p>'; });
      this.ensureSlideViewer(mountSlides);
    }
  },

  // 5.3 专栏视图 (Series / Columns View)
  renderColumnsView: function(selectedColId) {
    var container = document.getElementById('app-main');
    var columns = window.BlogStore.getColumns() || [];

    // 列表页与详情页同为全站统一版心 .shell —— 全站只有文章详情页是 .shell-detail
    var html = '<div class="shell mx-auto px-4 sm:px-6 pt-16 md:pt-20 pb-20">';

    if (selectedColId) {
      var col = window.BlogStore.getColumnById(selectedColId);
      if (!col) {
        this.setDocumentTitle('Series Not Found');
        html += '<div class="py-24 text-center text-muted font-mono text-[14px]">';
        html += '  <p class="mb-3 text-secondary">Series not found.</p>';
        html += '  <a href="' + this.routeHref('columns') + '" class="text-accent hover:underline">← Back to all series</a>';
        html += '</div></div>';
        container.innerHTML = html;
        return;
      }
      this.setDocumentTitle(col.name);
      html += '<a href="' + this.routeHref('columns') + '" class="inline-flex items-center gap-1.5 text-[13px] font-mono text-secondary hover:text-accent transition-colors mb-6">← All Series</a>';
      html += '<header class="mb-8 pb-6 border-b border-divider">';
      html += '  <div class="flex items-center gap-2 text-[12px] font-mono text-muted mb-2">';
      var partCount = col.postsCount || (col.posts || []).length;
      html += '    <span>SERIES</span><span>·</span><span>' + partCount + (partCount === 1 ? ' Part' : ' Parts') + '</span>';
      html += '  </div>';
      html += '  <h1 class="text-[32px] sm:text-[36px] font-bold text-primary tracking-[-0.02em] leading-[1.15] mb-3 font-sans">' + window.BlogApp.escapeHtml(col.name) + '</h1>';
      if (col.desc) html += '  <p class="text-[16px] text-secondary leading-relaxed">' + window.BlogApp.escapeHtml(col.desc) + '</p>';
      html += '</header>';

      html += '<div class="space-y-3 border-l border-subtle pl-5">';
      (col.posts || []).forEach(function(p) {
        var partNum = p.order < 10 ? '0' + p.order : p.order;
      html += '  <a href="' + window.BlogApp.postHref(p) + '" class="group flex items-baseline gap-3 py-1.5 text-[14px] text-secondary hover:text-accent transition-colors">';
        html += '    <span class="font-mono text-[12px] text-muted shrink-0">' + partNum + '</span>';
        html += '    <span class="font-sans group-hover:text-accent text-primary transition-colors">' + window.BlogApp.escapeHtml(p.title) + '</span>';
        if (p.slide) html += '<span class="text-[10px] font-mono px-1.5 py-0.2 rounded bg-accent/10 text-accent">SLIDE</span>';
        html += '  </a>';
      });
      html += '</div></div>';
      container.innerHTML = html;
      return;
    }

    this.setDocumentTitle('Columns');
    html += '  <header class="mb-10 pb-6 border-b border-divider">';
    html += '    <h1 class="text-[32px] sm:text-[36px] font-bold text-primary tracking-[-0.02em] leading-[1.15] mb-2 font-sans">Columns</h1>';
    html += '    <p class="text-[16px] text-secondary leading-relaxed max-w-[620px]">Curated technical collections and deep dives into computing fundamentals.</p>';
    html += '  </header>';

    if (columns.length === 0) {
      html += '<div class="py-24 text-center text-muted font-mono text-[14px]">';
      html += '  <p class="mb-3 text-secondary">No series collections created yet.</p>';
      html += '  <p class="text-[12px]">Add Markdown posts to <code class="text-primary bg-white/[0.06] px-1.5 py-0.5 rounded">posts/columns/&lt;series-name&gt;/</code> to form a series automatically.</p>';
      html += '</div>';
    } else {
      // 每个专栏是一个条目，单栏堆叠：用「细线分隔」而非卡片 ——
      // Archive / Tags / Columns 三个列表页必须共用同一套线条语言，
      // 方框与圆角只留给可交互控件。
      html += '<div class="ruled-list">';
      columns.forEach(function(col, idx) {
        var num = idx + 1 < 10 ? '0' + (idx + 1) : (idx + 1);
        var parts = col.postsCount || (col.posts || []).length;
        html += '  <section class="series-item">';
        html += '    <div class="flex flex-wrap items-center gap-2 text-[12px] font-mono text-muted mb-2">';
        html += '      <span class="px-1.5 py-0.5 rounded bg-white/[0.04] border border-divider">SERIES ' + num + '</span>';
        html += '      <span>' + parts + (parts === 1 ? ' Part' : ' Parts') + '</span>';
        if (col.totalWords) {
          html += '      <span>·</span>';
          html += '      <span>' + window.BlogApp.formatWordCount(col.totalWords) + '</span>';
        }
        html += '    </div>';

        html += '    <h2 class="text-[22px] font-semibold text-primary tracking-tight mb-2"><a href="' + window.BlogApp.routeHref('columns', col.id) + '" class="hover:text-accent transition-colors">' + window.BlogApp.escapeHtml(col.name) + '</a></h2>';
        if (col.desc) {
          // line-clamp-2：描述长短不一会把条目撑成不等高，截断保证列表节奏一致
          html += '    <p class="text-[14px] text-secondary leading-relaxed mb-4 line-clamp-2">' + window.BlogApp.escapeHtml(col.desc) + '</p>';
        }

        html += '    <div class="space-y-2 border-l border-subtle pl-4">';
        (col.posts || []).forEach(function(p) {
          var partNum = p.order < 10 ? '0' + p.order : p.order;
          html += '      <a href="' + window.BlogApp.postHref(p) + '" class="group flex items-baseline gap-3 py-1 text-[14px] text-secondary hover:text-accent transition-colors">';
          html += '        <span class="font-mono text-[12px] text-muted shrink-0">' + partNum + '</span>';
          html += '        <span class="min-w-0 font-sans group-hover:text-accent text-primary transition-colors">' + window.BlogApp.escapeHtml(p.title) + '</span>';
          if (p.slide) html += '        <span class="text-[10px] font-mono px-1.5 py-0.2 rounded bg-accent/10 text-accent shrink-0">SLIDE</span>';
          html += '      </a>';
        });
        html += '    </div>';
        html += '  </section>';
      });
      html += '</div>';
    }

    html += '</div>';
    container.innerHTML = html;
  },

  // 5.4 归档时间线视图 (Archives View)
  renderArchivesView: function() {
    var container = document.getElementById('app-main');
    var posts = window.BlogStore.getPosts({ sort: 'date' });

    var yearMap = {};
    posts.forEach(function(p) {
      var yr = (p.date || '2026').slice(0, 4);
      if (!yearMap[yr]) yearMap[yr] = [];
      yearMap[yr].push(p);
    });

    var years = Object.keys(yearMap).sort().reverse();

    this.setDocumentTitle('Archive');
    var html = '<div class="shell mx-auto px-4 sm:px-6 pt-16 md:pt-20 pb-20">';
    // 归档页不使用任何横向分割线（页面头部、年份分组、条目行都不画线）：
    // 层次完全靠字号、等宽体与留白建立，与全站「细线」语言区分开，是本页既有的设计语言。
    html += '  <header class="mb-10">';
    html += '    <h1 class="text-[32px] sm:text-[36px] font-bold text-primary tracking-[-0.02em] leading-[1.15] mb-2 font-sans">Archive</h1>';
    html += '    <p class="text-[16px] text-secondary">Chronological timeline of research essays, architecture notes, and publications.</p>';
    html += '  </header>';

    years.forEach(function(yr) {
      html += '  <div class="mb-12">';
      html += '    <div class="font-mono text-[22px] font-bold text-muted mb-4">' + yr + '</div>';
      html += '    <div class="space-y-3">';
      yearMap[yr].forEach(function(p) {
        var dateFormatted = (p.date || '').slice(5);
        html += '      <a href="' + window.BlogApp.postHref(p) + '" class="flex items-baseline gap-4 py-1.5 group">';
        html += '        <span class="font-mono text-[12.5px] text-muted shrink-0">' + dateFormatted + '</span>';
        html += '        <span class="min-w-0 text-[15px] text-primary group-hover:text-accent transition-colors">' + window.BlogApp.escapeHtml(p.title) + '</span>';
        html += '      </a>';
      });
      html += '    </div>';
      html += '  </div>';
    });

    html += '</div>';
    container.innerHTML = html;
  },

  // 5.5 标签多选检索视图 (Sorted / Categories View - 支持多选复合筛选)
  selectedSortedTags: new Set(),

  // 把任意来源的标签名归一化为标签云中的规范写法（大小写不敏感）。
  // 未收录的标签名原样保留 —— 分享链接里的旧标签仍然可见「无匹配」状态，而不是被悄悄吞掉。
  normalizeTagNames: function(names) {
    var canonical = {};
    (window.BlogStore.getAllTags() || []).forEach(function(t) {
      canonical[String(t.name).toLowerCase()] = t.name;
      canonical[window.BlogStore.tagSlug(t.name)] = t.name;
    });
    var seen = {};
    return (names || []).filter(Boolean).map(function(name) {
      return canonical[String(name).toLowerCase()] || name;
    }).filter(function(name) {
      if (seen[name]) return false;
      seen[name] = true;
      return true;
    });
  },

  // 标签筛选的唯一写入口：先把选中集合写回 URL（URL 即状态），再由 handleRoute 统一渲染。
  // 这样「点胶囊 / 清空选择」都不会让地址栏与页面内容脱节（历史 bug：清空后刷新筛选复活）。
  applyTagSelection: function(names) {
    var list = this.normalizeTagNames(names).sort();
    var next = this.tagsRouteHref(list);
    this.selectedSortedTags = new Set(list);
    if (window.location.hash === next) {
      this.renderTagsView();
    } else {
      window.location.hash = next;
    }
  },

  toggleSortedTag: function(tagName) {
    var sel = new Set(this.selectedSortedTags || []);
    if (sel.has(tagName)) {
      sel.delete(tagName);
    } else {
      sel.add(tagName);
    }
    this.applyTagSelection(Array.from(sel));
  },

  clearSortedTags: function() {
    this.applyTagSelection([]);
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

    this.setDocumentTitle('Tags');
    var html = '<div class="shell mx-auto px-4 sm:px-6 pt-16 md:pt-20 pb-20">';
    html += '  <header class="mb-8 pb-6 border-b border-divider">';
    html += '    <h1 class="text-[32px] sm:text-[36px] font-bold text-primary tracking-[-0.02em] mb-2 font-sans">Tags & Sorted Topics</h1>';
    html += '    <p class="text-[16px] text-secondary">Select single or multiple tags to filter articles with precise multi-dimensional intersection.</p>';
    html += '  </header>';

    // 标签索引：紧凑胶囊云，换行排列（保留既有 UI，不做桌面端整行磁贴展开）
    html += '  <div class="mb-8">';
    html += '    <div class="flex items-center justify-between mb-3">';
    html += '      <span class="text-[12px] font-mono text-muted uppercase tracking-wider">Available Tags (' + allTags.length + ')</span>';
    if (selected.size > 0) {
      html += '      <button type="button" onclick="window.BlogApp.clearSortedTags()" class="text-[12px] font-mono text-accent hover:underline cursor-pointer">Clear Selection (' + selected.size + ')</button>';
    }
    html += '    </div>';
    html += '    <div class="tag-cloud">';
    allTags.forEach(function(item) {
      var tagName = item.name || item;
      var count = item.count || 1;
      var isAct = selected.has(tagName);
      var enc = encodeURIComponent(tagName);
      html += '<button type="button" data-tag="' + enc + '" onclick="window.BlogApp.toggleSortedTag(decodeURIComponent(this.getAttribute(&quot;data-tag&quot;)))" class="tag-tile' + (isAct ? ' is-active' : '') + '" aria-pressed="' + (isAct ? 'true' : 'false') + '"><span>#' + window.BlogApp.escapeHtml(tagName) + '</span><span class="opacity-60 text-[10px]">' + count + '</span></button>';
    });
    html += '    </div>';
    html += '  </div>';

    // 筛选结果列表：单栏堆叠，横向细线由 .post-item 自身的 border-bottom 提供
    html += '  <section class="pt-6 border-t border-divider">';
    html += '    <div class="flex items-center justify-between mb-4">';
    html += '      <div class="text-[13px] font-mono text-secondary">';
    if (selected.size > 0) {
      html += '        <span>Matching <span class="text-accent font-semibold">' + filteredPosts.length + '</span> articles for: </span>';
      selectedArr.forEach(function(t) {
        html += '<span class="text-primary mr-1.5 font-medium">#' + window.BlogApp.escapeHtml(t) + '</span>';
      });
    } else {
      html += '        <span>All articles (' + posts.length + ') — click any tag above to combine filters</span>';
    }
    html += '      </div>';
    html += '    </div>';

    if (filteredPosts.length === 0) {
      html += '    <div class="py-16 text-center text-muted font-mono text-[14px] border-y border-divider">';
      html += '      <p class="mb-2 text-secondary">No articles match all selected tags.</p>';
      html += '      <button type="button" onclick="window.BlogApp.clearSortedTags()" class="text-[12px] text-accent hover:underline cursor-pointer">Reset filters</button>';
      html += '    </div>';
    } else {
      html += '    <div class="ruled-list">';
      filteredPosts.forEach(function(post) { html += window.BlogApp.renderPostItem(post, selected); });
      html += '    </div>';
    }

    html += '  </section>';
    html += '</div>';

    container.innerHTML = html;
  },

  // 5.6 独立高级单页渲染器 (Page View - 结构化独立页 type: post，支持时间线、关注领域与富文本)
  renderPageView: function(source, navItem) {
    var container = document.getElementById('app-main');
    var pageData = null;

    if (typeof source === 'object' && source !== null) {
      pageData = source;
    } else if (typeof source === 'string') {
      pageData = window.BlogStore.getPage(source);
    }
    // 导航项未直接给出数据对象时，回退到其 file: 目标
    if (!pageData && navItem) {
      var parsed = this.parseTarget(navItem);
      if (parsed.mode === 'file') {
        pageData = window.BlogStore.getPage(parsed.value);
      }
    }
    if (!pageData && (!source || source === 'about' || source === 'about.md')) {
      pageData = window.BlogStore.about;
    }

    if (!pageData) { this.renderNotFoundView(String(source || 'about')); return; }
    if (pageData.bodyUrl && !pageData._loaded) {
      var app = this;
      return this.loadDocumentView(pageData, function() { app.renderPageView(pageData, navItem); });
    }

    var title = pageData.title || (navItem ? navItem.label : 'Page');
    var statusText = pageData.status || '';
    var quoteText = pageData.quote || '';
    var bioText = pageData.bio || pageData.excerpt || '';
    var timeline = Array.isArray(pageData.timeline) ? pageData.timeline : [];
    var focusAreas = Array.isArray(pageData.focusAreas) ? pageData.focusAreas : [];
    var publications = Array.isArray(pageData.publications) ? pageData.publications : [];
    // timeline[].links 的 `paper:` 需要按 slug/标题回指本页的论著列表，
    // 故先建一份上下文，供 renderTimelineSection / renderEntryPanel 共用。
    var entryCtx = { publications: publications };
    var contacts = (pageData.social && pageData.social.length > 0) ? pageData.social : ((pageData.contacts && pageData.contacts.length > 0) ? pageData.contacts : (pageData.links || []));
    // `raw` is the complete source file (including front matter). Rendering it
    // here would duplicate the structured page data as visible YAML. Only the
    // parsed Markdown body belongs in the free-form content section.
    var rawMarkdown = pageData.content || pageData.notes || '';

    this.setDocumentTitle(title);
    var html = '<div class="shell mx-auto px-4 sm:px-6 pt-16 md:pt-20 pb-20">';

    // 1. 顶部 Hero / 名片区
    html += '<header class="mb-10 pb-6 border-b border-divider">';
    if (statusText) {
      html += '<div class="about-status-pill inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface border border-subtle text-[12px] font-mono text-secondary mb-3.5">';
      html += '  <span class="about-status-dot-pulse"><span class="about-status-dot-ping"></span><span class="about-status-dot-core"></span></span>';
      html += '  <span>' + window.BlogApp.escapeHtml(statusText) + '</span>';
      html += '</div>';
    }
    html += '<h1 class="text-[32px] sm:text-[36px] font-bold text-primary tracking-[-0.02em] leading-[1.15] mb-3 font-sans">' + window.BlogApp.escapeHtml(title) + '</h1>';
    if (bioText) {
      html += '<p class="text-[16px] text-secondary leading-relaxed max-w-[620px] mb-3">' + window.BlogApp.formatLines(bioText) + '</p>';
    }
    if (contacts.length > 0) {
      html += '<div class="about-contacts-row flex flex-wrap items-center gap-4 text-[13px] font-mono mt-3">';
      contacts.forEach(function(item) {
        var href = window.BlogHtml.safeUrl(item.url || item.href) || '#';
        var isExternal = href.indexOf('http') === 0;
        var rawLabel = item.name || item.title || item.label || 'Link';
        // 外链标签是行内文本，数组形态按空格拼接（不用 <br>，避免撑高链接行）
        var label = Array.isArray(rawLabel) ? rawLabel.join(' ') : rawLabel;
        html += '<a href="' + window.BlogApp.escapeHtml(href) + '" ' + (isExternal ? 'target="_blank" rel="noopener noreferrer"' : '') + ' class="about-contact-text-link group">';
        html += '  <span>' + window.BlogApp.escapeHtml(label) + '</span>';
        if (isExternal) html += '<span class="about-contact-arrow">↗</span>';
        html += '</a>';
      });
      html += '</div>';
    }
    html += '</header>';

    // 2. 引言格言 (Quote Box)
    var sections = [];
    if (publications.length) sections.push(['publications', 'Publications']);
    if (timeline.length) sections.push(['timeline', 'Timeline']);
    if (focusAreas.length) sections.push(['focus-areas', 'Focus Areas']);
    if (rawMarkdown && rawMarkdown.trim()) sections.push(['about-content', 'Notes']);
    if (sections.length > 1) {
      html += '<nav class="about-section-nav" aria-label="On this page">';
      sections.forEach(function(section) { html += '<button type="button" data-outline-target="' + section[0] + '">' + section[1] + '</button>'; });
      html += '</nav>';
    }
    if (quoteText) {
      html += '<div class="about-quote-box mb-10">“' + window.BlogApp.formatLines(quoteText) + '”</div>';
    }

    // 3. 论著与学术产出 (Publications - 按年份倒序分组，卡片可展开摘要与 PDF 预览)
    html += this.renderPublicationsSection(publications, pageData);

    // 4. 经历与时间线 (Timeline & Milestones - Linear 极简发光导轨，条目可展开)
    html += this.renderTimelineSection(timeline, entryCtx);

    // 5. 核心关注领域 / 特性亮点 (Focus Areas)
    if (focusAreas.length > 0) {
      html += '<section id="focus-areas" class="mb-14 scroll-mt-20">';
      html += '  <div class="about-section-header flex items-center justify-between pb-3 border-b border-divider mb-6">';
      html += '    <h2 class="text-[18px] font-semibold text-primary font-sans">Focus Areas</h2>';
      html += '  </div>';
      html += '  <div class="space-y-4">';
      focusAreas.forEach(function(item, index) {
        var panelId = 'fa-panel-' + index;
        var expandable = window.BlogApp.hasExpandableContent(item);
        html += '<div class="about-focus-item flex items-start gap-3 py-1' + (expandable ? ' is-expandable' : '') + '"'
          + (expandable ? ' data-expand-target="' + panelId + '"' : '') + '>';
        html += '  <span class="text-accent font-mono text-[13px] mt-0.5 shrink-0">/</span>';
        html += '  <div class="min-w-0 flex-1">';
        html += window.BlogApp.toggleHeadingHtml('h3', 'text-[15px] font-semibold text-primary mb-1 font-sans', window.BlogApp.formatLines(item.title), panelId, expandable);
        html += '    <p class="text-[13.5px] leading-relaxed text-secondary m-0">' + window.BlogApp.formatLines(item.desc) + '</p>';
        if (expandable) html += window.BlogApp.renderEntryPanel(item, panelId, entryCtx);
        html += '  </div>';
        html += '</div>';
      });
      html += '  </div>';
      html += '</section>';
    }

    // 6. 自由 Markdown 正文 (支持 KaTeX、Prism 代码高亮与 Callout 提示框)
    if (rawMarkdown && rawMarkdown.trim().length > 0) {
      var mdResult = this.safeMarkdown(rawMarkdown, { tocLevels: pageData.tocLevels, sourcePath: pageData.sourcePath });
      html += '<section id="about-content" class="mb-14 border-t border-divider pt-8 scroll-mt-20">';
      html += '  <article class="markdown-body">' + mdResult.html + '</article>';
      html += '</section>';
    }

    html += '</div>';
    container.innerHTML = html;

    // 折叠 / PDF 预览走事件委托，绑定一次即可覆盖后续所有重渲染
    this.bindExpandables(container);
  },

  // ----------------------------------------------------------------------------
  // 6. 搜索弹窗逻辑 (Search Modal Cmd+K)
  // ----------------------------------------------------------------------------
  openSearchModal: function() { window.BlogSearch.open(); },
  closeSearchModal: function() { window.BlogSearch.close(); },
  runModalSearchDebounced: function(query) { window.BlogSearch.debounce(query); },
  runModalSearch: function(query) { window.BlogSearch.search(query); },

  // ----------------------------------------------------------------------------
  // 5.8 统一通用动态栏目渲染器 (Zero-Code Dynamic Section View)
  // ----------------------------------------------------------------------------
  renderDynamicNavView: function(item) {
    var container = document.getElementById('app-main');
    var title = item.title || item.label || 'Section';
    var subtitle = item.subtitle || '';

    this.setDocumentTitle(title);
    var html = '<div class="shell mx-auto px-4 sm:px-6 pt-16 md:pt-20 pb-20">';

    // 统一页面头部 (严格遵循整站留白、字号与 1px 分割线规范)
    html += '<header class="mb-10 pb-6 border-b border-divider">';
    html += '  <h1 class="text-[32px] sm:text-[36px] font-bold text-primary tracking-[-0.02em] leading-[1.15] mb-2 font-sans">' + window.BlogApp.escapeHtml(title) + '</h1>';
    if (subtitle) {
      html += '  <p class="text-[16px] text-secondary leading-relaxed max-w-[620px]">' + window.BlogApp.escapeHtml(subtitle) + '</p>';
    }
    html += '</header>';

    // 场景 A: 按分类或标签过滤博文流
    if (item.category || item.tag) {
      var filtered = window.BlogStore.getPosts({ category: item.category, tag: item.tag });

      html += '<section class="divide-y divide-white/[0.06]">';
      if (filtered.length === 0) {
        html += '<div class="py-20 text-center text-muted font-mono text-[14px]">';
        html += '  <p class="mb-2 text-secondary">No articles in this section yet.</p>';
        html += '  <p class="text-[12px]">Add Markdown posts with <code class="text-primary bg-white/[0.06] px-1.5 py-0.5 rounded">category: "' + this.escapeHtml(item.category || item.tag) + '"</code> in posts/ to show here.</p>';
        html += '</div>';
      } else {
        filtered.forEach(function(post) { html += window.BlogApp.renderPostItem(post, null); });
      }
      html += '</section>';

    // 场景 B: 卡片集合 (如 tools, links 等声明式导航项)
    } else if (item.items && Array.isArray(item.items) && item.items.length > 0) {
      html += '<div class="space-y-3">';
      item.items.forEach(function(card) {
        var href = window.BlogHtml.safeUrl(card.url) || '#';
        var isLink = /^https?:/i.test(href);
        html += '<a href="' + window.BlogHtml.escapeHtml(href) + '" ' + (isLink ? 'target="_blank" rel="noopener noreferrer"' : '') + ' class="p-4 rounded-xl bg-surface border border-subtle hover:border-hover block transition-all hover:-translate-y-[2px] group">';
        html += '  <div class="flex items-center justify-between mb-1.5">';
        html += '    <h3 class="text-[15px] font-semibold text-primary group-hover:text-accent transition-colors font-sans">' + window.BlogApp.escapeHtml(card.title) + '</h3>';
        if (card.tag) html += '    <span class="text-[11px] font-mono text-muted px-2 py-0.5 rounded bg-white/[0.04]">' + window.BlogApp.escapeHtml(card.tag) + '</span>';
        html += '  </div>';
        if (card.desc) html += '  <p class="text-[13.5px] leading-relaxed text-secondary">' + window.BlogApp.escapeHtml(card.desc) + '</p>';
        html += '</a>';
      });
      html += '</div>';

    // 场景 C: 独立 Markdown 文档渲染 (例如 friends.md 等)
    } else {
      var targetDoc = window.BlogStore.getDoc(item.file || item.id);
      if (targetDoc.data) {
        this.renderFileTarget(item.file || item.id, item);
        return;
      } else {
        // 未在索引中找到对应 Markdown：给出明确的落地指引。
        // （历史实现在此处直接 fetch 裸文件路径，现已由 target: "file:xxx.md" 正式取代。）
        var targetFile = item.file || (item.id + '.md');
        html += '<div class="py-12 text-secondary">';
        html += '  <div class="p-5 rounded-xl bg-surface border border-subtle">';
        html += '    <div class="text-[14px] font-semibold text-primary mb-2 font-mono">Section ready</div>';
        html += '    <p class="text-[13.5px] text-secondary mb-3">把该导航项的 <code class="text-accent font-mono px-1.5 py-0.5 bg-white/[0.06] rounded">target</code> 指向一个 Markdown 文件（例如 <code class="font-mono">file:' + window.BlogApp.escapeHtml(targetFile) + '</code>）即可在此渲染。</p>';
        html += '    <p class="text-[12px] text-muted font-mono">Route: ' + window.BlogApp.escapeHtml(item.route || item.href || '') + '</p>';
        html += '  </div>';
        html += '</div>';
      }
    }

    html += '</div>';
    container.innerHTML = html;
  }
};

Object.assign(window.BlogApp, window.BlogRouter);
