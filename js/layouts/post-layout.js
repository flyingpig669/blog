window.BlogPostLayout = {
  render: function(model, services) {
    model.hasSidebar = model.features.outlineSidebar !== false && ((model.columnInfo && model.colPosts.length > 1) || model.toc.length > 0);
    var html = '<div class="shell-detail mx-auto px-4 sm:px-6 pt-8 md:pt-10 pb-16 flex justify-between items-start gap-6 lg:gap-10 relative">';
    html += '<div class="flex-1 max-w-[680px] min-w-0">';
    html += window.BlogPostHeader.render(model, services);
    html += window.BlogPostContent.render(model, services);
    html += window.BlogPostAdjacent.render(model, services);
    html += '</div>';
    html += window.BlogPostOutline.desktop(model, services);
    html += '</div>';
    html += window.BlogPostOutline.mobile(model, services);
    return html;
  }
};
