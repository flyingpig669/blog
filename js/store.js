/**
 * ==============================================================================
 * Aurora Blog - 数据中心与持久化存储模块 (Blog Reactive Store)
 * ==============================================================================
 * 1. 自动同步 blog.config.js 全局配置 (站点元信息)。
 * 2. 自动载入 js/posts-data.js 编译后的真实 Markdown 博文索引 (源自 posts/)。
 * 3. 提供文档 / 专栏 / 标签 / 站内互链的统一查询与解析入口。
 * 4. 彻底杜绝本地缓存残留已删除的示例文档。
 */

window.BlogStore = {
  STATE_KEY_THEME: 'aurora_blog_theme_v3',

  init: function() {
    // 1. 清理旧版本遗留的硬编码样本缓存
    try {
      localStorage.removeItem('aurora_blog_posts_v2');
      localStorage.removeItem('aurora_blog_comments_v2');
    } catch (e) {}

    // 2. 加载配置 (优先读取全局 BlogConfig)
    var config = window.BlogConfig || {};
    this.config = config;
    this.site = config.site || {
      title: "Aurora Notes",
      brand: "aurora.notes",
      tagline: "Curated research essays and computing fundamentals.",
      description: "Personal technical blog.",
      footerText: "© 2026 Alex Chen · All rights reserved."
    };

    // 3. 载入编译生成的博文索引 (来自 posts/ 目录)
    // 数据在初始化后即为静态，直接引用而不做深拷贝（深拷贝会重复持有全部正文文本）。
    var postsData = window.BlogPostsData || window.BlogSampleData || { posts: [], columns: [] };
    this.posts = Array.isArray(postsData.posts) ? postsData.posts : [];
    this.rawColumns = Array.isArray(postsData.columns) ? postsData.columns : [];
    this.columns = this.rawColumns;
    this.about = postsData.about || {};
    this.customPages = postsData.customPages || {};
    this.pages = postsData.pages || {};

    // 派生结果缓存（见 getColumns / getAllTags）
    this._columnsCache = null;
    this._tagsCache = null;

    // 4. 应用主题偏好
    var savedTheme = 'dark';
    try {
      savedTheme = localStorage.getItem(this.STATE_KEY_THEME) || 'dark';
    } catch (e) {}
    this.applyTheme(savedTheme);
  },

  // 获取全部博文 (支持多维筛选与排序)
  // 结构化独立页 (type: post / page) 不进入博文流，仅通过导航 target:file: 单独访问。
  getPosts: function(filter) {
    var self = this;
    filter = filter || {};
    var list = this.posts.filter(function(p) {
      if (p.type === 'post' || p.type === 'page') return false;
      return !self.isPostExcluded(p);
    });

    if (filter.category && filter.category !== 'all') {
      list = list.filter(function(p) { return p.category === filter.category; });
    }

    if (filter.tag) {
      list = list.filter(function(p) {
        return p.tags && p.tags.indexOf(filter.tag) !== -1;
      });
    }

    if (filter.query) {
      var q = filter.query.toLowerCase().trim();
      list = list.filter(function(p) {
        return (
          (p.title && p.title.toLowerCase().indexOf(q) !== -1) ||
          (p.excerpt && p.excerpt.toLowerCase().indexOf(q) !== -1) ||
          (p.content && p.content.toLowerCase().indexOf(q) !== -1) ||
          (p.tags && p.tags.some(function(t) { return t.toLowerCase().indexOf(q) !== -1; }))
        );
      });
    }

    list.sort(function(a, b) {
      if (filter.sort !== 'date' && a.pinned && !b.pinned) return -1;
      if (filter.sort !== 'date' && !a.pinned && b.pinned) return 1;
      return new Date(b.date) - new Date(a.date);
    });

    return list;
  },

  // 目录查询：列出 posts/ 下指定目录（含其子目录）内的普通文章，按日期倒序
  searchPosts: function(query) {
    var q = String(query || '').trim().toLowerCase();
    var posts = this.getPosts({ query: q, sort: 'date' });
    function score(post) {
      var title = String(post.title || '').toLowerCase();
      if (title === q) return 5;
      if (title.startsWith(q)) return 4;
      if (title.includes(q)) return 3;
      if ((post.tags || []).some(function(tag) { return tag.toLowerCase().includes(q); })) return 2;
      if (String(post.excerpt || '').toLowerCase().includes(q)) return 1;
      return 0;
    }
    return q ? posts.sort(function(a, b) { return score(b) - score(a); }) : posts;
  },

  // 目录查询：列出 posts/ 下指定目录（含其子目录）内的普通文章，按日期倒序
  // 供导航项 target: "dir:posts/xxx" 使用
  getPostsByDir: function(dir) {
    var self = this;
    var norm = String(dir || '').trim().replace(/^\.\//, '').replace(/^\/+/, '').replace(/\/+$/, '');
    if (norm.indexOf('posts/') === 0) norm = norm.slice('posts/'.length);
    if (!norm) return [];
    var prefix = norm + '/';
    return this.posts
      .filter(function(p) {
        if (p.type === 'post' || p.type === 'page') return false;
        if (self.isPostExcluded(p)) return false;
        var rel = String(p.relPath || '').replace(/^\.\//, '');
        return rel.indexOf(prefix) === 0;
      })
      .sort(function(a, b) {
        return new Date(b.date) - new Date(a.date);
      });
  },

  getPostById: function(id) {
    if (!id) return null;
    var decoded = id;
    try { decoded = decodeURIComponent(id); } catch (e) {}
    var raw = String(decoded).toLowerCase().trim();
    var norm = raw.replace(/^\.?\//, '');
    // relPath 是相对 posts/ 的路径，故同时派生去掉 posts/ 前缀与 .md 后缀的候选
    var relNorm = norm.indexOf('posts/') === 0 ? norm.slice('posts/'.length) : norm;
    var relNoExt = relNorm.replace(/\.md$/i, '');
    var keys = [raw, norm, relNorm, relNoExt].filter(function(v, i, a) { return v && a.indexOf(v) === i; });
    var exactPath = this.posts.find(function(p) {
      return String(p.relPath || '').toLowerCase() === relNorm;
    });
    if (exactPath) return exactPath;
    return this.posts.find(function(p) {
      var idl = String(p.id || '').toLowerCase();
      var slugl = String(p.slug || '').toLowerCase();
      var rel = String(p.relPath || '').toLowerCase();
      var relNoExt2 = rel.replace(/\.md$/i, '');
      for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if (idl === k || slugl === k || rel === k || relNoExt2 === k) return true;
      }
      return false;
    }) || null;
  },

  // 获取独立单页数据对象 (支持关于页、自定义 Markdown 单页等)
  getPage: function(key) {
    return this.getDoc(key).data;
  },

  // 文档解析：按路径 / slug 解析出文档类型与数据
  // kind = 'page' 表示结构化独立页(type: post)，'post' 表示普通文章(type: normal)
  getDoc: function(key) {
    if (!key) return { kind: null, data: null };
    var decoded = key;
    try { decoded = decodeURIComponent(key); } catch (e) {}
    var norm = String(decoded).toLowerCase().trim();
    var relNorm = norm.indexOf('posts/') === 0 ? norm.slice('posts/'.length) : norm;
    // 完整路径不允许降级为文件名，否则 demo/roadmap.md 会命中根目录 Roadmap。
    var post = this.getPostById(key);
    if (post && post.type !== 'post' && post.type !== 'page') {
      return { kind: 'post', data: post };
    }
    if (this.pages) {
      var pg = this.pages[norm] || this.pages[relNorm];
      if (!pg && post) pg = this.pages[post.relPath] || this.pages[post.slug];
      if (pg) return { kind: 'page', data: pg };
    }
    if (post) {
      var rich = (post.type === 'post' || post.type === 'page');
      return { kind: rich ? 'page' : 'post', data: post };
    }
    if (norm === 'about' || norm === 'about.md') {
      if (this.about) return { kind: 'page', data: this.about };
    }
    return { kind: null, data: null };
  },

  // 站内互链解析：把 [[key]] / 相对 .md 链接 统一解析为「站内路由 + 展示标题」。
  // 支持按 文章 slug / id / relPath / 标题 / 专栏 / 标签 引用；未命中返回 null。
  // 返回：{ kind, title, route, href?, slug, excerpt }
  resolveLink: function(key) {
    if (key === undefined || key === null) return null;
    var raw = String(key).trim();
    if (!raw) return null;

    // 1) 外链 / 已带 # 的 Hash 路由：原样透传
    if (/^https?:\/\//i.test(raw) || /^(mailto|tel):/i.test(raw) || raw.indexOf('#/') === 0) {
      return { kind: 'url', title: raw.replace(/^#/, ''), href: raw };
    }

    var decoded = raw;
    try { decoded = decodeURIComponent(raw); } catch (e) {}
    decoded = decoded.trim();

    // 2) 绝对站内路由（如 /about、/archive）：原样透传（.md 结尾的除外，需按文档解析）
    if (decoded.charAt(0) === '/' && !/\.(md|markdown)$/i.test(decoded)) {
      return { kind: 'route', title: decoded, route: decoded };
    }

    var stripped = decoded
      .replace(/^(?:\.\.?\/)+/, '')   // 去掉 ./ ../
      .replace(/^\/+/, '')            // 去掉前导 /
      .replace(/\.(md|markdown)$/i, '') // 去掉扩展名
      .replace(/^posts\//i, '');      // 去掉 posts/ 前缀
    var norm = stripped.trim();
    var lower = norm.toLowerCase();
    if (!norm) return null;

    // 3) 关于页
    if (lower === 'about' || lower === 'about.md') {
      return { kind: 'page', title: (this.about && this.about.title) || 'About', route: '/about', slug: 'about' };
    }

    // 4) 专栏（按 id / 名称）
    var explicitTag = norm.charAt(0) === '#';
    var col = explicitTag ? null : this.getColumnById(norm);
    if (col) {
      return { kind: 'column', title: col.name, route: '/columns/' + encodeURIComponent(col.id), slug: col.id, excerpt: col.desc || '' };
    }

    // 5) 文档（normal 文章 / post 结构化独立页），支持 slug / id / relPath。
    //    文档优先于标签：否则一旦出现与文章同名的标签，[[名字]] 会被标签悄悄截走。
    //    以 # 开头视为「显式指定标签」，跳过文档解析。
    if (!explicitTag) {
      var doc = this.getDoc(norm) || this.getDoc(decoded);
      if (doc && doc.data) {
        var d = doc.data;
        var slug = d.slug || d.id || norm;
        return {
          kind: doc.kind === 'page' ? 'page' : 'post',
          title: d.title || slug,
          route: '/posts/' + encodeURIComponent(slug),
          slug: slug,
          excerpt: d.excerpt || ''
        };
      }
    }

    // 6) 标签（带或不带 #）
    var tagName = norm.replace(/^#/, '');
    var tag = (this.getAllTags() || []).find(function(t) {
      return t.name.toLowerCase() === tagName.toLowerCase();
    });
    if (tag) {
      return { kind: 'tag', title: '#' + tag.name, route: '/tags/' + encodeURIComponent(tag.name), slug: tag.name };
    }

    // 7) 按标题匹配（精确优先，其次包含）
    if (explicitTag) return null;
    var byTitle = this.posts.find(function(p) { return p.title && p.title.toLowerCase() === lower; }) ||
                  this.posts.find(function(p) { return p.title && p.title.toLowerCase().indexOf(lower) !== -1; });
    if (byTitle) {
      var s2 = byTitle.slug || byTitle.id;
      return {
        kind: 'post',
        title: byTitle.title,
        route: '/posts/' + encodeURIComponent(s2),
        slug: s2,
        excerpt: byTitle.excerpt || ''
      };
    }

    return null;
  },

  isPostExcluded: function(p) {
    if (!p) return true;
    var exclude = (window.BlogConfig && window.BlogConfig.exclude) || (this.config && this.config.exclude) || {};
    if (exclude.showTest === false) {
      if (p.isTest) return true;
      if (p.tags && p.tags.some(function(t) { return (t || '').toLowerCase() === 'test'; })) return true;
    }
    if (exclude.files && Array.isArray(exclude.files) && exclude.files.length > 0) {
      var fn = (p.relPath || '').split('/').pop();
      if (exclude.files.indexOf(fn) !== -1 || exclude.files.indexOf(p.relPath) !== -1 || exclude.files.indexOf(p.slug) !== -1) {
        return true;
      }
    }
    if (exclude.dirs && Array.isArray(exclude.dirs) && exclude.dirs.length > 0) {
      var parts = (p.relPath || '').split('/');
      parts.pop();
      if (parts.some(function(d) { return exclude.dirs.indexOf(d) !== -1; })) {
        return true;
      }
    }
    return false;
  },

  // 专栏获取（结果只依赖初始化后的静态数据，故记忆化；
  // getColumnById / resolveLink 会在渲染一页时被调用很多次）
  getColumns: function() {
    if (this._columnsCache) return this._columnsCache;
    var self = this;
    this._columnsCache = (this.rawColumns || this.columns || []).map(function(col) {
      var filteredPosts = (col.posts || []).filter(function(p) {
        return !self.isPostExcluded(p);
      });
      var copy = Object.assign({}, col);
      copy.posts = filteredPosts;
      copy.postsCount = filteredPosts.length;
      return copy;
    }).filter(function(col) {
      return col.postsCount > 0;
    });
    return this._columnsCache;
  },

  getColumnById: function(colId) {
    if (!colId) return null;
    var decoded = colId;
    try { decoded = decodeURIComponent(colId); } catch (e) {}
    var norm = String(decoded).toLowerCase().trim();
    return this.getColumns().find(function(c) {
      return String(c.id || '').toLowerCase() === norm || (c.name && c.name.toLowerCase() === norm);
    });
  },

  // 聚合全站标签（记忆化：resolveLink 解析每条互链都可能需要它）
  getAllTags: function() {
    if (this._tagsCache) return this._tagsCache;
    var tagCount = {};
    this.getPosts().forEach(function(p) {
      if (p.tags && Array.isArray(p.tags)) {
        p.tags.forEach(function(t) {
          tagCount[t] = (tagCount[t] || 0) + 1;
        });
      }
    });
    this._tagsCache = Object.entries(tagCount)
      .map(function(e) { return { name: e[0], count: e[1] }; })
      .sort(function(a, b) { return b.count - a.count; });
    return this._tagsCache;
  },

  // 主题：本站为固定深色（<html class="dark">）。保留写入接口，便于日后接入浅色模式。
  applyTheme: function(theme) {
    this.theme = theme || 'dark';
    try {
      localStorage.setItem(this.STATE_KEY_THEME, this.theme);
    } catch (e) {}
    document.documentElement.classList.add('dark');
  }
};
