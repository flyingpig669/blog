import { shallowReactive } from 'vue';
import { config as siteConfig } from '../config/blog.config.js';
import { routes as defaultRoutes, registry } from '../config/routes.js';
import { html } from './html.js';
/**
 * ==============================================================================
 * Aurora Blog - 数据中心与持久化存储模块 (Blog Reactive Store)
 * ==============================================================================
 * 1. 自动同步 src/config/blog.config.js 全局配置 (站点元信息)。
 * 2. 自动载入 data/index.json 编译后的真实 Markdown 博文索引 (源自 posts/)。
 * 3. 提供文档 / 专栏 / 标签 / 站内互链的统一查询与解析入口。
 * 4. 彻底杜绝本地缓存残留已删除的示例文档。
 */

export function createStore() { return shallowReactive({
  STATE_KEY_THEME: 'aurora_blog_theme_v3',

  init: function(postsData, config = siteConfig) {
    // 1. 清理旧版本遗留的硬编码样本缓存
    try {
      localStorage.removeItem('aurora_blog_posts_v2');
      localStorage.removeItem('aurora_blog_comments_v2');
    } catch (e) {}

    // 2. 加载通过模块导入或测试注入的站点配置
    this.config = config;
    this.site = config.site || {
      title: "CCC de Notes",
      brand: "CCC de Notes",
      tagline: "Personal technical blog focused on Physics, Math, and Computer Science.",
      description: "A personal technical blog by CCC, covering topics in Physics, Math, and Computer Science. Explore articles, tutorials, and insights on cutting-edge technologies and research.",
      footerText: "© 2026 CCC · All rights reserved."
    };

    // 3. 载入编译生成的博文索引 (来自 posts/ 目录)
    // 数据在初始化后即为静态，直接引用而不做深拷贝（深拷贝会重复持有全部正文文本）。
    if (!postsData || postsData.schemaVersion !== 2) throw new Error('内容索引缺失或版本不匹配，请重新构建。');
    this.documents = postsData.documents;
    this.posts = postsData.posts.map(function(id) { return postsData.documents[id]; });
    this.rawColumns = Array.isArray(postsData.columns) ? postsData.columns : [];
    this.columns = this.rawColumns;
    this.about = this.documents[postsData.about] || null;
    this.pages = {};
    var self = this;
    Object.keys(postsData.aliases).forEach(function(alias) {
      var doc = self.documents[postsData.aliases[alias]];
      if (doc.type === 'post') self.pages[alias] = doc;
    });
    this._requests = new Map();
    this.searchUrl = postsData.searchUrl;
    this.searchIndex = null;

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
      if (filter.home && p.home === false) return false;
      return !self.isPostExcluded(p);
    });

    if (filter.type && filter.type !== 'all') {
      list = list.filter(function(p) { return p.type === filter.type; });
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
          ((p.columnName || p.columnDesc || '').toLowerCase().includes(q)) ||
          ((this.searchIndex && this.searchIndex[p.slug] || p.content || '').toLowerCase().indexOf(q) !== -1) ||
          (p.tags && p.tags.some(function(t) { return t.toLowerCase().indexOf(q) !== -1; }))
        );
      }, this);
    }

    list.sort(function(a, b) { return self.comparePosts(a, b, filter.sort); });

    return list;
  },

  // 同日先显示独立文章，再按专栏分组和章节序号排列，最终用标题与 slug 消除扫描顺序影响。
  comparePosts: function(a, b, sort) {
    if (sort !== 'date' && !!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
    var dateA = Date.parse(a.date), dateB = Date.parse(b.date);
    var byDate = (Number.isFinite(dateB) ? dateB : 0) - (Number.isFinite(dateA) ? dateA : 0);
    if (byDate) return byDate;
    var byColumn = this.comparePostText(a.column, b.column);
    if (byColumn) return byColumn;
    if (a.column) {
      var byOrder = this.chapterOrder(a) - this.chapterOrder(b);
      if (byOrder) return byOrder;
    }
    return this.comparePostText(a.title, b.title) || this.comparePostText(a.slug, b.slug);
  },

  comparePostText: function(a, b) {
    return String(a || '').localeCompare(String(b || ''), 'zh-CN', { numeric: true });
  },

  getHomeEntries: function() {
    var self = this, books = new Map(), entries = [];
    this.getPosts({ home: true }).forEach(function(post) {
      if (post.type !== 'books' || !post.column) { entries.push(post); return; }
      if (!books.has(post.column)) books.set(post.column, []);
      books.get(post.column).push(post);
    });
    books.forEach(function(posts, id) {
      var collection = self.getColumnById(id);
      if (!collection) { entries.push.apply(entries, posts); return; }
      var latest = posts.slice().sort(function(a, b) { return self.comparePosts(a, b, 'date'); })[0];
      entries.push({ kind: 'book', slug: 'book:' + id, collection: collection,
        title: collection.name, excerpt: collection.desc, date: latest.date,
        chapterCount: collection.postsCount, pinned: posts.some(function(post) { return post.pinned; }),
        tags: Array.from(new Set(posts.flatMap(function(post) { return post.tags || []; }))) });
    });
    return entries.sort(function(a, b) { return self.comparePosts(a, b); });
  },

  getHomePage: function(requestedPage, requestedSize) {
    var entries = this.getHomeEntries();
    var size = Number(requestedSize);
    if (!Number.isInteger(size) || size < 1 || size > 100) size = 10;
    var pages = Math.max(1, Math.ceil(entries.length / size));
    var page = Number(requestedPage);
    if (!Number.isInteger(page) || page < 1) page = 1;
    page = Math.min(page, pages);
    return { items: entries.slice((page - 1) * size, page * size), page: page, pageCount: pages, total: entries.length };
  },

  chapterOrder: function(post) {
    var order = Number(post.order);
    return post.order != null && Number.isFinite(order) ? order : 999;
  },

  compareChapters: function(a, b) {
    return this.chapterOrder(a) - this.chapterOrder(b) || this.comparePosts(a, b, 'date');
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
      if (String(post.columnName || '').toLowerCase().includes(q)) return 2;
      if ((post.tags || []).some(function(tag) { return tag.toLowerCase().includes(q); })) return 2;
      if (String(post.excerpt || '').toLowerCase().includes(q)) return 1;
      return 0;
    }
    return q ? posts.sort(function(a, b) { return score(b) - score(a); }) : posts;
  },

  fetchJson: function(url) {
    if (this._requests.has(url)) return this._requests.get(url);
    var self = this;
    var controller = new AbortController();
    var timer = setTimeout(function() { controller.abort(); }, 15000);
    var promise = fetch(url, { signal: controller.signal }).then(function(response) {
      if (!response.ok) throw new Error('Request failed: ' + response.status);
      return response.json();
    }).catch(function(error) { self._requests.delete(url); throw error; }).finally(function() { clearTimeout(timer); });
    this._requests.set(url, promise);
    return promise;
  },

  loadDocument: function(doc) {
    if (doc._loaded || !doc.bodyUrl) return Promise.resolve(doc);
    var self = this;
    return this.fetchJson(doc.bodyUrl).then(function(body) {
      if (body.slug !== doc.slug || typeof body.content !== 'string') throw new Error('Invalid document payload');
      Object.assign(doc, body, { _loaded: true });
      return doc;
    }).catch(function(error) { self._requests.delete(doc.bodyUrl); throw error; });
  },

  loadSearch: function() {
    var self = this;
    if (this.searchIndex) return Promise.resolve(this.searchIndex);
    return this.fetchJson(this.searchUrl).then(function(index) {
      if (!index || Array.isArray(index) || typeof index !== 'object' || !Object.values(index).every(function(value) { return typeof value === 'string'; })) throw new Error('Invalid search payload');
      self.searchIndex = index;
      return index;
    }).catch(function(error) { self._requests.delete(self.searchUrl); throw error; });
  },

  searchSnippet: function(post, query) {
    var text = this.searchIndex && this.searchIndex[post.slug] || post.excerpt || '';
    var index = text.toLowerCase().indexOf(String(query || '').trim().toLowerCase());
    var start = Math.max(0, index - 45);
    return (start ? '…' : '') + text.slice(start, start + 150) + (text.length > start + 150 ? '…' : '');
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
        return self.comparePosts(a, b, 'date');
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
  routePath: function(name, value) {
    var routes = (this.config && this.config.routes) || defaultRoutes;
    var base = routes[name];
    return value ? base + '/' + encodeURIComponent(value) : base;
  },

  resolveLink: function(key) {
    if (key === undefined || key === null) return null;
    var raw = String(key).trim();
    if (!raw) return null;

    // 1) 外链 / 已带 # 的 Hash 路由：原样透传
    if (/^https?:\/\//i.test(raw) || /^(mailto|tel):/i.test(raw) || raw.indexOf('#/') === 0) {
      if (html && !html.safeUrl(raw)) return null;
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
      return this.about ? { kind: 'page', title: this.about.title || 'About', route: this.routePath('about'), slug: 'about' } : null;
    }

    // 4) 专栏（按 id / 名称）
    var explicitTag = norm.charAt(0) === '#';
    var col = explicitTag ? null : this.getColumnById(norm);
    if (col) {
      return { kind: 'column', title: col.name, route: this.routePath('columns', col.id), slug: col.id, excerpt: col.desc || '' };
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
          route: this.routePath('posts', slug),
          slug: slug,
          excerpt: d.excerpt || ''
        };
      }
    }

    // 6) 标签（带或不带 #）
    var tagName = norm.replace(/^#/, '');
    var tag = (this.getAllTags() || []).find(function(t) {
      return t.name.toLowerCase() === tagName.toLowerCase() || this.tagSlug(t.name) === tagName.toLowerCase();
    }, this);
    if (tag) {
      return { kind: 'tag', title: '#' + tag.name, route: this.routePath('tags', this.tagSlug(tag.name)), slug: this.tagSlug(tag.name) };
    }

    // 7) 按标题匹配（精确优先，其次包含）
    if (explicitTag) return null;
    var byTitle = this.posts.find(function(p) { return p.title && p.title.toLowerCase() === lower; });
    if (byTitle) {
      var s2 = byTitle.slug || byTitle.id;
      return {
        kind: 'post',
        title: byTitle.title,
        route: this.routePath('posts', s2),
        slug: s2,
        excerpt: byTitle.excerpt || ''
      };
    }

    return null;
  },

  isPostExcluded: function(p) {
    if (!p) return true;
    var exclude = siteConfig.exclude || (this.config && this.config.exclude) || {};
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
      var filteredPosts = (col.postIds || []).map(function(id) { return self.documents[id]; }).filter(function(p) {
        return !self.isPostExcluded(p);
      }).sort(function(a, b) { return self.compareChapters(a, b); });
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
  tagSlug: function(name) {
    return registry.resourceSlug(name);
  },

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
    if (typeof document !== 'undefined') document.documentElement.classList.add('dark');
  }
}); }
export const store = createStore();
