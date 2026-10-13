window.BlogPostOutline = {
  desktop: function(model, services) {
    var post = model.post, toc = model.toc, columnInfo = model.columnInfo, colPosts = model.colPosts;
    var html = '';
    // 右侧列: 常驻悬浮 Outline 侧边栏 (屏幕宽度 >= 600px 自动展开)
    // 包含系列专栏全景章节 (如有) 与当前文章大纲，大幅提升信息密度
    var hasSidebar = model.hasSidebar;
    if (hasSidebar) {
      html += '<aside class="outline-floating-sidebar toc-floating-sidebar w-[200px] lg:w-[230px] shrink-0 sticky top-20 font-mono text-[12px]">';
      
      // 如果属于专栏：呈现本专栏的完整章节速览
      if (columnInfo && colPosts.length > 1) {
        html += '<div class="mb-5 pb-4 border-b border-divider">';
        html += '  <div class="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-accent font-semibold mb-2">';
        html += '    <span>Series Chapters</span>';
        html += '    <a href="' + services.columnHref(columnInfo) + '" class="text-muted hover:text-accent transition-colors">Index →</a>';
        html += '  </div>';
        html += '  <div class="space-y-1 max-h-[190px] overflow-y-auto no-scrollbar pr-1">';
        colPosts.forEach(function(cp, cidx) {
          var isCurrent = (cp.id && post.id && cp.id === post.id) || cp.slug === post.slug;
          var cOrder = cp.order ? (cp.order < 10 ? '0' + cp.order : cp.order) : ('0' + (cidx + 1));
          var linkClass = isCurrent 
            ? 'bg-accent/10 text-accent font-medium border-l-2 border-accent pl-2 py-1'
            : 'text-secondary hover:text-primary pl-2.5 py-1 border-l border-divider hover:border-white/[0.2]';
          html += '  <a href="' + services.postHref(cp) + '" class="flex items-baseline gap-2 text-[11.5px] transition-all block truncate ' + linkClass + '" title="' + services.escapeHtml(cp.title) + '">';
          html += '    <span class="text-[10px] shrink-0 font-mono opacity-80">' + cOrder + '</span>';
          html += '    <span class="truncate">' + services.escapeHtml(cp.title) + '</span>';
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
          var escapedTitle = services.escapeHtml(item.text);
          html += '  <div class="toc-item">';
          html += '    <button type="button" data-outline-target="' + item.id + '" data-target="' + item.id + '" data-level="' + item.level + '" class="outline-nav-btn text-left w-full block ' + indentClass + ' hover:text-accent transition-colors truncate leading-relaxed cursor-pointer bg-transparent border-none p-0 py-0.5" title="' + escapedTitle + '">';
          html += services.escapeHtml(item.text);
          html += '    </button>';
          html += '  </div>';
        });
        html += '  </nav>';
      }
      html += '</aside>';
    }

    return html;
  },
  mobile: function(model, services) {
    var post = model.post, toc = model.toc, columnInfo = model.columnInfo, colPosts = model.colPosts;
    var html = '';
    var hasSidebar = model.hasSidebar;
    // 小屏浮动胶囊 (# Outline) 与侧滑抽屉 (< 600px)
    if (hasSidebar) {
      html += '<div class="outline-floating-fab toc-floating-fab">';
      html += '  <button type="button" data-outline-toggle aria-controls="mobile-outline-drawer" aria-expanded="false" class="fixed right-5 bottom-20 z-40 px-3 py-2 rounded-full bg-surface/90 backdrop-blur-md border border-white/[0.12] text-[12px] font-mono text-primary shadow-xl hover:border-accent flex items-center gap-1.5 cursor-pointer" title="Outline & Chapters">';
      html += '    <span class="text-accent">#</span>';
      html += '    <span>Outline</span>';
      html += '  </button>';
      html += '  <div id="mobile-outline-drawer" class="fixed top-14 bottom-0 right-0 w-[280px] max-w-[85vw] bg-page/95 backdrop-blur-xl border-l border-subtle z-50 p-5 transform translate-x-full transition-transform duration-180 overflow-y-auto hidden">';
      html += '    <div class="flex items-center justify-between pb-3 border-b border-divider mb-3">';
      html += '      <span class="text-[12px] font-mono uppercase tracking-wider text-muted">Outline & Chapters</span>';
      html += '      <button type="button" data-outline-toggle aria-label="关闭目录" class="text-secondary hover:text-primary text-[16px] cursor-pointer">✕</button>';
      html += '    </div>';

      if (columnInfo && colPosts.length > 1) {
        html += '<div class="mb-4 pb-3 border-b border-divider">';
        html += '  <div class="text-[11px] font-mono text-accent mb-2 uppercase tracking-wider font-semibold">Series Chapters</div>';
        html += '  <div class="space-y-1 font-mono text-[12px]">';
        colPosts.forEach(function(cp, cidx) {
          var isCur = (cp.id && post.id && cp.id === post.id) || cp.slug === post.slug;
          var ord = cp.order ? (cp.order < 10 ? '0' + cp.order : cp.order) : ('0' + (cidx + 1));
          html += '<a href="' + services.postHref(cp) + '" data-outline-toggle class="block py-1 truncate ' + (isCur ? 'text-accent font-semibold' : 'text-secondary') + '">';
          html += '  <span class="opacity-60 mr-1.5">' + ord + '</span>' + services.escapeHtml(cp.title);
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
          var escapedTitle = services.escapeHtml(item.text);
          html += '      <button type="button" data-outline-target="' + item.id + '" class="outline-nav-btn text-left w-full block ' + indent + ' hover:text-accent transition-colors truncate cursor-pointer bg-transparent border-none p-0 py-0.5 leading-relaxed" title="' + escapedTitle + '">' + services.escapeHtml(item.text) + '</button>';
        });
        html += '    </nav>';
      }
      html += '  </div>';
      html += '</div>';
    }

    return html;
  }
};
