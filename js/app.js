// Aurora Blog - Ultra-Modern Cyber Minimalism (Linear / Vercel Aesthetic)
window.BlogApp = {
  currentRoute: { name: 'home', params: {} },
  activeTag: null,
  searchQuery: '',

  init: function() {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    window.BlogStore.init();
    this.setupEventListeners();
    this.handleRoute();
    var self = this;
    window.addEventListener('hashchange', function() { self.handleRoute(); });
  },

  setupEventListeners: function() {
    var self = this;
    window.addEventListener('keydown', function(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        self.openSearchModal();
      }
      if (e.key === 'Escape') {
        self.closeSearchModal();
        self.closeMobileToc();
      }
    });

    // Delegated Outline heading navigation click handler
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

    // Delegated copy button handler
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

    // Window scroll handler for reading progress bar & scrollspy
    window.addEventListener('scroll', function() {
      // 1. Reading progress bar
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

      // 2. Active Outline Scrollspy (highlight heading in right floating sidebar)
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

  // Flawless heading scroll navigation with smooth scroll and navbar compensation
  scrollToHeading: function(id) {
    if (!id) return;
    var el = document.getElementById(id);
    if (el) {
      var navHeight = 76; // 56px sticky header + 20px breathing room
      var rect = el.getBoundingClientRect();
      var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      var targetY = rect.top + scrollTop - navHeight;
      window.scrollTo({
        top: Math.max(0, targetY),
        behavior: 'smooth'
      });

      // Highlight active button immediately for instantaneous user feedback
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

  closeMobileOutline: function() {
    var drawer = document.getElementById('mobile-outline-drawer') || document.getElementById('mobile-toc-drawer');
    if (drawer && !drawer.classList.contains('hidden')) {
      drawer.classList.add('translate-x-full');
      setTimeout(function() { drawer.classList.add('hidden'); }, 200);
    }
  },

  toggleMobileToc: function() { this.toggleMobileOutline(); },
  closeMobileToc: function() { this.closeMobileOutline(); },

  handleRoute: function() {
    window.scrollTo(0, 0);
    var drawer = document.getElementById('mobile-drawer');
    if (drawer) drawer.classList.add('hidden');
    this.closeMobileToc();

    var hash = window.location.hash.slice(1) || '/';
    var path = hash.split('?')[0];

    // Update nav active link
    document.querySelectorAll('.nav-link').forEach(function(link) {
      link.classList.remove('active');
    });

    if (path.indexOf('/post/') === 0) {
      var id = path.replace('/post/', '');
      this.currentRoute = { name: 'post', params: { id: id } };
      this.renderPostView(id);
    } else if (path === '/columns') {
      this.currentRoute = { name: 'columns', params: {} };
      var link = document.querySelector('[data-nav-link="columns"]');
      if (link) link.classList.add('active');
      this.renderColumnsView();
    } else if (path === '/archives') {
      this.currentRoute = { name: 'archives', params: {} };
      var link = document.querySelector('[data-nav-link="archives"]');
      if (link) link.classList.add('active');
      this.renderArchivesView();
    } else if (path === '/categories' || path === '/tags') {
      this.currentRoute = { name: 'tags', params: {} };
      var link = document.querySelector('[data-nav-link="categories"]');
      if (link) link.classList.add('active');
      this.renderTagsView();
    } else if (path === '/editor') {
      this.currentRoute = { name: 'editor', params: {} };
      this.renderEditorView();
    } else if (path === '/about') {
      this.currentRoute = { name: 'about', params: {} };
      var link = document.querySelector('[data-nav-link="about"]');
      if (link) link.classList.add('active');
      this.renderAboutView();
    } else {
      this.currentRoute = { name: 'home', params: {} };
      var link = document.querySelector('[data-nav-link="home"]');
      if (link) link.classList.add('active');
      this.renderHomeView();
    }
  },

  // 1. Home View
  renderHomeView: function() {
    var container = document.getElementById('app-main');
    var posts = window.BlogStore.posts || [];

    if (this.activeTag) {
      posts = posts.filter(function(p) {
        return (p.tags || []).indexOf(window.BlogApp.activeTag) !== -1;
      });
    }

    var html = '<div class="max-w-[720px] mx-auto">';

    // Hero Section
    html += '<section class="pt-20 md:pt-24 pb-12 border-b border-white/[0.06]">';
    html += '  <h1 class="text-[36px] sm:text-[44px] md:text-[48px] font-bold text-[#EDEDED] tracking-[-0.02em] leading-[1.15] mb-4 font-sans">';
    html += '    极光随笔';
    html += '  </h1>';
    html += '  <p class="text-[17px] sm:text-[18px] text-[#8B8B8E] leading-relaxed max-w-[620px] font-normal">';
    html += '    探索量子前沿计算、理论物理、系统架构与统计认知模型。冷静、克制、严谨。';
    html += '  </p>';
    if (this.activeTag) {
      html += '  <div class="mt-6 flex items-center gap-2 text-[13px] font-mono text-[#8B8B8E]">';
      html += '    <span>Filtering by tag:</span>';
      html += '    <span class="text-[#3B82F6]">#' + this.activeTag + '</span>';
      html += '    <button onclick="window.BlogApp.clearTag()" class="text-[#5A5A5E] hover:text-[#EDEDED] ml-2">✕ clear</button>';
      html += '  </div>';
    }
    html += '</section>';

    // Article List
    html += '<section class="divide-y divide-white/[0.06]">';
    if (posts.length === 0) {
      html += '<div class="py-20 text-center text-[#5A5A5E] font-mono text-[14px]">No articles found.</div>';
    } else {
      posts.forEach(function(post) {
        var partNumber = post.order ? (post.order < 10 ? '0' + post.order : post.order) : '01';

        html += '<article class="post-item group">';
        // Row 1: Date + Pure English Series Badge
        html += '  <div class="flex items-center gap-2.5 text-[12px] font-mono text-[#5A5A5E] mb-2">';
        html += '    <span>' + post.date + '</span>';
        if (post.columnName) {
          html += '    <span>·</span>';
          html += '    <span class="text-[#3B82F6] bg-[#3B82F6]/10 px-1.5 py-0.5 rounded-[4px] text-[11px] font-medium">' + post.columnName + ' / Part ' + partNumber + '</span>';
        }
        html += '  </div>';
        
        // Row 2: Title
        html += '  <h2 class="mb-2.5">';
        html += '    <a href="#/post/' + post.id + '" class="post-item-title block leading-snug">' + post.title + '</a>';
        html += '  </h2>';

        // Row 3: Excerpt
        html += '  <p class="text-[14px] text-[#8B8B8E] leading-relaxed line-clamp-2 mb-3.5">';
        html += post.excerpt || '';
        html += '  </p>';

        // Row 4: Tag Pills
        html += '  <div class="flex flex-wrap items-center gap-2">';
        (post.tags || []).forEach(function(tag) {
          html += '    <a href="#/" onclick="window.BlogApp.setTag(decodeURIComponent(\'' + encodeURIComponent(tag) + '\'))" class="tag-pill">#' + tag + '</a>';
        });
        html += '  </div>';
        html += '</article>';
      });
    }
    html += '</section>';
    html += '</div>';

    container.innerHTML = html;
  },

  // 2. Post Detail View (Max width 680px Content, ALWAYS FLOATING OUTLINE ON THE RIGHT)
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

    // Outer Container: Flex dual column, 960px max width centered
    var html = '<div class="max-w-[1000px] mx-auto pt-12 md:pt-16 pb-20 flex justify-between items-start gap-6 lg:gap-10 relative">';

    // Left Column: 680px Reading Body
    html += '<div class="flex-1 max-w-[680px] min-w-0">';

    // Back link
    html += '<div class="mb-8">';
    html += '  <a href="#/" class="text-[13px] font-mono text-[#8B8B8E] hover:text-[#3B82F6] transition-colors inline-flex items-center gap-1.5">← Back to writing</a>';
    html += '</div>';

    // Unified English Series Banner (No messy Chinese)
    if (columnInfo) {
      html += '<div class="mb-6 py-2 px-3.5 rounded-[6px] bg-[#161618] border border-white/[0.08] flex items-center justify-between text-[12px] font-mono text-[#8B8B8E]">';
      html += '  <div class="flex items-center gap-2 min-w-0">';
      html += '    <span class="px-1.5 py-0.5 rounded bg-[#3B82F6]/15 text-[#3B82F6] text-[11px] font-medium shrink-0">PART ' + partNumber + '</span>';
      html += '    <span class="text-[#EDEDED] font-sans truncate">' + columnInfo.name + '</span>';
      html += '  </div>';
      html += '  <a href="#/columns" class="text-[#8B8B8E] hover:text-[#3B82F6] transition-colors shrink-0 ml-3">Series Index →</a>';
      html += '</div>';
    }

    // Article Header
    html += '<header class="mb-8 pb-6 border-b border-white/[0.06]">';
    html += '  <h1 class="text-[30px] sm:text-[34px] md:text-[36px] font-bold text-[#EDEDED] tracking-[-0.02em] leading-[1.25] mb-4 font-sans">' + post.title + '</h1>';
    
    // Metadata row: Date · Read time · Words · Tags
    html += '  <div class="flex flex-wrap items-center gap-2 text-[12px] font-mono text-[#5A5A5E]">';
    html += '    <span>' + post.date + '</span>';
    html += '    <span>·</span>';
    html += '    <span>' + (post.readTime || '5 min read') + '</span>';
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

    // Markdown Article Content
    html += '<article class="markdown-body mb-16">';
    html += renderedHtml;
    html += '</article>';

    // Prev / Next Navigation Cards
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

    html += '</div>'; // End left column
    // Right Column: ALWAYS FLOATING STICKY OUTLINE (Visible from 600px+)
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

    html += '</div>'; // End outer container

    // Floating Action Button + Slide-over Drawer for Small Screens (<600px)
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

  // 3. Series View (Unified Minimalist List, perfectly aligned with Home & Archive)
  renderColumnsView: function() {
    var container = document.getElementById('app-main');
    var columns = window.BlogStore.getColumns() || [];

    var html = '<div class="max-w-[720px] mx-auto pt-16 md:pt-20 pb-20">';
    
    // Header
    html += '  <header class="mb-8 pb-8 border-b border-white/[0.06]">';
    html += '    <h1 class="text-[36px] sm:text-[44px] md:text-[48px] font-bold text-[#EDEDED] tracking-[-0.02em] leading-[1.15] mb-4 font-sans">Series</h1>';
    html += '    <p class="text-[17px] text-[#8B8B8E] leading-relaxed max-w-[620px]">Curated technical collections and deep dives into computing fundamentals.</p>';
    html += '  </header>';

    // Series List: Clean list items with 1px divider, NO bloated cards!
    if (columns.length === 0) {
      html += '<div class="py-20 text-center text-[#5A5A5E] font-mono text-[14px]">No series found.</div>';
    } else {
      html += '<section class="divide-y divide-white/[0.06]">';
      columns.forEach(function(col, idx) {
        var posts = col.posts || [];
        var totalWords = col.totalWords || posts.reduce(function(acc, p) { return acc + (p.words || 0); }, 0);
        var totalMin = Math.max(1, Math.ceil(totalWords / 400));
        var seriesIndex = (idx + 1 < 10) ? '0' + (idx + 1) : (idx + 1);

        html += '  <div class="py-8 group">';
        
        // Metadata Line
        html += '    <div class="flex items-center justify-between text-[12px] font-mono text-[#5A5A5E] mb-2">';
        html += '      <span class="text-[#3B82F6] font-semibold">SERIES ' + seriesIndex + '</span>';
        html += '      <span>' + col.postsCount + ' Parts · ' + (totalWords > 0 ? Math.round(totalWords / 1000) + 'k words · ' : '') + totalMin + ' min read</span>';
        html += '    </div>';
        
        // Title
        html += '    <h2 class="text-[18px] sm:text-[20px] font-semibold text-[#EDEDED] tracking-tight mb-2 leading-snug font-sans">' + col.name + '</h2>';
        
        // Description
        html += '    <p class="text-[14px] text-[#8B8B8E] leading-relaxed mb-4">' + col.desc + '</p>';
        
        // Compact Chapters Timeline
        html += '    <div class="pt-2 divide-y divide-white/[0.03]">';
        posts.forEach(function(p, pIdx) {
          var chNum = (p.order !== undefined && p.order !== 999) ? (p.order < 10 ? '0' + p.order : p.order) : (pIdx + 1 < 10 ? '0' + (pIdx + 1) : (pIdx + 1));
          html += '      <a href="#/post/' + p.id + '" class="py-2 flex items-baseline justify-between gap-3 text-[14px] text-[#8B8B8E] hover:text-[#3B82F6] transition-all group/item hover:translate-x-0.5">';
          html += '        <div class="flex items-baseline gap-2.5 min-w-0">';
          html += '          <span class="font-mono text-[11px] text-[#5A5A5E] group-hover/item:text-[#3B82F6] shrink-0 font-medium">' + chNum + '</span>';
          html += '          <span class="text-[#EDEDED] group-hover/item:text-[#3B82F6] transition-colors truncate leading-relaxed">' + p.title + '</span>';
          html += '        </div>';
          html += '        <span class="font-mono text-[11px] text-[#5A5A5E] shrink-0 ml-2 hidden sm:inline">' + (p.readTime || '') + '</span>';
          html += '      </a>';
        });
        html += '    </div>';

        html += '  </div>';
      });
      html += '</section>';
    }

    html += '</div>';
    container.innerHTML = html;
  },

  // 4. Tags View
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

  // 5. Archive View
  renderArchivesView: function() {
    var container = document.getElementById('app-main');
    var posts = window.BlogStore.posts || [];

    var groups = {};
    posts.forEach(function(p) {
      var year = (p.date || '2026').slice(0, 4);
      if (!groups[year]) groups[year] = [];
      groups[year].push(p);
    });

    var years = Object.keys(groups).sort().reverse();

    var html = '<div class="max-w-[720px] mx-auto pt-16 md:pt-20 pb-20">';
    html += '  <header class="mb-12 pb-6 border-b border-white/[0.06]">';
    html += '    <h1 class="text-[32px] font-bold text-[#EDEDED] tracking-[-0.02em] mb-2 font-sans">Archive</h1>';
    html += '    <p class="text-[16px] text-[#8B8B8E]">Chronological timeline of research essays, architecture notes, and publications.</p>';
    html += '  </header>';

    years.forEach(function(yr) {
      html += '  <div class="mb-12">';
      html += '    <div class="text-[24px] font-mono font-semibold text-[#5A5A5E] mb-6">' + yr + '</div>';
      html += '    <div class="divide-y divide-white/[0.04]">';
      groups[yr].forEach(function(p) {
        html += '      <div class="py-3 flex items-baseline gap-4 group hover:translate-x-0.5 transition-transform">';
        html += '        <span class="text-[13px] font-mono text-[#5A5A5E] shrink-0">' + (p.date || '').slice(5) + '</span>';
        html += '        <a href="#/post/' + p.id + '" class="text-[16px] font-medium text-[#EDEDED] group-hover:text-[#3B82F6] transition-colors leading-snug">' + p.title + '</a>';
        html += '      </div>';
      });
      html += '    </div>';
      html += '  </div>';
    });

    html += '</div>';
    container.innerHTML = html;
  },

  // 6. About View
  renderAboutView: function() {
    var container = document.getElementById('app-main');
    var author = window.BlogStore.author || {};

    var html = '<div class="max-w-[600px] mx-auto pt-16 md:pt-20 pb-20">';
    html += '  <div class="mb-8">';
    html += '    <img src="' + (author.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80') + '" class="w-20 h-20 rounded-[12px] object-cover border border-white/[0.08]">';
    html += '  </div>';

    html += '  <h1 class="text-[28px] font-bold text-[#EDEDED] tracking-[-0.02em] mb-2 font-sans">' + (author.name || 'Alex Chen') + '</h1>';
    html += '  <p class="text-[14px] font-mono text-[#8B8B8E] mb-8">' + (author.title || 'Full-Stack Architect · Quantum & AI Researcher') + '</p>';

    html += '  <div class="text-[16px] text-[#EDEDED] leading-[1.8] space-y-4 mb-10 pb-8 border-b border-white/[0.06] font-sans">';
    html += '    <p>热爱理论物理与计算机科学的交叉前沿。致力于从高维希尔伯特空间、哈密顿量演化与统计力学的物理视角，理解并构建现代大语言模型和复杂分布式系统。</p>';
    html += '    <p>坚持极简主义与深度心流开发，崇尚用严谨的数学推导与干净的代码建立秩序。</p>';
    html += '  </div>';

    html += '  <div>';
    html += '    <h3 class="text-[12px] font-mono uppercase tracking-wider text-[#5A5A5E] mb-4">Connect</h3>';
    html += '    <div class="space-y-3 font-mono text-[14px]">';
    html += '      <a href="https://github.com/flyingpig669" target="_blank" class="flex items-center justify-between py-2 border-b border-white/[0.04] text-[#8B8B8E] hover:text-[#3B82F6] transition-all group">';
    html += '        <span>GitHub</span><span class="group-hover:translate-x-1 transition-transform">github.com/flyingpig669 →</span>';
    html += '      </a>';
    html += '      <a href="https://twitter.com" target="_blank" class="flex items-center justify-between py-2 border-b border-white/[0.04] text-[#8B8B8E] hover:text-[#3B82F6] transition-all group">';
    html += '        <span>Twitter / X</span><span class="group-hover:translate-x-1 transition-transform">@alexchen →</span>';
    html += '      </a>';
    html += '      <a href="mailto:flyingpig06@outlook.com" class="flex items-center justify-between py-2 border-b border-white/[0.04] text-[#8B8B8E] hover:text-[#3B82F6] transition-all group">';
    html += '        <span>Email</span><span class="group-hover:translate-x-1 transition-transform">flyingpig06@outlook.com →</span>';
    html += '      </a>';
    html += '    </div>';
    html += '  </div>';

    html += '</div>';
    container.innerHTML = html;
  },

  // 7. Editor View
  renderEditorView: function() {
    var container = document.getElementById('app-main');
    var html = '<div class="max-w-[720px] mx-auto pt-12 pb-20">';
    html += '  <header class="mb-6 pb-4 border-b border-white/[0.06] flex items-center justify-between">';
    html += '    <h1 class="text-[20px] font-semibold text-[#EDEDED] tracking-tight font-sans">Write Article</h1>';
    html += '    <button onclick="window.BlogApp.publishArticle()" class="linear-btn linear-btn-primary">Publish</button>';
    html += '  </header>';

    html += '  <div class="space-y-4">';
    html += '    <input id="editor-title" type="text" placeholder="Title" class="w-full bg-[#111113] border border-white/[0.08] rounded-[8px] p-3 text-[18px] font-semibold text-[#EDEDED] placeholder-[#5A5A5E] focus:outline-none focus:border-[#3B82F6] transition-colors">';
    html += '    <input id="editor-tags" type="text" placeholder="Tags (comma-separated, e.g. Quantum, Math)" class="w-full bg-[#111113] border border-white/[0.08] rounded-[8px] p-2.5 text-[13px] font-mono text-[#EDEDED] placeholder-[#5A5A5E] focus:outline-none focus:border-[#3B82F6] transition-colors">';
    html += '    <textarea id="editor-content" rows="18" placeholder="Write markdown content with LaTeX formulas... $$\\left|\\psi\\right\\rangle$$" class="w-full bg-[#111113] border border-white/[0.08] rounded-[8px] p-4 text-[14px] font-mono text-[#EDEDED] placeholder-[#5A5A5E] focus:outline-none focus:border-[#3B82F6] transition-colors leading-relaxed"></textarea>';
    html += '  </div>';
    html += '</div>';

    container.innerHTML = html;
  },

  publishArticle: function() {
    var title = (document.getElementById('editor-title').value || '').trim();
    var content = (document.getElementById('editor-content').value || '').trim();
    var tags = (document.getElementById('editor-tags').value || '').split(',').map(function(t) { return t.trim(); }).filter(Boolean);

    if (!title || !content) {
      alert('Please enter title and content.');
      return;
    }

    var id = 'post-' + Date.now();
    var newPost = {
      id: id,
      title: title,
      content: content,
      date: new Date().toISOString().slice(0, 10),
      tags: tags,
      excerpt: content.slice(0, 140) + '...',
      readTime: Math.max(1, Math.ceil(content.length / 400)) + ' min read',
      words: content.length
    };

    window.BlogStore.posts.unshift(newPost);
    window.BlogStore.savePosts();
    window.location.hash = '#/post/' + id;
  },

  setTag: function(tag) {
    this.activeTag = tag;
    window.location.hash = '#/';
    this.renderHomeView();
  },

  clearTag: function() {
    this.activeTag = null;
    this.renderHomeView();
  },

  // Search Modal
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
    var resultsBox = document.getElementById('search-modal-results');
    if (!resultsBox) return;
    var posts = window.BlogStore.posts || [];
    var q = (query || '').toLowerCase().trim();

    var filtered = posts.filter(function(p) {
      if (!q) return true;
      return (p.title || '').toLowerCase().indexOf(q) !== -1 ||
             (p.excerpt || '').toLowerCase().indexOf(q) !== -1 ||
             (p.tags || []).some(function(t) { return t.toLowerCase().indexOf(q) !== -1; });
    }).slice(0, 8);

    if (filtered.length === 0) {
      resultsBox.innerHTML = '<div class="py-8 text-center text-[#5A5A5E] text-[13px] font-mono">No matching records</div>';
      return;
    }

    var html = '';
    filtered.forEach(function(p) {
      html += '<a href="#/post/' + p.id + '" onclick="window.BlogApp.closeSearchModal()" class="block p-2.5 rounded-[6px] hover:bg-white/[0.04] transition-colors group">';
      html += '  <div class="text-[14px] font-medium text-[#EDEDED] group-hover:text-[#3B82F6] transition-colors">' + p.title + '</div>';
      html += '  <div class="text-[11px] font-mono text-[#5A5A5E] mt-0.5">' + p.date + ' · ' + (p.readTime || '') + '</div>';
      html += '</a>';
    });
    resultsBox.innerHTML = html;
  }
};
