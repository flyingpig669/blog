window.BlogPostAdjacent = {
  render: function(model, services) {
    var post = model.post, columnInfo = model.columnInfo, colPosts = model.colPosts, prevPost = model.prevPost, nextPost = model.nextPost, prevLabel = model.prevLabel, nextLabel = model.nextLabel, colIndex = model.colIndex;
    var html = '';
    // 上一篇 / 下一篇导航（专栏内为章节导航，普通文章为相邻文章）
    html += '<div class="pt-6 border-t border-divider space-y-3">';
    if (columnInfo && colPosts.length > 0) {
      var currentDisplayPart = colIndex !== -1 ? (colIndex + 1) : (post.order || 1);
      html += '<div class="flex items-center justify-between text-[11px] font-mono text-muted">';
      html += '  <span class="text-accent font-medium">SERIES · Chapter ' + currentDisplayPart + ' of ' + colPosts.length + ' in ' + services.escapeHtml(columnInfo.name) + '</span>';
      html += '  <a href="' + services.columnHref(columnInfo) + '" class="hover:text-accent transition-colors">All ' + colPosts.length + ' Chapters →</a>';
      html += '</div>';
    }
    html += '<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">';
    if (prevPost) {
      html += '<a href="' + services.postHref(prevPost) + '" class="linear-card p-3.5 text-left group block">';
      html += '  <div class="text-[10px] font-mono text-muted mb-1 flex items-center gap-1.5">';
      html += '    <span>' + prevLabel + '</span>';
      if (columnInfo) html += '<span class="text-accent">IN SERIES</span>';
      html += '  </div>';
      html += '  <div class="text-[13.5px] font-medium text-primary group-hover:text-accent transition-colors line-clamp-1">' + services.escapeHtml(prevPost.title) + '</div>';
      html += '</a>';
    } else {
      html += '<div class="linear-card p-3.5 text-left opacity-35 border-dashed border-white/[0.04]">';
      html += '  <div class="text-[10px] font-mono text-muted mb-1">' + (columnInfo ? 'SERIES START' : 'FIRST ARTICLE') + '</div>';
      html += '  <div class="text-[12px] text-muted">No earlier chapters.</div>';
      html += '</div>';
    }

    if (nextPost) {
      html += '<a href="' + services.postHref(nextPost) + '" class="linear-card p-3.5 text-right group block">';
      html += '  <div class="text-[10px] font-mono text-muted mb-1 flex items-center justify-end gap-1.5">';
      if (columnInfo) html += '<span class="text-accent">IN SERIES</span>';
      html += '    <span>' + nextLabel + '</span>';
      html += '  </div>';
      html += '  <div class="text-[13.5px] font-medium text-primary group-hover:text-accent transition-colors line-clamp-1">' + services.escapeHtml(nextPost.title) + '</div>';
      html += '</a>';
    } else {
      html += '<div class="linear-card p-3.5 text-right opacity-35 border-dashed border-white/[0.04]">';
      html += '  <div class="text-[10px] font-mono text-muted mb-1">' + (columnInfo ? 'SERIES COMPLETED' : 'LATEST ARTICLE') + '</div>';
      html += '  <div class="text-[12px] text-muted">Reached the final chapter.</div>';
      html += '</div>';
    }
    html += '</div>';
    html += '</div>';

    return html;
  }
};
