window.BlogHtml = {
  escapeHtml: function(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function(char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  },
  safeUrl: function(value, resource) {
    var url = String(value == null ? '' : value).trim();
    if (!url || /[\u0000-\u0020\u007f]/.test(url) || /^(?:javascript|vbscript|data|file|blob):/i.test(url)) return '';
    if (/^[a-z][a-z0-9+.-]*:/i.test(url) && !(resource ? /^https?:/i : /^(https?:|mailto:|tel:)/i).test(url)) return '';
    return url;
  },
  highlight: function(value, query) {
    var text = String(value || '');
    var q = String(query || '').trim();
    if (!q) return this.escapeHtml(text);
    var result = '', cursor = 0, index;
    while ((index = text.toLowerCase().indexOf(q.toLowerCase(), cursor)) !== -1) {
      result += this.escapeHtml(text.slice(cursor, index)) + '<mark class="search-highlight">' + this.escapeHtml(text.slice(index, index + q.length)) + '</mark>';
      cursor = index + q.length;
    }
    return result + this.escapeHtml(text.slice(cursor));
  }
};
