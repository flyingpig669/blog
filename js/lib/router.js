// Methods consume a controller interface via this; no page or app imports.
window.BlogRouter = {
  getFlattenedNav: function() {
    var raw = (window.BlogStore.config && window.BlogStore.config.nav) || (window.BlogConfig && window.BlogConfig.nav) || [];
    var list = [];
    var self = this;
    raw.forEach(function(item) {
      if (Array.isArray(item)) {
        item.forEach(function(sub, idx) {
          var copy = Object.assign({}, sub);
          copy._parentGroup = item[0].id;
          copy._isFolded = idx > 0;
          copy._route = self.navItemRoute(copy);
          list.push(copy);
        });
      } else if (item && (item.items || item.children)) {
        var copyParent = Object.assign({}, item);
        copyParent._route = self.navItemRoute(copyParent);
        list.push(copyParent);
        var subs = item.items || item.children;
        if (Array.isArray(subs)) {
          subs.forEach(function(sub) {
            var copySub = Object.assign({}, sub);
            copySub._parentGroup = item.id;
            copySub._isFolded = true;
            copySub._route = self.navItemRoute(copySub);
            list.push(copySub);
          });
        }
      } else if (item) {
        var single = Object.assign({}, item);
        single._route = self.navItemRoute(single);
        list.push(single);
      }
    });
    return list;
  },

  getRoutes: function() {
    var config = (window.BlogStore && window.BlogStore.config) || window.BlogConfig || {};
    return config.routes || window.BlogRoutes || {};
  },

  // ---------------------------------------------------------------------------
  // 1.1 统一导航目标解析 (Unified Nav Target)
  // 导航项统一用 target 描述目标，三种模式：
  //   target: "/archive"        → route 模式：一个普通路由（默认路由）
  //   target: "dir:posts/群论"   → dir 模式：渲染该目录下的文章列表
  //   target: "file:about.md"   → file 模式：渲染该 Markdown 文档(普通文章或结构化独立页)
  // 单个对象 = 普通导航项；数组 = 下拉菜单（第一项常显，其余折叠）。
  // ---------------------------------------------------------------------------
  normalizePath: function(value) {
    var p = String(value == null ? '' : value).trim();
    if (p.indexOf('#') === 0) p = p.slice(1);
    if (p === '') p = '/';
    if (p.charAt(0) !== '/') p = '/' + p;
    return p;
  },

  parseTarget: function(item) {
    item = item || {};
    var t = item.target;
    if (t === undefined || t === null || String(t).trim() === '') {
      // 兼容旧字段 route / file / dir
      if (item.file) return { mode: 'file', value: String(item.file) };
      if (item.dir) return { mode: 'dir', value: String(item.dir) };
      if (item.route) return { mode: 'route', value: String(item.route) };
      return { mode: 'route', value: '/' };
    }
    t = String(t).trim();
    if (t.indexOf('file:') === 0) return { mode: 'file', value: t.slice(5).trim() };
    if (t.indexOf('dir:') === 0) return { mode: 'dir', value: t.slice(4).trim() };
    if (t.indexOf('route:') === 0) return { mode: 'route', value: t.slice(6).trim() };
    if (t.charAt(0) === '/') return { mode: 'route', value: t };
    // 非斜杠开头视为路由字典键 (如 "tags"、"columns")
    var routes = this.getRoutes();
    return { mode: 'route', value: routes[t] !== undefined ? routes[t] : ('/' + t) };
  },

  // 导航项对应的实际路由路径：file/dir 模式用 id 派生，显式 route 可覆盖
  navItemRoute: function(item) {
    item = item || {};
    var parsed = this.parseTarget(item);
    if (item.route) return this.normalizePath(item.route);
    if (parsed.mode === 'route') return this.normalizePath(parsed.value);
    return this.normalizePath(this.getRoutes()[item.id] || item.id || '/');
  },

  navItemHref: function(item) {
    item = item || {};
    var raw = item.href ? String(item.href) : '';
    if (raw) return window.BlogHtml.safeUrl(raw) || '#';
    return '#' + this.navItemRoute(item);
  },

  // 幻灯片依赖（PDF.js + slide-viewer.js）合计约 1.3MB，却只被含幻灯片的文章用到，
  // 因此不参与首屏加载：真正需要时按序注入脚本，加载完成后回调。
  handleRoute: function() {
    var self = this;
    this.routeRevision = (this.routeRevision || 0) + 1;
    var revision = this.routeRevision;
    window.BlogScrollState.restore(function() { return self.routeRevision === revision; });
    window.scrollTo({ top: 0, behavior: 'instant' });
    this.closeMobileDrawer();
    this.closeMobileOutline();
    this.closeNavDropdowns();

    if (window.BlogSlideViewer && typeof window.BlogSlideViewer.destroyAll === 'function') {
      window.BlogSlideViewer.destroyAll();
    }

    var config = (window.BlogStore && window.BlogStore.config) || window.BlogConfig || {};
    var defaultRoute = config.defaultRoute || this.getRoutes().home || '/';
    var hash = window.location.hash.slice(1) || defaultRoute;
    var path = hash.split('?')[0];
    var query = hash.indexOf('?') === -1 ? '' : hash.slice(hash.indexOf('?'));
    var legacyPath = path;

    // 旧版 Hash 路由兼容：规范化地址但保留既有外链可用性。
    if (legacyPath.indexOf('/post/') === 0) {
      path = (this.getRoutes().posts || '/posts') + legacyPath.slice('/post'.length);
    } else if (legacyPath === '/archives') {
      path = this.getRoutes().archive || '/archive';
    } else if (legacyPath === '/categories' || legacyPath.indexOf('/categories/') === 0) {
      path = (this.getRoutes().tags || '/tags') + legacyPath.slice('/categories'.length);
    }
    if (path !== legacyPath) {
      hash = path + query;
      history.replaceState(null, '', window.location.pathname + window.location.search + '#' + hash);
    }

    var routes = this.getRoutes();
    var postsRoute = routes.posts || '/posts';
    var columnsRoute = routes.columns || '/columns';
    var tagsRoute = routes.tags || '/tags';

    document.querySelectorAll('[data-nav-link]').forEach(function(link) {
      link.classList.remove('active');
      link.removeAttribute('aria-current');
    });

    if (path === postsRoute) {
      // #/posts 与 #/archive 此前渲染的是同一个视图，等于同一内容有两个 URL。
      // 现统一收敛到 #/archive（导航中的正式入口），用 replaceState 不留历史记录，
      // 既保证旧链接仍然可用，也让「文章总览」只有一个规范地址。
      var archiveRoute = routes.archive || '/archive';
      history.replaceState(null, '', window.location.pathname + window.location.search + '#' + archiveRoute);
      this.setActiveNav('archive');
      this.currentRoute = { name: 'archive', params: {} };
      this.renderArchivesView();
      return;
    }

    if (path.indexOf(postsRoute + '/') === 0) {
      var id = this.safeDecode(path.slice(postsRoute.length + 1));
      var detailDoc = window.BlogStore.getDoc(id);
      if (detailDoc.kind === 'page') {
        // 结构化独立页 (type: post)：走高级单页渲染，而非普通文章视图
        this.currentRoute = { name: 'page', params: { file: id } };
        this.renderPageView(detailDoc.data || id, null);
      } else {
        this.currentRoute = { name: 'post', params: { id: id } };
        this.renderPostView(id);
      }
      var heading = new URLSearchParams(query).get('heading');
      if (heading) {
        requestAnimationFrame(function() {
          if (self.routeRevision === revision) self.scrollToHeading(heading);
        });
      }
      return;
    }

    // 专栏统一多级路由: #/columns, #/columns/:colId, #/columns/:colId/:postSlug
    if (path === columnsRoute || path.indexOf(columnsRoute + '/') === 0) {
      var colParts = path.slice(columnsRoute.length).replace(/^\//, '').split('/').filter(Boolean);
      this.setActiveNav('columns');
      if (colParts.length === 0) {
        this.currentRoute = { name: 'columns', params: {} };
        this.renderColumnsView();
      } else if (colParts.length === 1) {
        var columnId = this.safeDecode(colParts[0]);
        this.currentRoute = { name: 'column-detail', params: { colId: columnId } };
        this.renderColumnsView(columnId);
      } else {
        // 兼容旧的 /columns/:column/:post，并收敛为 /posts/:slug。
        var columnPostSlug = this.safeDecode(colParts.slice(1).join('/'));
        window.location.replace(this.postHref(columnPostSlug));
      }
      return;
    }

    // 标签分类多维检索路由: #/tags、#/tags/:tag、#/tags/:tag1/:tag2（多选）或 #/tags?tag=xxx。
    // 选中集合唯一来源于 URL —— 保证「刷新还原 / 复制分享 / 浏览器后退」三者行为一致。
    if (path === tagsRoute || path.indexOf(tagsRoute + '/') === 0) {
      this.setActiveNav('tags');
      var tagParts = path.slice(tagsRoute.length).replace(/^\//, '').split('/').filter(Boolean);
      var queryTag = null;
      if (hash.indexOf('?') !== -1) {
        var params = new URLSearchParams(hash.split('?')[1]);
        queryTag = params.get('tag');
      }
      var selectedFromUrl = tagParts.map(function(part) { return self.safeDecode(part); }).filter(Boolean);
      if (selectedFromUrl.length === 0 && queryTag) {
        selectedFromUrl = [self.safeDecode(queryTag)];
      }
      // URL 里的标签名按「大小写不敏感」归一化为标签云中的规范写法。
      // 否则分享出去的 #/tags/TEST 会筛出 0 篇（数据里的标签其实是 test），
      // 而 resolveLink 解析标签本就是大小写不敏感的 —— 两处行为必须一致。
      selectedFromUrl = this.normalizeTagNames(selectedFromUrl);
      var canonicalTagsHash = this.tagsRouteHref(selectedFromUrl);
      if (window.location.hash !== canonicalTagsHash) history.replaceState(history.state, '', canonicalTagsHash);
      this.selectedSortedTags = new Set(selectedFromUrl);
      this.currentRoute = { name: 'tags', params: { tag: selectedFromUrl[0] || null } };
      this.renderTagsView();
      return;
    }

    if (path === '/editor' || path === '/write') {
      window.location.hash = '#' + defaultRoute;
      return;
    }

    var flatNav = this.getFlattenedNav();
    var matchedNavItem = flatNav.find(function(item) {
      var r = item._route || item.route || '/';
      if (r.indexOf('#') === 0) r = r.slice(1);
      if (r.charAt(0) !== '/') r = '/' + r;
      return r === path || (r === '/' && (path === '' || path === '/'));
    });

    if (matchedNavItem) {
      this.setActiveNav(matchedNavItem.id);
      if (matchedNavItem._parentGroup) {
        this.setActiveNav(matchedNavItem._parentGroup);
      }
      this.dispatchNavItem(matchedNavItem, path);
      return;
    }

    this.currentRoute = { name: 'not-found', params: { path: path } };
    this.renderNotFoundView(path);
  },

  // 依据导航项 target 模式分派渲染：route(默认路由) / dir(目录) / file(文件)
  dispatchNavItem: function(item, path) {
    var parsed = this.parseTarget(item);
    var navId = item.id;

    // file 模式：渲染指定 Markdown 文档（自动区分普通文章与结构化独立页）
    if (parsed.mode === 'file') {
      this.renderFileTarget(parsed.value, item);
      return;
    }

    // dir 模式：渲染该目录下的文章列表
    if (parsed.mode === 'dir') {
      this.currentRoute = { name: 'dir', params: { dir: parsed.value }, navItem: item };
      this.renderDirView(parsed.value, item);
      return;
    }

    // route 模式：优先命中系统内置视图，其余交给通用动态栏目渲染器
    var routes = this.getRoutes();
    if (navId === 'home' || path === (routes.home || '/')) {
      this.currentRoute = { name: 'home', params: {} };
      this.renderHomeView();
    } else if (navId === 'columns' || path === routes.columns) {
      this.currentRoute = { name: 'columns', params: {} };
      this.renderColumnsView();
    } else if (navId === 'archive' || path === routes.archive) {
      this.currentRoute = { name: 'archive', params: {} };
      this.renderArchivesView();
    } else if (navId === 'tags' || path === routes.tags) {
      this.currentRoute = { name: 'tags', params: {} };
      this.selectedSortedTags = new Set();
      this.renderTagsView();
    } else if (navId === 'about') {
      this.currentRoute = { name: 'about', params: {} };
      this.renderPageView('about.md', item);
    } else {
      this.currentRoute = { name: navId, params: {}, navItem: item };
      this.renderDynamicNavView(item);
    }
  },

  // 渲染 file: 目标（对比文档类型自动分流）
  renderFileTarget: function(file, item) {
    var doc = window.BlogStore.getDoc(file);
    if (doc.kind === 'page') {
      this.currentRoute = { name: 'page', params: { file: file }, navItem: item };
      this.renderPageView(doc.data || file, item);
    } else if (doc.kind === 'post') {
      var pid = (doc.data && (doc.data.slug || doc.data.id)) || file;
      this.currentRoute = { name: 'post', params: { id: pid }, navItem: item };
      this.renderPostView(pid);
    } else {
      this.renderNotFoundView(file);
    }
  },

  // 目录视图：列出 posts/ 下某目录（含子目录）内的普通文章，供 target: "dir:..." 使用

};
