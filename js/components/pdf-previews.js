// Shared, click-to-load previews: listing attachments does not fetch PDF.js or PDFs.
window.BlogPdfPreviews = {
  placeholder: function(mount, error) {
    var html = window.BlogHtml;
    var url = html.safeUrl(mount.getAttribute('data-slide-url'), true);
    if (!url) return;
    var title = mount.getAttribute('data-slide-title') || 'PDF';
    mount.setAttribute('data-pdf-state', 'idle');
    mount.innerHTML = '<div class="linear-card p-4">' +
      '<h3 class="text-[15px] font-semibold text-primary mb-3">' + html.escapeHtml(title) + '</h3>' +
      (error ? '<p class="text-[13px] text-secondary mb-3" role="status">PDF 播放器加载失败，请重试。</p>' : '') +
      '<div class="flex flex-wrap items-center gap-3">' +
      '<button type="button" class="btn-secondary" data-pdf-open>' + (error ? '重试预览' : '预览 PDF') + '</button>' +
      '<a class="text-[13px] text-secondary hover:text-accent transition-colors" href="' + html.escapeHtml(url) + '" download>下载 PDF</a>' +
      '</div></div>';
  },

  open: function(mount, services) {
    if (!mount || !mount.isConnected || mount.getAttribute('data-pdf-state') !== 'idle') return;
    var self = this;
    var revision = services.getRevision();
    mount.setAttribute('data-pdf-state', 'loading');
    var button = mount.querySelector('[data-pdf-open]');
    button.disabled = true;
    button.textContent = '正在加载…';
    services.ensureViewer(function(error) {
      if (!mount.isConnected || services.getRevision() !== revision) return;
      if (error) { self.placeholder(mount, error); return; }
      mount.setAttribute('data-pdf-state', 'loaded');
      services.mountViewer(mount, {
        url: mount.getAttribute('data-slide-url'),
        title: mount.getAttribute('data-slide-title') || 'PDF'
      });
    });
  },

  prepare: function(container, post, services) {
    var self = this;
    container.querySelectorAll('.article-slide-player-mount').forEach(function(mount) {
      if (mount.getAttribute('data-slide-primary') !== '1' && post.slideExplicit &&
          post.slide && mount.getAttribute('data-slide-url') === post.slide) {
        mount.remove();
        return;
      }
      self.placeholder(mount);
    });
    if (container.getAttribute('data-pdf-previews-bound') === '1') return;
    container.setAttribute('data-pdf-previews-bound', '1');
    container.addEventListener('click', function(event) {
      var button = event.target.closest('[data-pdf-open]');
      if (button && container.contains(button)) self.open(button.closest('.article-slide-player-mount'), services);
    });
  }
};
