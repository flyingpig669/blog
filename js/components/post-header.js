window.BlogPostHeader = {
  render: function(model, services) {
    var post = model.post, columnInfo = model.columnInfo, partNumber = model.partNumber, totalParts = model.totalParts;
    var html = '';
    // 紧凑一体式面包屑导航
    html += '<nav aria-label="Breadcrumb" class="mb-4 flex items-center gap-1.5 text-[12px] font-mono text-muted overflow-x-auto no-scrollbar">';
    html += '  <a href="' + services.routeHref('home') + '" class="text-secondary hover:text-accent transition-colors shrink-0">Writing</a>';
    if (columnInfo) {
      html += '  <span>/</span>';
      html += '  <a href="' + services.columnHref(columnInfo) + '" class="text-secondary hover:text-accent transition-colors truncate max-w-[220px]" title="' + services.escapeHtml(columnInfo.name) + '">' + services.escapeHtml(columnInfo.name) + '</a>';
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
      html += '    <span class="text-primary font-sans truncate">' + services.escapeHtml(columnInfo.name) + '</span>';
      html += '  </div>';
      html += '  <a href="' + services.columnHref(columnInfo) + '" class="text-secondary hover:text-accent transition-colors shrink-0 ml-3 text-[11px]">Series Index →</a>';
      html += '</div>';
    }

    // 文章头部
    html += '<header class="mb-6 pb-4 border-b border-divider">';
    html += '  <h1 class="text-[26px] sm:text-[30px] md:text-[32px] font-bold text-primary tracking-[-0.02em] leading-[1.25] mb-2.5 font-sans">' + services.escapeHtml(post.title) + '</h1>';
    // 文章元信息行: 日期 · 阅读时长 · 字数 · 标签
    html += '  <div class="flex flex-wrap items-center gap-2 text-[12px] font-mono text-muted">';
    html += '    <span>' + services.escapeHtml(post.date) + '</span>';
    if (post.updated && post.updated !== post.date) html += '<span>·</span><span>更新于 ' + services.escapeHtml(post.updated) + '</span>';
    html += '    <span>·</span>';
    html += '    <span>' + services.escapeHtml(post.readTime || '3 min read') + '</span>';
    if (post.words) {
      html += '    <span>·</span>';
      html += '    <span>' + services.formatWordCount(post.words) + '</span>';
    }
    if ((post.tags || []).length > 0) {
      html += '    <span>·</span>';
      html += '    <div class="inline-flex flex-wrap gap-1.5">';
      post.tags.forEach(function(t) {
        html += '      <a href="' + services.tagHref(t) + '" class="text-secondary hover:text-accent transition-colors">#' + services.escapeHtml(t) + '</a>';
      });
      html += '    </div>';
    }
    html += '  </div>';
    html += '</header>';

    return html;
  }
};
