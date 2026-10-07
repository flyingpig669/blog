// Reactive Store and LocalStorage Persistence Engine
window.BlogStore = {
  STATE_KEY_POSTS: 'aurora_blog_posts_v2',
  STATE_KEY_COMMENTS: 'aurora_blog_comments_v2',
  STATE_KEY_LIKES: 'aurora_blog_likes_v2',
  STATE_KEY_BOOKMARKS: 'aurora_blog_bookmarks_v2',
  STATE_KEY_THEME: 'aurora_blog_theme_v2',
  STATE_KEY_DRAFT: 'aurora_blog_draft_v2',

  init: function() {
    var sample = window.BlogSampleData || {};
    this.author = sample.author || {
      name: "极光客 (Alex Chen)",
      title: "全栈架构师 · 开源爱好者 · 终身学习者",
      bio: "专注于现代前端、云原生后端与大模型应用落地。崇尚极简主义与心流开发，用代码记录思考与创造。",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
      location: "杭州 / 远程游民",
      email: "flyingpig06@outlook.com",
      github: "https://github.com/flyingpig669",
      twitter: "https://twitter.com",
      postsCount: 5,
      likesCount: 384,
      wordsCount: 16800,
      daysLive: 365
    };

    this.columns = sample.columns || [];
    this.categories = (sample.categories && sample.categories.length > 0) ? sample.categories : [
      { id: "ai", name: "人工智能", desc: "LLM、Agent、RAG 向量检索与算法工程", color: "from-purple-500 to-indigo-600", icon: "sparkles" },
      { id: "frontend", name: "前端技术", desc: "现代 Web 框架、响应式渲染与工程化实践", color: "from-blue-500 to-cyan-500", icon: "code" },
      { id: "backend", name: "后端架构", desc: "分布式系统、高可用架构与微服务实战", color: "from-emerald-500 to-teal-600", icon: "terminal" },
      { id: "design", name: "设计美学", desc: "设计系统、排版律动、微交互与体验设计", color: "from-pink-500 to-rose-500", icon: "layers" },
      { id: "life", name: "思考随笔", desc: "数字游民、心流思考、认知升级与阅读记录", color: "from-amber-500 to-orange-500", icon: "book-open" }
    ];

    // Load Posts with fallback
    var loadedPosts = [];
    try {
      var rawPosts = localStorage.getItem(this.STATE_KEY_POSTS);
      if (rawPosts) loadedPosts = JSON.parse(rawPosts);
    } catch (e) {}

    var samplePosts = (sample.posts && sample.posts.length > 0) ? JSON.parse(JSON.stringify(sample.posts)) : [];
    var postMap = {};
    samplePosts.forEach(function(p) { postMap[p.id] = p; });
    if (Array.isArray(loadedPosts)) {
      loadedPosts.forEach(function(p) {
        // preserve likes and views from localStorage
        if (postMap[p.id]) {
          postMap[p.id].views = Math.max(postMap[p.id].views || 0, p.views || 0);
          postMap[p.id].likes = Math.max(postMap[p.id].likes || 0, p.likes || 0);
        } else {
          postMap[p.id] = p;
        }
      });
    }
    this.posts = Object.values(postMap);
    this.savePosts();

    // Load Comments with fallback
    var loadedComments = {};
    try {
      var rawComments = localStorage.getItem(this.STATE_KEY_COMMENTS);
      if (rawComments) loadedComments = JSON.parse(rawComments);
    } catch (e) {}

    if (loadedComments && Object.keys(loadedComments).length > 0) {
      this.comments = loadedComments;
    } else {
      this.comments = sample.comments ? JSON.parse(JSON.stringify(sample.comments)) : {};
      this.saveComments();
    }

    // Load Likes & Bookmarks
    this.likedPosts = new Set();
    this.bookmarkedPosts = new Set();
    try {
      var rawLikes = localStorage.getItem(this.STATE_KEY_LIKES);
      if (rawLikes) this.likedPosts = new Set(JSON.parse(rawLikes));
      var rawBm = localStorage.getItem(this.STATE_KEY_BOOKMARKS);
      if (rawBm) this.bookmarkedPosts = new Set(JSON.parse(rawBm));
    } catch (e) {}

    // Apply Theme
    var savedTheme = 'dark';
    try {
      savedTheme = localStorage.getItem(this.STATE_KEY_THEME) || 'dark';
    } catch (e) {}
    this.applyTheme(savedTheme);
  },

  savePosts: function() {
    try {
      localStorage.setItem(this.STATE_KEY_POSTS, JSON.stringify(this.posts));
    } catch (e) {}
  },

  saveComments: function() {
    try {
      localStorage.setItem(this.STATE_KEY_COMMENTS, JSON.stringify(this.comments));
    } catch (e) {}
  },

  saveLikes: function() {
    try {
      localStorage.setItem(this.STATE_KEY_LIKES, JSON.stringify(Array.from(this.likedPosts)));
    } catch (e) {}
  },

  saveBookmarks: function() {
    try {
      localStorage.setItem(this.STATE_KEY_BOOKMARKS, JSON.stringify(Array.from(this.bookmarkedPosts)));
    } catch (e) {}
  },

  getPosts: function(filter) {
    filter = filter || {};
    var list = this.posts.slice();

    if (filter.category && filter.category !== 'all') {
      list = list.filter(function(p) { return p.category === filter.category; });
    }

    if (filter.tag) {
      list = list.filter(function(p) { return p.tags && p.tags.indexOf(filter.tag) !== -1; });
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

    if (filter.sort === 'likes') {
      list.sort(function(a, b) { return (b.likes || 0) - (a.likes || 0); });
    } else if (filter.sort === 'views') {
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
    return this.posts.find(function(p) { return p.id === id || p.slug === id; });
  },

  addPost: function(postData) {
    var newPost = {
      id: 'post-' + Date.now(),
      slug: (postData.slug || postData.title).toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-').slice(0, 40),
      title: postData.title,
      category: postData.category || 'frontend',
      categoryName: this.getCategoryName(postData.category || 'frontend'),
      coverGradient: postData.coverGradient || 'from-indigo-600 to-purple-500',
      date: new Date().toISOString().split('T')[0],
      readTime: Math.max(1, Math.ceil((postData.content || '').length / 400)) + ' 分钟',
      words: (postData.content || '').length,
      views: 1,
      likes: 0,
      pinned: !!postData.pinned,
      excerpt: postData.excerpt || (postData.content || '').replace(/[#*>\[\]]/g, '').slice(0, 150) + '...',
      tags: postData.tags || [],
      content: postData.content || ''
    };

    this.posts.unshift(newPost);
    this.savePosts();
    return newPost;
  },

  deletePost: function(id) {
    this.posts = this.posts.filter(function(p) { return p.id !== id; });
    this.savePosts();
  },

  incrementView: function(id) {
    var post = this.getPostById(id);
    if (post) {
      post.views = (post.views || 0) + 1;
      this.savePosts();
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

    this.saveLikes();
    this.savePosts();
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
    this.saveBookmarks();
    return bookmarked;
  },

  isPostBookmarked: function(id) {
    return this.bookmarkedPosts.has(id);
  },

  getComments: function(postId) {
    return this.comments[postId] || [];
  },

  addComment: function(postId, commentData) {
    if (!this.comments[postId]) {
      this.comments[postId] = [];
    }

    var newComment = {
      id: 'c-' + Date.now(),
      author: commentData.author || '热心读者',
      avatar: commentData.avatar || ('https://api.dicebear.com/7.x/identicon/svg?seed=' + encodeURIComponent(commentData.author || 'User')),
      date: '刚刚',
      content: commentData.content,
      likes: 0
    };

    this.comments[postId].unshift(newComment);
    this.saveComments();
    return newComment;
  },

  likeComment: function(postId, commentId) {
    var list = this.comments[postId];
    if (!list) return 0;
    var item = list.find(function(c) { return c.id === commentId; });
    if (item) {
      item.likes = (item.likes || 0) + 1;
      this.saveComments();
      return item.likes;
    }
    return 0;
  },

  getCategoryName: function(catId) {
    var found = this.categories.find(function(c) { return c.id === catId; });
    return found ? found.name : catId;
  },

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

  
  getColumns: function() {
    return this.columns || (window.BlogSampleData && window.BlogSampleData.columns) || [];
  },

  getColumnById: function(colId) {
    var cols = this.getColumns();
    return cols.find(function(c) { return c.id === colId; });
  },
  getStats: function() {
    var totalWords = this.posts.reduce(function(sum, p) { return sum + (p.words || 0); }, 0);
    var totalLikes = this.posts.reduce(function(sum, p) { return sum + (p.likes || 0); }, 0);
    var totalViews = this.posts.reduce(function(sum, p) { return sum + (p.views || 0); }, 0);

    return {
      postsCount: this.posts.length,
      categoriesCount: this.categories.length,
      tagsCount: this.getAllTags().length,
      wordsCount: totalWords,
      likesCount: totalLikes,
      viewsCount: totalViews,
      daysLive: 365
    };
  },

  applyTheme: function(theme) {
    this.theme = theme;
    try {
      localStorage.setItem(this.STATE_KEY_THEME, theme);
    } catch (e) {}

    var root = document.documentElement;
    var isDark = theme === 'dark' || (theme === 'auto' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  },

  toggleTheme: function() {
    var current = this.theme;
    var next = 'dark';
    if (current === 'light') next = 'dark';
    else if (current === 'dark') next = 'auto';
    else next = 'light';
    this.applyTheme(next);
    return next;
  },

  saveDraft: function(draft) {
    try {
      localStorage.setItem(this.STATE_KEY_DRAFT, JSON.stringify(draft));
    } catch (e) {}
  },

  getDraft: function() {
    try {
      var d = localStorage.getItem(this.STATE_KEY_DRAFT);
      return d ? JSON.parse(d) : null;
    } catch (e) {
      return null;
    }
  },

  clearDraft: function() {
    try {
      localStorage.removeItem(this.STATE_KEY_DRAFT);
    } catch (e) {}
  },

  resetToDefault: function() {
    try {
      localStorage.removeItem(this.STATE_KEY_POSTS);
      localStorage.removeItem(this.STATE_KEY_COMMENTS);
      localStorage.removeItem(this.STATE_KEY_LIKES);
      localStorage.removeItem(this.STATE_KEY_BOOKMARKS);
    } catch (e) {}
    this.init();
  }
};
