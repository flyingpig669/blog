// Methods consume a controller interface via this; no page or app imports.
window.BlogRouter = {
  getFlattenedNav: function() {
    var raw = (window.BlogStore.config && window.BlogStore.config.nav) || (window.BlogConfig && window.BlogConfig.nav) || [];
    var list = [];
    var self = this;
    window.BlogRouteRegistry.navGroups(raw).forEach(function(group) {
      [group.head].concat(group.folded).forEach(function(item, index) {
        var copy = Object.assign({}, item);
        if (group.folded.length) copy._parentGroup = group.head.id;
        copy._isFolded = index > 0;
        copy._route = self.navItemRoute(copy);
        list.push(copy);
      });
    });
    return list;
  },

  // 路由字典：直接来自 src/lib/routes.js 由声明表派生的 window.BlogRoutes。
  // config.routes 只是同一个对象的引用，优先读它以便测试注入。
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

};
