// Index pages reuse sanitized Markdown, link resolution, and delegated outline navigation.
window.BlogIndexPage = {
  render: function(post, result, services) {
    var escape = services.escapeHtml;
    var html = '<div class="shell mx-auto px-4 sm:px-6 pt-16 md:pt-20 pb-20 index-page">';
    html += '<header class="mb-10 pb-6 border-b border-divider">';
    html += '<div class="index-eyebrow">INDEX <span>/</span> <span>' + escape(post.date || '') + '</span></div>';
    html += '<h1 class="text-[32px] sm:text-[36px] font-bold text-primary tracking-[-0.02em] leading-[1.15] mb-2 font-sans">' + escape(post.title) + '</h1>';
    if (post.excerpt) html += '<p class="text-[16px] text-secondary leading-relaxed">' + escape(post.excerpt) + '</p>';
    html += '<div class="index-summary"><span><span data-index-section-count>0</span> SECTIONS</span><span><span data-index-link-count>0</span> LINKS</span></div>';
    html += '</header>';
    html += '<nav class="index-section-nav tag-cloud mb-8" aria-label="索引分组" data-index-sections></nav>';
    html += '<article class="markdown-body index-content">' + result.html + '</article>';
    if (post.attachmentPreviews) html += window.BlogPdfPreviews.officeMarkup(post);
    html += '</div>';
    return html;
  },

  enhance: function(container) {
    var content = container.querySelector('.index-content');
    if (!content) return;
    // The page header already supplies its title; a leading Markdown h1 is redundant.
    if (content.firstElementChild && content.firstElementChild.tagName === 'H1') content.firstElementChild.remove();
    var headings = Array.from(content.children).filter(function(node) { return node.tagName === 'H2'; });
    var navigation = container.querySelector('[data-index-sections]');
    headings.forEach(function(heading, index) {
      heading.classList.add('index-section-heading');
      heading.setAttribute('data-section-number', String(index + 1).padStart(2, '0'));
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'tag-pill';
      button.setAttribute('data-outline-target', heading.id);
      var label = heading.cloneNode(true);
      label.querySelectorAll('button').forEach(function(node) { node.remove(); });
      button.textContent = label.textContent.trim();
      navigation.appendChild(button);
    });
    navigation.hidden = headings.length === 0;
    Array.from(content.children).forEach(function(list) {
      if (list.tagName !== 'UL' && list.tagName !== 'OL') return;
      Array.from(list.children).forEach(function(item, index) {
        if (!item.querySelector('a[href]')) return;
        list.classList.add('index-link-list');
        item.classList.add('index-entry');
        var body = document.createElement('div');
        body.className = 'index-entry-content';
        while (item.firstChild) body.appendChild(item.firstChild);
        var number = document.createElement('span');
        number.className = 'index-entry-number';
        number.textContent = String(index + 1).padStart(2, '0');
        number.setAttribute('aria-hidden', 'true');
        var arrow = document.createElement('span');
        arrow.className = 'index-entry-arrow';
        arrow.textContent = '↗';
        arrow.setAttribute('aria-hidden', 'true');
        item.appendChild(number);
        item.appendChild(body);
        item.appendChild(arrow);
      });
    });
    container.querySelector('[data-index-section-count]').textContent = headings.length;
    container.querySelector('[data-index-link-count]').textContent = content.querySelectorAll('a[href]').length;
    // Retain paragraphs, formulas, tables, and non-link lists without special parsing.
  }
};
