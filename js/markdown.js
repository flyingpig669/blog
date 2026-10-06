// Markdown Parser with KaTeX, Prism Syntax Highlighting, Callouts, and TOC
window.BlogMarkdown = {
  render: function(markdownText) {
    if (!markdownText) return { html: '', toc: [] };

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
      var titles = { tip: '提示 (Tip)', warning: '注意 (Warning)', note: '笔记 (Note)', danger: '危险 (Danger)' };
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

    // 3. Marked.js parsing
    var markedParser = (typeof marked !== 'undefined') ? marked : (window.marked || null);
    if (markedParser && markedParser.setOptions) {
      markedParser.setOptions({ gfm: true, breaks: true, headerIds: true, mangle: false });
    }
    var rawHtml = markedParser ? markedParser.parse(text) : text;

    // 4. Restore and Render KaTeX Math
    var katexRenderer = (typeof katex !== 'undefined') ? katex : (window.katex || null);
    if (katexRenderer) {
      mathBlocks.forEach(function(formula, i) {
        try {
          var rendered = katexRenderer.renderToString(formula, { displayMode: true, throwOnError: false });
          rawHtml = rawHtml.replace('%%MATH_BLOCK_' + i + '%%', '<div class="quantum-math-block">' + rendered + '</div>');
        } catch (e) {
          rawHtml = rawHtml.replace('%%MATH_BLOCK_' + i + '%%', '<pre class="text-red-500 font-mono text-xs">' + formula + '</pre>');
        }
      });

      mathInlines.forEach(function(formula, i) {
        try {
          var rendered = katexRenderer.renderToString(formula, { displayMode: false, throwOnError: false });
          rawHtml = rawHtml.replace('%%MATH_INLINE_' + i + '%%', rendered);
        } catch (e) {
          rawHtml = rawHtml.replace('%%MATH_INLINE_' + i + '%%', '<code class="text-red-500 font-mono text-xs">' + formula + '</code>');
        }
      });
    }

    // 5. Post-process HTML for TOC and Code containers
    if (typeof document !== 'undefined') {
      var tempDiv = document.createElement('div');
      tempDiv.innerHTML = rawHtml;

      var toc = [];
      var headings = tempDiv.querySelectorAll('h1, h2, h3');
      headings.forEach(function(h, index) {
        var headingText = h.textContent.trim();
        var id = 'heading-' + index + '-' + headingText.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-').slice(0, 30);
        h.setAttribute('id', id);
        var level = parseInt(h.tagName.substring(1), 10);
        toc.push({ id: id, text: headingText, level: level });
      });

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
        container.className = 'code-container my-5 shadow-sm';

        var header = document.createElement('div');
        header.className = 'code-header flex justify-between items-center';
        header.innerHTML = '<span class="font-mono text-xs text-slate-400 uppercase tracking-wider">' + language + '</span>' +
          '<button type="button" class="code-copy-btn" data-code="' + encodeURIComponent(rawCodeText) + '">' +
            (window.BlogIcons ? window.BlogIcons.get('copy', 'w-3.5 h-3.5') : '') +
            '<span>复制</span>' +
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
