// Pure HTML component; routing/selection are supplied by its caller.
window.BlogPostItem = {
  render: function(post, services) {
    var escape = services.escapeHtml;
    var html = '<article class="post-item group"><div class="post-item-meta"><span>' + escape(post.date || '') + '</span>';
    if (post.readTime) html += '<span>·</span><span>' + escape(post.readTime) + '</span>';
    if (post.kind === 'book') html += '<span>·</span><span>BOOK · ' + escape(String(post.chapterCount)) + ' CHAPTERS</span>';
    if (post.column) html += '<span>·</span><a href="' + escape(services.columnHref(post.column)) + '">' + escape(post.columnName || post.column) + '</a>';
    if (post.pinned && services.showPinned) html += '<span class="post-item-badge">PINNED</span>';
    var href = post.kind === 'book' ? services.columnHref(post.collection) : services.postHref(post);
    html += '</div><h2 class="mb-2"><a class="post-item-title block leading-snug" href="' + escape(href) + '">' + escape(post.title) + '</a></h2>';
    if (post.excerpt) html += '<p class="post-item-excerpt">' + escape(post.excerpt) + '</p>';
    html += '<div class="post-item-tags">';
    (post.tags || []).forEach(function(tag) {
      if (services.selected) {
        html += '<button type="button" class="tag-pill' + (services.selected.has(tag) ? ' is-selected' : '') + '" aria-pressed="' + services.selected.has(tag) + '" data-tag-toggle="' + escape(tag) + '">#' + escape(tag) + '</button>';
      } else html += '<a class="tag-pill" href="' + escape(services.tagHref(tag)) + '">#' + escape(tag) + '</a>';
    });
    return html + '</div></article>';
  }
};
