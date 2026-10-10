// Markdown Parser with KaTeX, Prism Highlighting, Callouts, and Robust TOC
window.BlogMarkdown = {
  render: function(markdownText, options) {
    options = options || {};
    if (!markdownText) return { html: '', toc: [] };

    // 功能开关统一取自 blog.config.js 的 features，确保 mathKaTeX / codeHighlight 真正生效
    var features = (window.BlogStore && window.BlogStore.config && window.BlogStore.config.features)
      || (window.BlogConfig && window.BlogConfig.features) || {};

    var escapeHtml = function(value) {
      return String(value == null ? '' : value).replace(/[&<>"']/g, function(char) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
      });
    };

    var mathBlocks = [];
    var mathInlines = [];
    var text = String(markdownText).replace(/\r\n?/g, '\n');

    // 先保护代码，再做公式、Callout 和 PDF 预处理；代码中的语法必须原样保留。
    var codeLiterals = [];
    var protectCode = function(literal) {
      var token = 'AURORACODELITERAL' + codeLiterals.length + 'END';
      while (markdownText.indexOf(token) !== -1) token += 'X';
      codeLiterals.push({ token: token, raw: literal });
      return token;
    };
    var fencedStart = /^ {0,3}(?:>[ \t]*)*(`{3,}|~{3,})[^\n]*(?:\n|$)/gm;
    var match;
    var cursor = 0;
    var protectedText = '';
    while ((match = fencedStart.exec(text)) !== null) {
      var fence = match[1];
      var endPattern = new RegExp('^ {0,3}(?:>[ \\t]*)*' + fence.charAt(0) + '{' + fence.length + ',}[ \\t]*(?:\\n|$)', 'gm');
      endPattern.lastIndex = fencedStart.lastIndex;
      var closing = endPattern.exec(text);
      var end = closing ? endPattern.lastIndex : text.length;
      protectedText += text.slice(cursor, match.index) + protectCode(text.slice(match.index, end)) + '\n';
      cursor = end;
      fencedStart.lastIndex = end;
    }
    text = protectedText + text.slice(cursor);
    // 缩进代码块与任意长度反引号包裹的行内代码。
    text = text.replace(/^(?:(?: {4}|\t)[^\n]*(?:\n|$))+/gm, protectCode);
    text = text.replace(/(`+)([\s\S]*?)\1(?!`)/g, protectCode);

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
          '<div class="callout-title">' + escapeHtml(displayTitle) + '</div>' +
          '<div class="callout-content">' + content.trim() + '</div>' +
        '</div>' +
      '</div>';
    });

    // 2.1 Pre-process Slide Deck / PDF Presentation blocks (挂载至专属高保真播放器)
    var slideRegex = /:::\s*(slide|pdf|deck)\s+([^\s\r\n]+)(?:[^\S\r\n]+([^\r\n]*))?[\r\n]+([\s\S]*?):::/gi;
    text = text.replace(slideRegex, function(match, type, url, title, desc) {
      // 同一行 URL 之后的文字 = 标题；紧随其后的整行文字 = 补充说明。
      // 未给行内标题时借用说明文字充当标题，此时不再重复输出说明，
      // 避免 title 与 desc 取到同一字符串（历史问题）。
      var inlineTitle = (title || '').trim();
      var bodyText = (desc || '').trim();
      var slideTitle = inlineTitle || bodyText || 'Presentation Deck (PPT / PDF)';
      var cleanUrl = (url || '').trim();
      // 两个属性值都来自正文，必须转义后再拼接（escapeHtml 会先处理 & ，避免实体被二次解析）
      return '<div class="article-slide-player-mount my-8" data-slide-url="' + escapeHtml(cleanUrl) + '" data-slide-title="' + escapeHtml(slideTitle) + '"></div>';
    });

    // 3. Marked.js parsing
    codeLiterals.forEach(function(item) {
      text = text.split(item.token).join(item.raw);
    });
    var markedParser = (typeof marked !== 'undefined') ? marked : (window.marked || null);
    if (markedParser && markedParser.setOptions) {
      // 注：headerIds / mangle 已在 marked v5+ 移除，标题 id 由下方 TOC 流程统一生成
      markedParser.setOptions({ gfm: true, breaks: true });
    }
    var rawHtml = markedParser ? markedParser.parse(text) : text;

    // 4. Restore and Render KaTeX Math using safe split/join
    var katexRenderer = features.mathKaTeX === false
      ? null
      : ((typeof katex !== 'undefined') ? katex : (window.katex || null));
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

      // 5.0 站内互链处理 (Cross-Article Links)
      //   (a) 双链语法: [[slug]] / [[slug|显示文本]]  → 自动补全标题并生成站内路由
      //   (b) 相对 .md 链接: [文本](xxx.md) / [文本](posts/xxx.md) → 自动解析为站内路由
      //   解析统一由 window.BlogStore.resolveLink() 提供；未命中降级为「缺失」提示。
      var linkStore = window.BlogStore;
      if (linkStore && typeof linkStore.resolveLink === 'function') {
        var toHref = function(route) {
          if (!route) return '#';
          return route.charAt(0) === '#' ? route : '#' + route;
        };
        var applyAnchor = function(anchor, hit, fallbackLabel) {
          anchor.setAttribute('href', hit.href || toHref(hit.route));
          anchor.setAttribute('title', hit.title || fallbackLabel || '');
          anchor.classList.add('wiki-link');
          if (hit.kind) anchor.classList.add('wiki-link-' + hit.kind);
          if (/^https?:/i.test(hit.href || '')) {
            anchor.setAttribute('target', '_blank');
            anchor.setAttribute('rel', 'noopener noreferrer');
          }
        };

        // (a) 双链语法
        var textWalker = document.createTreeWalker(tempDiv, NodeFilter.SHOW_TEXT, null, false);
        var textNodes = [];
        while (textWalker.nextNode()) textNodes.push(textWalker.currentNode);

        textNodes.forEach(function(node) {
          var value = node.nodeValue || '';
          if (value.indexOf('[[') === -1 || value.indexOf(']]') === -1) return;

          // 跳过代码块 / 行内代码 / 已有链接内部，避免误伤
          var ancestor = node.parentNode;
          while (ancestor && ancestor !== tempDiv) {
            var tag = (ancestor.tagName || '').toLowerCase();
            if (tag === 'code' || tag === 'pre' || tag === 'a') return;
            ancestor = ancestor.parentNode;
          }

          var re = /\[\[([^\[\]\r\n]+)\]\]/g;
          if (!re.test(value)) return;
          re.lastIndex = 0;

          var fragment = document.createDocumentFragment();
          var cursor = 0;
          var match;
          while ((match = re.exec(value)) !== null) {
            if (match.index > cursor) {
              fragment.appendChild(document.createTextNode(value.slice(cursor, match.index)));
            }
            var inner = match[1];
            var pipeAt = inner.indexOf('|');
            var key = (pipeAt === -1 ? inner : inner.slice(0, pipeAt)).trim();
            var label = (pipeAt === -1 ? '' : inner.slice(pipeAt + 1)).trim();
            var hit = linkStore.resolveLink(key);

            if (hit && (hit.route || hit.href)) {
              var anchor = document.createElement('a');
              applyAnchor(anchor, hit, key);
              anchor.textContent = label || hit.title || key;
              fragment.appendChild(anchor);
            } else {
              var missing = document.createElement('span');
              missing.className = 'wiki-link is-missing';
              missing.setAttribute('title', '未找到引用的文章: ' + key);
              missing.textContent = label || key;
              fragment.appendChild(missing);
            }
            cursor = match.index + match[0].length;
          }
          if (cursor < value.length) {
            fragment.appendChild(document.createTextNode(value.slice(cursor)));
          }
          node.parentNode.replaceChild(fragment, node);
        });

        // (b) 相对 Markdown 文件链接
        tempDiv.querySelectorAll('a[href]').forEach(function(anchor) {
          var href = (anchor.getAttribute('href') || '').trim();
          if (!/\.(md|markdown)(?:$|[?#])/i.test(href)) return;
          if (/^(?:https?:|mailto:|tel:|#)/i.test(href)) return;

          var fragmentAt = href.indexOf('#');
          var heading = fragmentAt === -1 ? '' : href.slice(fragmentAt + 1);
          var file = href.split('#')[0].split('?')[0];
          var clean = file.replace(/^(?:\.\.?\/)+/, '');
          if (options.sourcePath && !/^\/?posts\//i.test(file) && file.charAt(0) !== '/') {
            var directory = options.sourcePath.slice(0, options.sourcePath.lastIndexOf('/') + 1);
            clean = new URL(file, 'https://aurora.invalid/' + directory).pathname.slice(1);
          }
          var hit = linkStore.resolveLink(clean);
          if (hit && (hit.route || hit.href)) {
            applyAnchor(anchor, hit);
            if (heading) {
              var targetHref = anchor.getAttribute('href');
              anchor.setAttribute('href', targetHref + (targetHref.indexOf('?') === -1 ? '?' : '&') + 'heading=' + encodeURIComponent(heading));
            }
          } else {
            var fallbackSlug = clean.replace(/^posts\//i, '').replace(/\.(md|markdown)$/i, '');
            anchor.setAttribute('href', toHref('/posts/' + encodeURIComponent(fallbackSlug)));
            anchor.classList.add('wiki-link');
          }
        });
      }

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
      {
        var usedIds = Object.create(null);
        var headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headings.forEach(function(h, index) {
          var headingText = h.textContent.trim();
          // Content-based, ASCII-safe IDs remain stable when unrelated headings are inserted.
          var hash = 2166136261;
          for (var i = 0; i < headingText.length; i++) hash = Math.imul(hash ^ headingText.charCodeAt(i), 16777619);
          var base = 'heading-' + (hash >>> 0).toString(16);
          usedIds[base] = (usedIds[base] || 0) + 1;
          var id = base + (usedIds[base] > 1 ? '-' + usedIds[base] : '');
          h.setAttribute('id', id);
          h.classList.add('scroll-mt-20');
          var level = parseInt(h.tagName.substring(1), 10);
          if (targetLevels.includes(level)) toc.push({ id: id, text: headingText, level: level });
        });
      }

      var pres = tempDiv.querySelectorAll('pre');
      // 高亮器在遍历前解析一次即可（原先在 forEach 内重复求值）
      var prismHighlighter = features.codeHighlight === false
        ? null
        : ((typeof Prism !== 'undefined') ? Prism : (window.Prism || null));
      pres.forEach(function(pre) {
        var code = pre.querySelector('code');
        var rawCodeText = code ? code.textContent : pre.textContent;
        var language = 'text';

        if (code && code.className) {
          var langMatch = code.className.match(/language-([a-z0-9_-]+)/i);
          if (langMatch) language = langMatch[1].toLowerCase();
        }

        // 只使用真正注册过的语法。未注册语言退回 plain（原样输出、不假高亮），
        // 绝不再兜底到 JavaScript —— 否则 bibtex/yaml/go 等会被着上 JS 配色（历史问题）。
        if (prismHighlighter && code) {
          var prismLang = prismHighlighter.languages[language] || prismHighlighter.languages['plain'];
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
