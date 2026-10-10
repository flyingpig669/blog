// Markdown Parser with KaTeX, Prism Highlighting, Callouts, and Robust TOC
window.BlogMarkdown = {
  render: function(markdownText, options) {
    options = options || {};
    if (!markdownText) return { html: '', toc: [] };

    var escapeHtml = function(value) {
      return String(value == null ? '' : value).replace(/[&<>"']/g, function(char) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
      });
    };

    var mathBlocks = [];
    var mathInlines = [];
    var text = markdownText;

    // 1. Pre-process Math formulas using safe %% tokens
    // 1.1 Support explicit inline math \( ... \)
    text = text.replace(/\\\((.+?)\\\)/g, function(match, formula) {
      var id = '%%MATH_INLINE_' + mathInlines.length + '%%';
      mathInlines.push(formula.trim());
      return id;
    });

    // 1.2 Standalone block math $$ ... $$ (on its own lines or containing newlines)
    text = text.replace(/(?:^|[\r\n])[ \t]*\$\$[ \t]*[\r\n]+([\s\S]+?)[\r\n]+[ \t]*\$\$(?=[ \t]*(?:[\r\n]|$))/g, function(match, formula) {
      var id = '\n\n%%MATH_BLOCK_' + mathBlocks.length + '%%\n\n';
      mathBlocks.push(formula.trim());
      return id;
    });

    // 1.3 Any remaining $$ ... $$
    text = text.replace(/\$\$([\s\S]+?)\$\$/g, function(match, formula) {
      if (formula.indexOf('\n') !== -1 || formula.indexOf('\r') !== -1) {
        var id = '\n\n%%MATH_BLOCK_' + mathBlocks.length + '%%\n\n';
        mathBlocks.push(formula.trim());
        return id;
      } else {
        var id = '%%MATH_INLINE_' + mathInlines.length + '%%';
        mathInlines.push(formula.trim());
        return id;
      }
    });

    // 2. Pre-process Callout blocks
    var calloutRegex = new RegExp('::: *(tip|warning|note|danger) *([^\\n]*)[\\r\\n]+([\\s\\S]*?):::', 'g');
    text = text.replace(calloutRegex, function(match, type, title, content) {
      var titles = { tip: '提示 (Tip)', warning: '注意 (Warning)', note: '笔记 (Note)', danger: '警示 (Danger)' };
      var displayTitle = (title || '').trim() || titles[type] || '提示';
      var icons = { tip: 'check-circle-2', warning: 'alert-triangle', note: 'info', danger: 'alert-triangle' };
      var iconName = icons[type] || 'info';
      var iconSvg = window.BlogIcons ? window.BlogIcons.get(iconName, 'callout-icon text-current') : '';
      return '<div class="callout callout-' + type + '">' +
        iconSvg +
        '<div class="callout-body">' +
          '<div class="callout-title">' + displayTitle + '</div>' +
          '<div class="callout-content">' + content.trim() + '</div>' +
        '</div>' +
      '</div>';
    });

    // 2.1 Pre-process Slide Deck / PDF Presentation blocks (挂载至专属高保真播放器)
    var slideRegex = /:::\s*(slide|pdf|deck)\s+([^\s\r\n]+)(?:[^\S\r\n]+([^\r\n]*))?[\r\n]+([\s\S]*?):::/gi;
    text = text.replace(slideRegex, function(match, type, url, title, desc) {
      var slideTitle = (title || '').trim() || (desc || '').trim() || 'Presentation Deck (PPT / PDF)';
      var slideDesc = (desc || '').trim();
      var cleanUrl = (url || '').trim();
      var escapedTitle = slideTitle.replace(/"/g, '&quot;');
      var escapedDesc = slideDesc ? slideDesc.replace(/"/g, '&quot;') : '';
      return '<div class="article-slide-player-mount my-8" data-slide-url="' + cleanUrl + '" data-slide-title="' + escapedTitle + '"' + (escapedDesc ? ' data-slide-desc="' + escapedDesc + '"' : '') + '></div>';
    });

    // 3. Marked.js parsing
    var markedParser = (typeof marked !== 'undefined') ? marked : (window.marked || null);
    if (markedParser && markedParser.setOptions) {
      markedParser.setOptions({ gfm: true, breaks: true, headerIds: false, mangle: false });
    }
    var rawHtml = markedParser ? markedParser.parse(text) : text;

    // 4. Restore and Render KaTeX Math using safe split/join
    var katexRenderer = (typeof katex !== 'undefined') ? katex : (window.katex || null);
    if (katexRenderer) {
      mathBlocks.forEach(function(formula, i) {
        try {
          var rendered = katexRenderer.renderToString(formula, { displayMode: true, throwOnError: false });
          rawHtml = rawHtml.split('%%MATH_BLOCK_' + i + '%%').join('<div class="quantum-math-block">' + rendered + '</div>');
        } catch (e) {
          rawHtml = rawHtml.split('%%MATH_BLOCK_' + i + '%%').join('<pre class="text-[#8B8B8E] font-mono text-xs">' + escapeHtml(formula) + '</pre>');
        }
      });

      mathInlines.forEach(function(formula, i) {
        try {
          var rendered = katexRenderer.renderToString(formula, { displayMode: false, throwOnError: false });
          rawHtml = rawHtml.split('%%MATH_INLINE_' + i + '%%').join(rendered);
        } catch (e) {
          rawHtml = rawHtml.split('%%MATH_INLINE_' + i + '%%').join('<code class="text-[#8B8B8E] font-mono text-xs">' + escapeHtml(formula) + '</code>');
        }
      });
    } else {
      mathBlocks.forEach(function(formula, i) {
        rawHtml = rawHtml.split('%%MATH_BLOCK_' + i + '%%').join('<div class="quantum-math-block"><pre class="font-mono text-xs">' + escapeHtml(formula) + '</pre></div>');
      });
      mathInlines.forEach(function(formula, i) {
        rawHtml = rawHtml.split('%%MATH_INLINE_' + i + '%%').join('<code class="font-mono text-xs">' + escapeHtml(formula) + '</code>');
      });
    }

    // 5. Post-process HTML for Stable Section IDs, Clean TOC, and Code Blocks
    if (typeof document !== 'undefined') {
      var tempDiv = document.createElement('div');
      tempDiv.innerHTML = rawHtml;

      // 统一标题层级追踪配置 (优先级: 单篇 FrontMatter tocLevels > 全局 BlogConfig.tocLevels > 默认 [2, 3, 4])
      var targetLevels = (options && options.tocLevels !== undefined && options.tocLevels !== null) 
        ? options.tocLevels 
        : ((window.BlogConfig && window.BlogConfig.features && window.BlogConfig.features.tocLevels) || [2, 3, 4]);

      if (typeof targetLevels === 'string') {
        targetLevels = targetLevels.replace(/[\[\]]/g, '').split(',').map(function(s) { return parseInt(s.trim(), 10); }).filter(Boolean);
      }
      if (!Array.isArray(targetLevels)) {
        targetLevels = [2, 3, 4];
      }

      var toc = [];
      if (targetLevels.length > 0) {
        var headingSelector = targetLevels.map(function(lvl) { return 'h' + lvl; }).join(', ');
        var headings = tempDiv.querySelectorAll(headingSelector);
        headings.forEach(function(h, index) {
          var headingText = h.textContent.trim();
          var id = 'section-' + (index + 1);
          h.setAttribute('id', id);
          h.classList.add('scroll-mt-20');
          var level = parseInt(h.tagName.substring(1), 10);
          toc.push({ id: id, text: headingText, level: level });
        });
      }

      var pres = tempDiv.querySelectorAll('pre');
      pres.forEach(function(pre) {
        var code = pre.querySelector('code');
        var rawCodeText = code ? code.textContent : pre.textContent;
        var language = 'text';

        if (code && code.className) {
          var langMatch = code.className.match(/language-([a-z0-9_-]+)/i);
          if (langMatch) language = langMatch[1].toLowerCase();
        }

        var prismHighlighter = (typeof Prism !== 'undefined') ? Prism : (window.Prism || null);
        if (prismHighlighter && code) {
          var prismLang = prismHighlighter.languages[language] || prismHighlighter.languages.javascript;
          if (prismLang) {
            code.innerHTML = prismHighlighter.highlight(rawCodeText, prismLang, language);
          }
        }

        var container = document.createElement('div');
        container.className = 'code-container my-6 shadow-sm';

        var header = document.createElement('div');
        header.className = 'code-header flex justify-between items-center';
        header.innerHTML = '<span class="font-mono text-xs uppercase tracking-wider text-[#5A5A5E]">' + language + '</span>' +
          '<button type="button" class="code-copy-btn" data-code="' + encodeURIComponent(rawCodeText) + '">' +
            '<span>Copy</span>' +
          '</button>';

        pre.parentNode.insertBefore(container, pre);
        container.appendChild(header);
        container.appendChild(pre);
      });

      return { html: tempDiv.innerHTML, toc: toc };
    }

    return { html: rawHtml, toc: [] };
  }
};
