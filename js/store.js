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
    var postsData = window.BlogPostsData || window.BlogSampleData || { posts: [], columns: [], projects: [] };
    var compiledPosts = Array.isArray(postsData.posts) ? JSON.parse(JSON.stringify(postsData.posts)) : [];
    this.rawColumns = Array.isArray(postsData.columns) ? JSON.parse(JSON.stringify(postsData.columns)) : [];
    this.rawProjects = Array.isArray(postsData.projects) ? JSON.parse(JSON.stringify(postsData.projects)) : [];
    this.columns = this.rawColumns;
    this.projects = this.rawProjects;
    this.about = postsData.about || "";

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
  getPosts: function(filter) {
    var self = this;
    filter = filter || {};
    var list = this.posts.filter(function(p) {
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

  getPostById: function(id) {
    if (!id) return null;
    var norm = decodeURIComponent(id).toLowerCase().trim();
    return this.posts.find(function(p) {
      if (p.id && p.id.toLowerCase() === norm) return true;
      if (p.slug && p.slug.toLowerCase() === norm) return true;
      if (p.relPath && p.relPath.toLowerCase() === norm) return true;
      if (p.relPath && p.relPath.replace(/\.md$/i, '').toLowerCase() === norm) return true;
      if (p.id && ('post-' + norm) === p.id.toLowerCase()) return true;
      if (p.id && p.id.toLowerCase().endsWith('-' + norm)) return true;
      return false;
    });
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
    var norm = decodeURIComponent(colId).toLowerCase().trim();
    return this.getColumns().find(function(c) {
      return c.id.toLowerCase() === norm || (c.name && c.name.toLowerCase() === norm);
    });
  },

  // 项目集合获取
  getProjects: function() {
    var self = this;
    return (this.rawProjects || this.projects || []).map(function(proj) {
      var filteredPosts = (proj.posts || []).filter(function(p) {
        return !self.isPostExcluded(p);
      });
      var copy = Object.assign({}, proj);
      copy.posts = filteredPosts;
      copy.postsCount = filteredPosts.length;
      return copy;
    }).filter(function(proj) {
      return proj.postsCount > 0;
    });
  },

  getProjectById: function(projId) {
    if (!projId) return null;
    var norm = decodeURIComponent(projId).toLowerCase().trim();
    return this.getProjects().find(function(p) {
      return p.id.toLowerCase() === norm || (p.name && p.name.toLowerCase() === norm);
    });
  },

  // 聚合全站标签
  getAllTags: function() {
    var tagCount = {};
    this.posts.forEach(function(p) {
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
    var totalWords = this.posts.reduce(function(sum, p) { return sum + (p.words || 0); }, 0);
    var totalViews = this.posts.reduce(function(sum, p) { return sum + (p.views || 0); }, 0);

    return {
      postsCount: this.posts.length,
      columnsCount: this.columns.length,
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
