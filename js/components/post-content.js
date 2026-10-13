window.BlogPostContent = {
  render: function(model, services) {
    var post = model.post, renderedHtml = model.renderedHtml;
    var html = '';
    // FrontMatter 声明的幻灯片（方式 B）：课件固定挂在页头之下、正文之上。
    // 规则（2026-10-11 调整）：FrontMatter 显式声明的 slide 永远在顶部挂载；正文若也
    // 内嵌了同一份 ::: slide，那个挂载点会在实例化阶段被剔除，同一份 PDF 不出现两个播放器。
    // 此前这里是「正文有 ::: slide 就整段跳过」—— 作者两处都写时 FrontMatter 被静默忽略，
    // 看起来像没生效。注意：FrontMatter 未写时 sync_posts.py 会从正文第一条 ::: slide 反向
    // 提取 slide 字段（slideExplicit=false），那种情况仍以正文书写位置为准，不挂顶。
    if (post.slide && (post.slideExplicit || renderedHtml.indexOf('article-slide-player-mount') === -1)) {
      html += '<div class="article-slide-player-mount my-8" data-slide-primary="1" data-slide-url="' + services.escapeHtml(post.slide) + '" data-slide-title="' + services.escapeHtml(post.title || '') + '"></div>';
    }

    // Markdown 正文 (正文内部可能包含一处或多处 ::: slide 演示文稿)
    html += '<article class="markdown-body mb-12">';
    html += renderedHtml;
    html += '</article>';

    // FrontMatter 声明的下载类附件 (attachments: ["attachments/xxx.zip"])
    if (Array.isArray(post.attachments) && post.attachments.length > 0) {
      html += '<section class="mb-12 py-4 px-4 rounded-[6px] bg-surface border border-subtle">';
      html += '  <div class="text-[11px] font-mono uppercase tracking-wider text-muted mb-3">Attachments (' + post.attachments.length + ')</div>';
      html += '  <div class="space-y-2">';
      post.attachments.forEach(function(file) {
        var fileName = String(file).split('/').pop();
        html += '    <a href="' + services.escapeHtml(file) + '" download class="flex items-center gap-2 text-[13.5px] text-secondary hover:text-accent transition-colors">';
        html += '      <span class="text-accent font-mono text-[11px] shrink-0">&darr;</span>';
        html += '      <span class="truncate">' + services.escapeHtml(fileName) + '</span>';
        html += '    </a>';
      });
      html += '  </div>';
      html += '</section>';
    }

    if (post.attachmentPreviews) html += window.BlogPdfPreviews.officeMarkup(post);

    return html;
  }
};
