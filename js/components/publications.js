window.BlogPublications = {
  create: function(services) {
    return Object.assign({ escapeHtml: services.html.escapeHtml, formatLines: services.formatLines, postHref: services.postHref, tagHref: services.tagHref }, {
  PUB_LINK_LABELS: {
    pdf: 'PDF', doi: 'DOI', arxiv: 'arXiv', code: 'CODE', slides: 'SLIDES',
    dataset: 'DATA', video: 'VIDEO', poster: 'POSTER', site: 'SITE', bib: 'BIB'
  },

  // 徽章的固定展示顺序：读者最常用的（PDF / DOI / arXiv / Code）永远排在最前，
  // 其余按 FrontMatter 里的书写顺序追加。
  PUB_LINK_ORDER: ['pdf', 'doi', 'arxiv', 'code', 'slides', 'dataset', 'poster', 'video', 'site', 'bib'],

  // 时间线关联资源的筹码文案
  TL_LINK_LABELS: {
    paper: 'PAPER', post: 'POST', article: 'POST', blog: 'POST', note: 'NOTE', doc: 'DOC',
    slides: 'SLIDES', slide: 'SLIDES', code: 'CODE', doi: 'DOI', data: 'DATA',
    dataset: 'DATA', link: 'LINK', tag: 'TAG'
  },

  // 署名列表归一化。三种写法都支持：
  //   authors: ["C. Chen", "L. Wang"]
  //   authors: "C. Chen, M. Ito"                （逗号分隔的纯文本）
  //   authors: ["**C. Chen**", "L. Wang*"]      （显式高亮本人；尾随 * 视为本人）
  normalizeAuthors: function(value) {
    var list;
    if (Array.isArray(value)) {
      list = value;
    } else if (typeof value === 'string' && value.trim()) {
      list = value.split(/\s*,\s*/);
    } else {
      list = [];
    }
    var out = [];
    list.forEach(function(raw) {
      var name = String(raw == null ? '' : raw).trim();
      if (!name) return;
      var isSelf = false;
      var marked = /^\*\*([\s\S]+)\*\*$/.exec(name);
      if (marked) {
        name = marked[1].trim();
        isSelf = true;
      }
      // 学术界用尾随 * 标注通讯作者，这里一并当作「本人」处理
      if (/\*+$/.test(name)) {
        name = name.replace(/\*+$/, '').trim();
        isSelf = true;
      }
      if (name) out.push({ name: name, self: isSelf });
    });
    return out;
  },

  // 「本人」候选名单：pageData.author / pageData.authors 与 blog.config.js 的 author.name。
  // 命中者加粗高亮，方便在长作者列表里一眼定位自己。
  selfAuthorNames: function(pageData) {
    var cfg = (services.store && services.store.config) || services.config || {};
    var author = cfg.author || {};
    var names = [];
    [author.name, author.aliases, pageData && pageData.author, pageData && pageData.authors].forEach(function(value) {
      if (Array.isArray(value)) names = names.concat(value);
      else if (value) names.push(value);
    });
    return names
      .map(function(n) { return String(n).trim().toLowerCase(); })
      .filter(function(n) { return n !== ''; });
  },

  formatAuthors: function(value, selfNames) {
    var self = this;
    var known = selfNames || [];
    var list = self.normalizeAuthors(value);
    if (list.length === 0) return '';
    return list.map(function(author) {
      var isSelf = author.self || known.indexOf(author.name.toLowerCase()) !== -1;
      var html = self.escapeHtml(author.name);
      return isSelf ? '<strong class="pub-author-self">' + html + '</strong>' : html;
    }).join('<span class="pub-author-sep">, </span>');
  },

  // year 可能是 2026 或 "2026"；也允许写成 date: "2026-03"，统一取四位年份。
  publicationYear: function(pub) {
    var m = /(\d{4})/.exec(String((pub && (pub.year || pub.date)) || ''));
    return m ? parseInt(m[1], 10) : null;
  },

  publicationCitations: function(pub) {
    var raw = pub && (pub.citations !== undefined ? pub.citations : pub.cited);
    if (raw === undefined || raw === null || raw === '') return null;
    var num = parseInt(String(raw).replace(/[^\d]/g, ''), 10);
    return isNaN(num) ? null : num;
  },

  // 论著链接归一化为有序数组 [{kind,label,href}]。
  // 兼容三种书写：嵌套 links 映射、嵌套 links 块、以及直接在条目上平铺 pdf:/doi:。
  publicationLinks: function(pub) {
    var self = this;
    var out = [];
    var seen = {};
    var push = function(kind, href) {
      var v = href === undefined || href === null ? '' : String(href).trim();
      if (!v || seen[kind] || !self.publicationLinkHref(kind, v)) return;
      seen[kind] = 1;
      out.push({ kind: kind, label: self.PUB_LINK_LABELS[kind] || String(kind).toUpperCase(), href: v });
    };
    var links = pub && pub.links;
    if (links && typeof links === 'object' && !Array.isArray(links)) {
      self.PUB_LINK_ORDER.forEach(function(k) { push(k, links[k]); });
      Object.keys(links).forEach(function(k) { push(k, links[k]); });
    }
    self.PUB_LINK_ORDER.forEach(function(k) { push(k, pub && pub[k]); });
    return out;
  },

  // 把裸标识补全为可点击的 URL：doi / arxiv 补协议前缀，
  // 站内相对路径（attachments/...）与已带协议的地址原样保留。
  publicationLinkHref: function(kind, href) {
    var v = String(href == null ? '' : href).trim();
    if (!v) return '';
    if (/^(https?:|mailto:|tel:|#|\/)/i.test(v)) return services.html.safeUrl(v);
    if (kind === 'doi') return services.html.safeUrl('https://doi.org/' + v.replace(/^doi:\s*/i, ''));
    if (kind === 'arxiv') return services.html.safeUrl('https://arxiv.org/abs/' + v.replace(/^arxiv:\s*/i, ''));
    return services.html.safeUrl(v);
  },

  // 结构化条目（timeline[] / focusAreas[]）折叠面板里的补充说明
  entryDetailText: function(item) {
    var detail = item && (item.detail || item.details || item.more);
    if (Array.isArray(detail)) return detail;
    return detail ? String(detail) : '';
  },

  // 条目是否值得折叠：有补充说明或关联资源才渲染箭头，否则保持静态展示，
  // 避免出现「点了没反应」的空箭头。
  hasExpandableContent: function(item) {
    var self = this;
    if (self.entryDetailText(item)) return true;
    var links = item && item.links;
    return !!(links && typeof links === 'object' && !Array.isArray(links) && Object.keys(links).length > 0);
  },

  // 可展开标题：有折叠内容时渲染为 <button>（可键盘聚焦）+ 箭头，否则退化为纯标题。
  // 箭头放在文本流内（而非独立的 flex 尾项）—— 标题换行时它跟随最后一行，
  // 不会孤零零地飘在版心最右侧、离标题半个屏宽。
  toggleHeadingHtml: function(tagName, className, innerHtml, panelId, expandable) {
    if (!expandable) {
      return '<' + tagName + ' class="' + className + '">' + innerHtml + '</' + tagName + '>';
    }
    var chevron = '<svg class="entry-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg>';
    return '<' + tagName + ' class="' + className + '">' +
      '<button type="button" class="entry-toggle" data-expand-target="' + panelId + '" aria-expanded="false" aria-controls="' + panelId + '">' +
      '<span class="entry-toggle-text">' + innerHtml + chevron + '</span>' +
      '</button>' +
      '</' + tagName + '>';
  },

  // 关联资源筹码文案：外链显示域名，站内路径显示文件名。
  chipTextFromHref: function(href, fallback) {
    var v = String(href == null ? '' : href);
    if (/^https?:/i.test(v)) {
      try { return new URL(v).hostname.replace(/^www\./, ''); } catch (e) { return fallback; }
    }
    if (v.indexOf('mailto:') === 0) return v.slice(7);
    var parts = v.split('/');
    return parts[parts.length - 1] || fallback;
  },

  // 把 timeline[].links 里的一对 kind/value 解析为一个筹码。
  // 特殊之处在于 `paper:` —— 命中 publications 时筹码变成「滚动并展开那张卡片」的锚点，
  // 使「经历 → 产出论文」在页面内形成闭环，而不需要另开一个链接。
  resolveTimelineLink: function(kind, value, ctx) {
    var self = this;
    var k = String(kind == null ? '' : kind).trim().toLowerCase();
    var label = self.TL_LINK_LABELS[k] || (k ? k.toUpperCase() : 'LINK');
    var raw = String(value == null ? '' : value).trim();
    if (!raw) return null;

    if (k === 'paper' && ctx && ctx.publications && ctx.publications.length) {
      var hit = -1;
      ctx.publications.forEach(function(pub, i) {
        if (hit !== -1) return;
        var slug = String(pub.slug || '').trim().toLowerCase();
        var title = String(pub.title || '').trim();
        if ((slug && slug === raw.toLowerCase()) || (title && title === raw)) hit = i;
      });
      if (hit !== -1) {
        var target = ctx.publications[hit];
        return { kind: k, label: 'PAPER', jump: hit + 1, href: '#', text: String(target.title || raw), title: '展开该论著' };
      }
    }

    if (['post', 'article', 'blog', 'note', 'doc'].indexOf(k) !== -1) {
      var post = services.store ? services.store.getPostById(raw) : null;
      if (post) {
        return { kind: k, label: label, href: self.postHref(post), text: post.title || raw, title: post.title || raw };
      }
    }

    if (k === 'tag') {
      return { kind: k, label: 'TAG', href: self.tagHref(raw), text: '#' + raw, title: '按标签浏览' };
    }

    var href = self.publicationLinkHref(k, raw);
    if (!href) return null;
    return { kind: k, label: label, href: href, text: self.chipTextFromHref(href, raw), title: href };
  },

  // 折叠面板：补充说明 + 关联资源筹码
  renderEntryPanel: function(item, panelId, ctx) {
    var self = this;
    var html = '<div class="entry-panel" id="' + panelId + '" hidden>';
    var detail = self.entryDetailText(item);
    if (detail) {
      html += '<p class="entry-detail">' + self.formatLines(detail) + '</p>';
    }
    var links = (item && item.links && typeof item.links === 'object' && !Array.isArray(item.links)) ? item.links : {};
    var chips = [];
    Object.keys(links).forEach(function(kind) {
      // 同一类资源可以挂多个：paper: ["slug-a", "slug-b"] 会展开成两枚筹码
      var value = links[kind];
      var values = Array.isArray(value) ? value : [value];
      values.forEach(function(one) {
        var chip = self.resolveTimelineLink(kind, one, ctx);
        if (chip) chips.push(chip);
      });
    });
    if (chips.length > 0) {
      html += '<div class="entry-chips">';
      chips.forEach(function(chip) {
        var external = /^https?:/i.test(chip.href);
        var attrs = chip.jump
          ? ' href="#/" data-pub-jump="' + chip.jump + '"'
          : ' href="' + self.escapeHtml(chip.href) + '"' + (external ? ' target="_blank" rel="noopener noreferrer"' : '');
        html += '<a class="entry-chip entry-chip-' + self.escapeHtml(chip.kind) + '"' + attrs + ' title="' + self.escapeHtml(chip.title || '') + '">';
        html += '<span class="entry-chip-label">' + self.escapeHtml(chip.label) + '</span>';
        html += '<span class="entry-chip-text">' + self.escapeHtml(chip.text) + '</span>';
        html += '<span class="entry-chip-arrow">' + (chip.jump ? '↓' : (external ? '↗' : '→')) + '</span>';
        html += '</a>';
      });
      html += '</div>';
    }
    html += '</div>';
    return html;
  },

  // 单张论著卡片：折叠态 = 序号 + 标题 + 署名 + 期刊/年份/引用 + 资源徽章；
  // 展开态 = 摘要 + 按需挂载的 PDF 预览（iframe 只在第一次点「预览 PDF」时创建）。
  renderPublicationCard: function(pub, seq, selfNames) {
    var self = this;
    var panelId = 'pub-panel-' + seq;
    var links = self.publicationLinks(pub);
    var year = self.publicationYear(pub);
    var citations = self.publicationCitations(pub);
    var title = String(pub.title || pub.name || 'Untitled').trim();
    var venue = String(pub.venue || pub.journal || pub.conference || '').trim();
    var authorsHtml = self.formatAuthors(pub.authors || pub.author, selfNames);
    var abstractText = pub.abstract || pub.summary || '';
    var pdfLink = null;
    links.forEach(function(l) { if (!pdfLink && l.kind === 'pdf') pdfLink = l; });
    var expandable = !!String(abstractText || '').trim() || !!pdfLink;

    var html = '<article class="pub-card' + (expandable ? ' is-expandable' : '') + '" data-pub-seq="' + seq + '">';
    html += '<div class="pub-card-head"' + (expandable ? ' data-expand-target="' + panelId + '"' : '') + '>';
    html += '  <span class="pub-seq">' + (seq < 10 ? '0' + seq : seq) + '</span>';
    html += '  <div class="pub-card-main">';
    html += self.toggleHeadingHtml('h3', 'pub-title', self.escapeHtml(title), panelId, expandable);
    if (authorsHtml) html += '<p class="pub-authors">' + authorsHtml + '</p>';

    var metaBits = [];
    if (venue) metaBits.push('<span class="pub-venue">' + self.escapeHtml(venue) + '</span>');
    if (year !== null) metaBits.push('<span>' + year + '</span>');
    if (citations !== null) metaBits.push('<span class="pub-cite">' + citations + (citations === 1 ? ' citation' : ' citations') + '</span>');
    if (metaBits.length > 0) {
      html += '<div class="pub-meta">' + metaBits.join('<span class="pub-meta-sep">·</span>') + '</div>';
    }
    html += '  </div>';
    if (links.length > 0) {
      html += '  <div class="pub-badges">';
      links.forEach(function(link) {
        var href = self.publicationLinkHref(link.kind, link.href);
        var external = /^https?:/i.test(href);
        html += '<a class="pub-badge pub-badge-' + self.escapeHtml(link.kind) + '" href="' + self.escapeHtml(href) + '"'
          + (external ? ' target="_blank" rel="noopener noreferrer"' : '')
          + ' title="' + self.escapeHtml(href) + '">' + self.escapeHtml(link.label)
          + (external ? '<span class="pub-badge-arrow">↗</span>' : '') + '</a>';
      });
      html += '  </div>';
    }
    html += '</div>';

    if (expandable) {
      html += '<div class="pub-panel" id="' + panelId + '" hidden>';
      if (String(abstractText || '').trim()) {
        html += '<p class="pub-abstract">' + self.formatLines(abstractText) + '</p>';
      }
      if (pdfLink) {
        var pdfHref = self.publicationLinkHref('pdf', pdfLink.href);
        html += '<div class="pub-preview" data-pdf-src="' + self.escapeHtml(pdfHref) + '" data-preview-state="idle">';
        html += '  <div class="pub-preview-bar">';
        html += '    <button type="button" class="pub-preview-btn" data-pub-preview="1">';
        html += '      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>';
        html += '      <span>预览 PDF</span>';
        html += '    </button>';
        html += '    <a class="pub-preview-link" href="' + self.escapeHtml(pdfHref) + '" target="_blank" rel="noopener noreferrer">在新标签打开 ↗</a>';
        html += '  </div>';
        html += '  <div class="pub-preview-slot"></div>';
        html += '</div>';
      }
      html += '</div>';
    }
    html += '</article>';
    return html;
  },

  // 论著区块：按年份倒序分组，组内保持 FrontMatter 书写顺序（序号即全局顺序）。
  renderPublicationsSection: function(publications, pageData) {
    var self = this;
    if (!publications || publications.length === 0) return '';

    var selfNames = self.selfAuthorNames(pageData);
    var groups = [];
    var groupIndex = {};
    publications.forEach(function(pub, i) {
      var year = self.publicationYear(pub);
      var key = year === null ? 'none' : String(year);
      if (groupIndex[key] === undefined) {
        groupIndex[key] = groups.length;
        groups.push({ year: year, items: [] });
      }
      groups[groupIndex[key]].items.push({ pub: pub, seq: i + 1 });
    });
    // 年份倒序；未填写年份的条目统一沉到末尾
    groups.sort(function(a, b) {
      if (a.year === null) return 1;
      if (b.year === null) return -1;
      return b.year - a.year;
    });

    var totalCitations = 0;
    var citedCount = 0;
    publications.forEach(function(pub) {
      var c = self.publicationCitations(pub);
      if (c !== null) {
        totalCitations += c;
        citedCount++;
      }
    });

    var html = '<section class="mb-14" id="publications">';
    html += '  <div class="about-section-header flex items-center justify-between pb-3 border-b border-divider mb-8">';
    html += '    <h2 class="text-[18px] font-semibold text-primary font-sans">Publications</h2>';
    var stat = publications.length + (publications.length === 1 ? ' Paper' : ' Papers');
    if (citedCount > 0) stat += ' · ' + totalCitations + ' Citations';
    html += '    <span class="text-[11px] font-mono text-muted">' + stat + '</span>';
    html += '  </div>';

    groups.forEach(function(group) {
      html += '  <div class="pub-year-group">';
      html += '    <div class="pub-year-label">';
      html += '      <span class="pub-year-text">' + (group.year === null ? 'UNYEARED' : group.year) + '</span>';
      html += '      <span class="pub-year-rule"></span>';
      html += '      <span class="pub-year-count">' + group.items.length + '</span>';
      html += '    </div>';
      group.items.forEach(function(entry) {
        html += self.renderPublicationCard(entry.pub, entry.seq, selfNames);
      });
      html += '  </div>';
    });

    html += '</section>';
    return html;
  },

  // 经历时间线：条目自带 detail / links 时整条可点开，否则保持原有静态展示。
  renderTimelineItem: function(item, index, ctx) {
    var self = this;
    var panelId = 'tl-panel-' + index;
    var expandable = self.hasExpandableContent(item);
    var html = '<div class="about-timeline-item' + (expandable ? ' is-expandable' : '') + '"'
      + (expandable ? ' data-expand-target="' + panelId + '"' : '') + '>';
    html += '  <div class="about-timeline-node"></div>';
    if (item.period) html += '  <div class="about-timeline-period">' + self.formatLines(item.period) + '</div>';
    if (item.title) {
      html += self.toggleHeadingHtml('h3', 'about-timeline-heading', self.formatLines(item.title), panelId, expandable);
    }
    if (item.desc) html += '  <p class="about-timeline-desc">' + self.formatLines(item.desc) + '</p>';
    if (expandable) html += self.renderEntryPanel(item, panelId, ctx);
    html += '</div>';
    return html;
  },

  renderTimelineSection: function(timeline, ctx) {
    var self = this;
    if (!timeline || timeline.length === 0) return '';
    var html = '<section class="mb-14" id="timeline">';
    html += '  <div class="about-section-header flex items-center justify-between pb-3 border-b border-divider mb-8">';
    html += '    <h2 class="text-[18px] font-semibold text-primary font-sans">Timeline & Milestones</h2>';
    html += '    <span class="text-[11px] font-mono text-muted">' + timeline.length + ' Milestones</span>';
    html += '  </div>';
    html += '  <div class="about-timeline-track">';
    timeline.forEach(function(item, index) {
      html += self.renderTimelineItem(item, index, ctx);
    });
    html += '  </div>';
    html += '</section>';
    return html;
  },

  // 折叠面板的统一开关。面板本体用 hidden 属性记录状态，视觉态用 is-expanded 类，
  // 两者分开可以让 CSS 自由决定动画方式（网格行数、淡入等）。

    });
  }
};
