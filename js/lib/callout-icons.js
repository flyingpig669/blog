// Lucide SVG Icons — 仅保留当前被实际使用的图标。
// 使用方：js/markdown.js 的 Callout 提示框（tip / note / warning / danger）。
// 需要新图标时，按同样的 key/路径格式补充即可（图标路径取自 Lucide）。
window.BlogIcons = {
  get(name, className = 'w-5 h-5', options = {}) {
    const strokeWidth = options.strokeWidth || 2;
    const paths = {
      'info': '<circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path>',
      'alert-triangle': '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" x2="12" y1="9" y2="13"></line><line x1="12" x2="12.01" y1="17" y2="17"></line>',
      'check-circle-2': '<circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path>'
    };

    const inner = paths[name] || paths['info'];
    return '<svg xmlns="http://www.w3.org/2000/svg" class="' + className + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + strokeWidth + '" stroke-linecap="round" stroke-linejoin="round">' + inner + '</svg>';
  }
};
