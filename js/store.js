/**
 * ==============================================================================
 * Aurora Blog - 数据中心与持久化存储模块 (Blog Reactive Store)
 * ==============================================================================
 * 1. 自动同步 blog.config.js 全局配置 (作者、站点、社交媒体)。
 * 2. 自动载入 js/posts-data.js 编译后的真实 Markdown 博文索引 (源自 posts/)。
 * 3. LocalStorage 仅用于轻量存储用户交互状态 (点赞、书签、浏览量、在线草稿)。
 * 4. 彻底杜绝本地缓存残留已删除的示例文档。
 */

window.BlogStore = {
  STATE_KEY_VIEWS: 'aurora_blog_views_v3',
  STATE_KEY_LIKES: 'aurora_blog_likes_v3',
  STATE_KEY_BOOKMARKS: 'aurora_blog_bookmarks_v3',
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

    this.author = config.author || {
      name: "Alex Chen",
      title: "Software Architect",
      bio: "Turning complexity into clean order through rigorous logic and craft.",
      avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=AlexChen",
      location: "Shanghai / Remote",
      email: "flyingpig06@outlook.com",
      github: "https://github.com/flyingpig669"
    };

    this.social = config.social || [];
    this.nav = config.nav || [];

    // 3. 载入编译生成的博文索引 (来自 posts/ 目录)
    var postsData = window.BlogPostsData || window.BlogSampleData || { posts: [], columns: [] };
    var compiledPosts = Array.isArray(postsData.posts) ? JSON.parse(JSON.stringify(postsData.posts)) : [];
    this.rawColumns = Array.isArray(postsData.columns) ? JSON.parse(JSON.stringify(postsData.columns)) : [];
    this.columns = this.rawColumns;
    this.about = postsData.about || {};
    this.customPages = postsData.customPages || {};
    this.pages = postsData.pages || {};

    // 4. 载入本地交互统计 (浏览量、点赞、书签)
    var viewsMap = {};
    try {
      var rawViews = localStorage.getItem(this.STATE_KEY_VIEWS);
      if (rawViews) viewsMap = JSON.parse(rawViews);
    } catch (e) {}
    this.viewsMap = viewsMap;

    this.likedPosts = new Set();
    this.bookmarkedPosts = new Set();
    try {
      var rawLikes = localStorage.getItem(this.STATE_KEY_LIKES);
      if (rawLikes) this.likedPosts = new Set(JSON.parse(rawLikes));
      var rawBm = localStorage.getItem(this.STATE_KEY_BOOKMARKS);
      if (rawBm) this.bookmarkedPosts = new Set(JSON.parse(rawBm));
    } catch (e) {}

    // 合并浏览量与点赞统计
    var self = this;
    compiledPosts.forEach(function(p) {
      if (self.viewsMap[p.id]) {
        p.views = Math.max(p.views || 0, self.viewsMap[p.id]);
      }
      if (self.likedPosts.has(p.id)) {
        p.likes = (p.likes || 0) + 1;
      }
    });

    // 最终博文列表 (均来自 posts/ 目录编译索引)
    this.posts = compiledPosts;

    // 6. 应用主题偏好
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

    if (filter.sort === 'views') {
      list.sort(function(a, b) { return (b.views || 0) - (a.views || 0); });
    } else {
      list.sort(function(a, b) {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.date) - new Date(a.date);
      });
    }

    return list;
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
    return this.posts.find(function(p) {
      var idl = String(p.id || '').toLowerCase();
      var slugl = String(p.slug || '').toLowerCase();
      var rel = String(p.relPath || '').toLowerCase();
      var relNoExt2 = rel.replace(/\.md$/i, '');
      for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if (idl === k || slugl === k || rel === k || relNoExt2 === k) return true;
        if (idl && idl === 'post-' + k) return true;
        if (idl && idl.slice(-(k.length + 1)) === '-' + k) return true;
      }
      return false;
    });
  },

  // 获取独立单页数据对象 (支持关于页、自定义 Markdown 单页等)
  getPage: function(key) {
    if (!key) return null;
    var decoded = key;
    try { decoded = decodeURIComponent(key); } catch (e) {}
    var norm = String(decoded).toLowerCase().trim();
    if (this.pages) {
      if (this.pages[key]) return this.pages[key];
      if (this.pages[norm]) return this.pages[norm];
      var base = norm.split("/").pop().replace(/\.md$/i, "");
      if (this.pages[base]) return this.pages[base];
      if (this.pages[base + ".md"]) return this.pages[base + ".md"];
    }
    if (norm === "about" || norm === "about.md") {
      return this.about || null;
    }
    var postMatch = this.posts.find(function(p) {
      if (p.relPath && p.relPath.toLowerCase() === norm) return true;
      if (p.relPath && p.relPath.toLowerCase().endsWith("/" + norm)) return true;
      if (p.slug && p.slug.toLowerCase() === norm) return true;
      if (p.id && p.id.toLowerCase() === norm) return true;
      return false;
    });
    if (postMatch) return postMatch;
    if (this.customPages) {
      if (this.customPages[key]) return { content: this.customPages[key], raw: this.customPages[key], title: key };
      var base2 = norm.split("/").pop().replace(/\.md$/i, "");
      if (this.customPages[base2]) return { content: this.customPages[base2], raw: this.customPages[base2], title: base2 };
    }
    return null;
  },

  // 文档解析：按路径 / slug 解析出文档类型与数据
  // kind = 'page' 表示结构化独立页(type: post)，'post' 表示普通文章(type: normal)
  getDoc: function(key) {
    if (!key) return { kind: null, data: null };
    var decoded = key;
    try { decoded = decodeURIComponent(key); } catch (e) {}
    var norm = String(decoded).toLowerCase().trim();
    var relNorm = norm.indexOf('posts/') === 0 ? norm.slice('posts/'.length) : norm;
    var base = norm.split('/').pop();
    var baseNoExt = base.replace(/\.md$/i, '');
    if (this.pages) {
      var pg = this.pages[key] || this.pages[norm] || this.pages[relNorm] ||
               this.pages[base] || this.pages[baseNoExt] || this.pages[baseNoExt + '.md'];
      if (pg) return { kind: 'page', data: pg };
    }
    var post = this.getPostById(key);
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
    if (/^https?:\/\//i.test(raw) || /^(mailto|tel):/i.test(raw) || raw.charAt(0) === '#') {
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
    var col = this.getColumnById(norm);
    if (col) {
      return { kind: 'column', title: col.name, route: '/columns/' + encodeURIComponent(col.id), slug: col.id, excerpt: col.desc || '' };
    }

    // 5) 标签（带或不带 #）
    var tagName = norm.replace(/^#/, '');
    var tag = (this.getAllTags() || []).find(function(t) {
      return t.name.toLowerCase() === tagName.toLowerCase();
    });
    if (tag) {
      return { kind: 'tag', title: '#' + tag.name, route: '/tags/' + encodeURIComponent(tag.name), slug: tag.name };
    }

    // 6) 文档（normal 文章 / post 结构化独立页），支持 slug / id / relPath
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

    // 7) 按标题匹配（精确优先，其次包含）
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

  incrementView: function(id) {
    var post = this.getPostById(id);
    if (post) {
      post.views = (post.views || 0) + 1;
      this.viewsMap[id] = post.views;
      try {
        localStorage.setItem(this.STATE_KEY_VIEWS, JSON.stringify(this.viewsMap));
      } catch (e) {}
    }
  },

  toggleLikePost: function(id) {
    var post = this.getPostById(id);
    if (!post) return { liked: false, count: 0 };

    var liked = false;
    if (this.likedPosts.has(id)) {
      this.likedPosts.delete(id);
      post.likes = Math.max(0, (post.likes || 1) - 1);
      liked = false;
    } else {
      this.likedPosts.add(id);
      post.likes = (post.likes || 0) + 1;
      liked = true;
    }

    try {
      localStorage.setItem(this.STATE_KEY_LIKES, JSON.stringify(Array.from(this.likedPosts)));
    } catch (e) {}
    return { liked: liked, count: post.likes };
  },

  isPostLiked: function(id) {
    return this.likedPosts.has(id);
  },

  toggleBookmark: function(id) {
    var bookmarked = false;
    if (this.bookmarkedPosts.has(id)) {
      this.bookmarkedPosts.delete(id);
      bookmarked = false;
    } else {
      this.bookmarkedPosts.add(id);
      bookmarked = true;
    }
    try {
      localStorage.setItem(this.STATE_KEY_BOOKMARKS, JSON.stringify(Array.from(this.bookmarkedPosts)));
    } catch (e) {}
    return bookmarked;
  },

  isPostBookmarked: function(id) {
    return this.bookmarkedPosts.has(id);
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

  // 专栏获取
  getColumns: function() {
    var self = this;
    return (this.rawColumns || this.columns || []).map(function(col) {
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

  // 聚合全站标签
  getAllTags: function() {
    var tagCount = {};
    this.getPosts().forEach(function(p) {
      if (p.tags && Array.isArray(p.tags)) {
        p.tags.forEach(function(t) {
          tagCount[t] = (tagCount[t] || 0) + 1;
        });
      }
    });
    return Object.entries(tagCount)
      .map(function(e) { return { name: e[0], count: e[1] }; })
      .sort(function(a, b) { return b.count - a.count; });
  },

  // 全站统计指标
  getStats: function() {
    var visiblePosts = this.getPosts();
    var totalWords = visiblePosts.reduce(function(sum, p) { return sum + (p.words || 0); }, 0);
    var totalViews = visiblePosts.reduce(function(sum, p) { return sum + (p.views || 0); }, 0);

    return {
      postsCount: visiblePosts.length,
      columnsCount: this.getColumns().length,
      tagsCount: this.getAllTags().length,
      wordsCount: totalWords,
      viewsCount: totalViews
    };
  },

  applyTheme: function(theme) {
    this.theme = theme;
    try {
      localStorage.setItem(this.STATE_KEY_THEME, theme);
    } catch (e) {}
    var root = document.documentElement;
    root.classList.add('dark');
  }
};
