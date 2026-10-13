window.BlogPagination = {
  render: function(page, services) {
    if (page.pageCount <= 1) return '';
    var escape = services.escapeHtml;
    function href(number) { return services.routeHref('home') + (number > 1 ? '?page=' + number : ''); }
    var html = '<nav class="pagination" aria-label="首页分页">';
    html += page.page > 1 ? '<a class="btn-secondary" rel="prev" href="' + escape(href(page.page - 1)) + '">← 上一页</a>' : '<span></span>';
    html += '<span class="font-mono text-muted text-[12px]" aria-live="polite">' + page.page + ' / ' + page.pageCount + '</span>';
    html += page.page < page.pageCount ? '<a class="btn-secondary" rel="next" href="' + escape(href(page.page + 1)) + '">下一页 →</a>' : '<span></span>';
    return html + '</nav>';
  }
};
