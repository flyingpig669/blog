let posts = [];
let activeCategory = "全部";
let activeSeries = "全部";
let activeTag = "全部";
let searchTerm = "";
let homePage = 1;
let seriesIndexPage = 1;
let seriesPostPage = 1;

const app = document.querySelector("#app");
const DEFAULT_COVER = "/assets/favicon.svg";
const LIST_PAGE_SIZE = 8;
const SHOW_LOCAL_IMPORT_TOOLS = false;
const SITE_PROFILE = {
  profileTitle: "简介",
  profileEyebrow: "Profile / Contact",
  profileIntro:
    "这里放研究方向、写作主题、常用工具链和联系方式。把下面的占位内容替换成你的真实介绍即可。",
  introItems: [
    {
      title: "研究方向",
      meta: "Research",
      text: "我关注计算物理、数值分析、PDE、Hamiltonian 系统和科学计算工具链。这个博客会放推导、实验记录、代码片段、论文阅读、附件和可视化结果。",
    },
    {
      title: "写作目标",
      meta: "Writing",
      text: "写作目标是让每个想法都能被重新检查：假设清楚，公式可追踪，实验可复现，代码能回到具体问题。",
    },
    {
      title: "常用主题",
      meta: "Topics",
      text: "结构保持算法、谱方法、稀疏线性代数、可复现实验、科学计算工程和研究日志。",
    },
  ],
  links: [
    { label: "Email", href: "mailto:hello@example.com" },
    { label: "GitHub", href: "https://github.com/" },
    { label: "写作说明", href: "#guide" },
  ],
};

function formatDate(value) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function cleanText(value = "") {
  return String(value).trim();
}

function isBlank(value) {
  return cleanText(value).length === 0;
}

function slugify(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "");
}

function dirname(path) {
  return path.split("/").slice(0, -1).join("/");
}

function resolveAssetPath(markdownPath, assetPath) {
  if (!assetPath) return "";
  if (/^(https?:|blob:|data:|\/)/.test(assetPath)) return assetPath;
  return `${dirname(markdownPath)}/${assetPath}`.replaceAll("//", "/");
}

function parseValue(value) {
  const trimmed = value.trim();
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    return trimmed
      .slice(1, -1)
      .split(",")
      .map((item) => item.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);
  }
  return trimmed.replace(/^["']|["']$/g, "");
}

function parseFrontMatter(markdown) {
  if (!markdown.startsWith("---")) return { attrs: {}, body: markdown };
  const end = markdown.indexOf("\n---", 3);
  if (end === -1) return { attrs: {}, body: markdown };

  const rawAttrs = markdown.slice(3, end).trim();
  const attrs = {};
  rawAttrs.split(/\r?\n/).forEach((line) => {
    const match = line.match(/^([\w-]+):\s*(.*)$/);
    if (match) attrs[match[1]] = parseValue(match[2]);
  });

  return {
    attrs,
    body: markdown.slice(end + 4).trim(),
  };
}

function normalizeList(value, fallback = []) {
  if (Array.isArray(value)) return value.map(cleanText).filter((item) => !isBlank(item));
  if (!isBlank(value)) return [cleanText(value)];
  return fallback;
}

function uniqueHeadingId(text, usedIds) {
  const base = slugify(text) || "section";
  let id = base;
  let index = 2;
  while (usedIds.has(id)) {
    id = `${base}-${index}`;
    index += 1;
  }
  usedIds.add(id);
  return id;
}

function parseTable(lines, start) {
  const header = lines[start].trim();
  const separator = lines[start + 1]?.trim() || "";
  if (!header.includes("|") || !/^\|?[\s:|-]+\|[\s:|-]+\|?$/.test(separator)) {
    return null;
  }

  const rows = [];
  let index = start + 2;
  while (index < lines.length && lines[index].trim().includes("|")) {
    rows.push(lines[index].trim());
    index += 1;
  }

  const split = (line) =>
    line
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((cell) => cell.trim());

  return {
    block: {
      type: "table",
      headers: split(header),
      rows: rows.map(split),
    },
    nextIndex: index - 1,
  };
}

function parseMarkdown(markdown, markdownPath) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  const footnotes = [];
  const usedIds = new Set();
  let paragraph = [];

  function flushParagraph() {
    if (!paragraph.length) return;
    blocks.push({ type: "p", text: paragraph.join(" ") });
    paragraph = [];
  }

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      continue;
    }

    const footnote = trimmed.match(/^\[\^(.+?)]:\s+(.+)$/);
    if (footnote) {
      flushParagraph();
      footnotes.push({ id: footnote[1], text: footnote[2] });
      continue;
    }

    const fence = trimmed.match(/^```(\w+)?/);
    if (fence) {
      flushParagraph();
      const code = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        code.push(lines[index]);
        index += 1;
      }
      blocks.push({ type: "code", lang: fence[1] || "text", text: code.join("\n") });
      continue;
    }

    if (trimmed === "$$") {
      flushParagraph();
      const formula = [];
      index += 1;
      while (index < lines.length && lines[index].trim() !== "$$") {
        formula.push(lines[index]);
        index += 1;
      }
      blocks.push({ type: "math", text: formula.join("\n") });
      continue;
    }

    const table = parseTable(lines, index);
    if (table) {
      flushParagraph();
      blocks.push(table.block);
      index = table.nextIndex;
      continue;
    }

    const image = trimmed.match(/^!\[(.*)]\((.*)\)$/);
    if (image) {
      flushParagraph();
      blocks.push({
        type: "image",
        src: resolveAssetPath(markdownPath, image[2].trim()),
        alt: image[1].trim(),
        caption: image[1].trim(),
      });
      continue;
    }

    const heading = trimmed.match(/^(#{2,3})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      const level = heading[1].length;
      const text = heading[2];
      blocks.push({
        type: level === 2 ? "h2" : "h3",
        level,
        id: uniqueHeadingId(text, usedIds),
        text,
      });
      continue;
    }

    if (trimmed.startsWith(">")) {
      flushParagraph();
      blocks.push({ type: "quote", text: trimmed.replace(/^>\s?/, "") });
      continue;
    }

    const task = trimmed.match(/^[-*]\s+\[( |x|X)]\s+(.+)$/);
    if (task) {
      flushParagraph();
      blocks.push({ type: "task", checked: task[1].toLowerCase() === "x", text: task[2] });
      continue;
    }

    paragraph.push(trimmed);
  }

  flushParagraph();
  if (footnotes.length) blocks.push({ type: "footnotes", footnotes });
  return blocks;
}

function blockText(block) {
  if (["p", "h2", "h3", "quote", "task", "math", "code"].includes(block.type)) {
    return block.text || "";
  }
  if (block.type === "image") return `${block.alt || ""} ${block.caption || ""}`;
  if (block.type === "table") return [...block.headers, ...block.rows.flat()].join(" ");
  if (block.type === "footnotes") return block.footnotes.map((note) => note.text).join(" ");
  return "";
}

function postFromMarkdown(markdown, markdownPath, fallbackSlug, manifestEntry = {}) {
  const { attrs, body } = parseFrontMatter(markdown);
  const title = attrs.title || fallbackSlug;
  const slug = attrs.slug || fallbackSlug || slugify(title);
  const categories = normalizeList(attrs.categories, normalizeList(attrs.category, ["未分类"]));
  const content = parseMarkdown(body, markdownPath);
  const attachments = normalizeList(manifestEntry.attachments).map((filePath) => ({
    path: filePath,
    name: filePath.split("/").pop(),
  }));

  const cover = attrs.cover || findCoverAttachment(attachments) || DEFAULT_COVER;

  return {
    slug,
    title,
    date: attrs.date || new Date().toISOString().slice(0, 10),
    readTime: attrs.readTime || "未估算",
    category: categories[0],
    categories,
    series: cleanText(attrs.series),
    seriesOrder: Number(attrs.seriesOrder || 0),
    tags: normalizeList(attrs.tags),
    cover: resolveAssetPath(markdownPath, cover),
    excerpt: attrs.excerpt || "这篇笔记还没有摘要。",
    content,
    bodyText: content.map(blockText).join(" "),
    sourcePath: markdownPath,
    attachments,
    research: {
      paper: attrs.paper || "",
      repo: attrs.repo || "",
      dataset: attrs.dataset || "",
      status: cleanText(attrs.status),
    },
  };
}

function findCoverAttachment(attachments) {
  const imageAttachments = attachments.filter((attachment) => /\.(png|jpe?g|gif|svg|webp)$/i.test(attachment.path));
  return imageAttachments.find((attachment) => /(^|\/)cover\./i.test(attachment.path))?.path || "";
}

async function loadManifestPosts() {
  const manifestResponse = await fetch("content/manifest.json");
  if (!manifestResponse.ok) throw new Error("content/manifest.json 加载失败");
  const manifest = await manifestResponse.json();

  const loaded = await Promise.all(
    manifest.notes.map(async (entry) => {
      const response = await fetch(entry.path);
      if (!response.ok) throw new Error(`${entry.path} 加载失败`);
      return postFromMarkdown(await response.text(), entry.path, entry.slug, entry);
    }),
  );

  return loaded.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function getCategories() {
  return ["全部", ...Array.from(new Set(posts.flatMap((post) => post.categories)))];
}

function getSeries() {
  return [
    "全部",
    ...Array.from(new Set(posts.map((post) => post.series).filter((series) => !isBlank(series)))),
  ];
}

function getTags() {
  return ["全部", ...Array.from(new Set(posts.flatMap((post) => post.tags)))];
}

function getSeriesGroups() {
  return getSeries()
    .filter((series) => series !== "全部")
    .map((series) => ({
      name: series,
      posts: posts
        .filter((post) => post.series === series)
        .sort((a, b) => a.seriesOrder - b.seriesOrder || new Date(a.date) - new Date(b.date)),
    }));
}

function getFilteredPosts() {
  const query = searchTerm.trim().toLowerCase();
  return posts.filter((post) => {
    const matchesCategory =
      activeCategory === "全部" || post.categories.includes(activeCategory);
    const matchesSeries = activeSeries === "全部" || cleanText(post.series) === activeSeries;
    const matchesTag = activeTag === "全部" || post.tags.includes(activeTag);
    const haystack = [
      post.title,
      post.excerpt,
      post.bodyText,
      ...post.categories,
      post.series,
      ...post.tags,
      ...Object.values(post.research),
    ]
      .join(" ")
      .toLowerCase();
    return matchesCategory && matchesSeries && matchesTag && (!query || haystack.includes(query));
  });
}

function clampPage(page, totalItems, pageSize = LIST_PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  return Math.min(Math.max(Number(page) || 1, 1), totalPages);
}

function paginateItems(items, page, pageSize = LIST_PAGE_SIZE) {
  const safePage = clampPage(page, items.length, pageSize);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page: safePage,
    pageSize,
    start,
    total: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / pageSize)),
  };
}

function renderPagination({ page, total, totalPages }, scope) {
  if (totalPages <= 1) return "";
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
  return `
    <nav class="pagination" aria-label="分页">
      <button type="button" data-page-scope="${scope}" data-page="${page - 1}" ${page <= 1 ? "disabled" : ""}>上一页</button>
      <div>
        ${pages
          .map(
            (item) => `
              <button class="${item === page ? "active" : ""}" type="button" data-page-scope="${scope}" data-page="${item}" ${item === page ? 'aria-current="page"' : ""}>
                ${item}
              </button>
            `,
          )
          .join("")}
      </div>
      <button type="button" data-page-scope="${scope}" data-page="${page + 1}" ${page >= totalPages ? "disabled" : ""}>下一页</button>
      <span>${page} / ${totalPages} · ${total} 条</span>
    </nav>
  `;
}

function bindPaginationEvents() {
  document.querySelectorAll("[data-page-scope][data-page]").forEach((button) => {
    button.addEventListener("click", () => {
      const page = Number(button.dataset.page);
      if (button.dataset.pageScope === "home") {
        homePage = page;
        renderHome();
      } else if (button.dataset.pageScope === "series-index") {
        seriesIndexPage = page;
        renderSeriesIndex();
      } else if (button.dataset.pageScope === "series-posts") {
        seriesPostPage = page;
        renderSeriesPage(activeSeries);
      }
      window.scrollTo({ top: 0, behavior: "instant" });
    });
  });
}

function getStats() {
  return {
    posts: posts.length,
    categories: getCategories().length - 1,
    series: getSeries().length - 1,
    attachments: posts.reduce((count, post) => count + post.attachments.length, 0),
  };
}

function renderInline(text = "", markdownPath = "") {
  let output = escapeHtml(text);
  output = output.replace(
    /\[([^\]]+)]\(([^)]+)\)/g,
    (_, label, href) => {
      const url = safeHref(resolveAssetPath(markdownPath, href.trim()));
      return `<a class="text-link" href="${escapeHtml(url)}" target="_blank" rel="noreferrer">${label}</a>`;
    },
  );
  output = output.replace(/\[\^(.+?)]/g, (_, id) => `<sup><a href="#fn-${slugify(id)}">[${escapeHtml(id)}]</a></sup>`);
  output = output.replace(/`([^`]+)`/g, "<code>$1</code>");
  output = output.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  return output;
}

function safeHref(value = "") {
  const href = String(value).trim();
  if (/^(https?:|mailto:|#|\/|content\/|assets\/|attachments\/)/i.test(href)) return href;
  return "#";
}

function highlight(text) {
  const query = searchTerm.trim();
  if (!query) return escapeHtml(text);
  const escaped = escapeHtml(text);
  const needle = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return escaped.replace(new RegExp(`(${needle})`, "gi"), "<mark>$1</mark>");
}

function renderButtonRow(items, activeValue, dataName) {
  return items
    .map(
      (item) => `
        <button class="tag-button ${item === activeValue ? "active" : ""}" type="button" data-${dataName}="${escapeHtml(item)}">
          ${escapeHtml(item)}
        </button>
      `,
    )
    .join("");
}

function renderCategoryMeta(post) {
  return post.categories.map((category) => `<span class="dot">${escapeHtml(category)}</span>`).join("");
}

function renderContentBlock(block, post) {
  if (block.type === "h2") {
    return `<h2 id="${block.id}">${renderInline(block.text, post.sourcePath)}</h2>`;
  }
  if (block.type === "h3") {
    return `<h3 id="${block.id}">${renderInline(block.text, post.sourcePath)}</h3>`;
  }
  if (block.type === "quote") return `<blockquote>${renderInline(block.text, post.sourcePath)}</blockquote>`;
  if (block.type === "task") {
    return `
      <label class="task-line">
        <input type="checkbox" ${block.checked ? "checked" : ""} disabled />
        <span>${renderInline(block.text, post.sourcePath)}</span>
      </label>
    `;
  }
  if (block.type === "math") return `<div class="math-block">\\[${block.text}\\]</div>`;
  if (block.type === "code") {
    return `
      <div class="code-block">
        <pre><code class="language-${escapeHtml(block.lang)}">${escapeHtml(block.text)}</code></pre>
      </div>
    `;
  }
  if (block.type === "image") {
    return `
      <figure class="article-figure">
        <img src="${escapeHtml(block.src)}" alt="${escapeHtml(block.alt || "")}" loading="lazy" />
        ${block.caption ? `<figcaption>${renderInline(block.caption, post.sourcePath)}</figcaption>` : ""}
      </figure>
    `;
  }
  if (block.type === "table") {
    return `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>${block.headers.map((cell) => `<th>${renderInline(cell, post.sourcePath)}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${block.rows
              .map((row) => `<tr>${row.map((cell) => `<td>${renderInline(cell, post.sourcePath)}</td>`).join("")}</tr>`)
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  }
  if (block.type === "footnotes") {
    return `
      <section class="footnotes">
        <h2>脚注</h2>
        <ol>
          ${block.footnotes
            .map((note) => `<li id="fn-${slugify(note.id)}">${renderInline(note.text, post.sourcePath)}</li>`)
            .join("")}
        </ol>
      </section>
    `;
  }
  return `<p>${renderInline(block.text, post.sourcePath)}</p>`;
}

function typesetEnhancements() {
  if (window.MathJax?.typesetPromise) {
    window.MathJax.typesetPromise([app]).catch(() => {});
  }
  if (window.Prism?.highlightAllUnder) {
    window.Prism.highlightAllUnder(app);
  }
}

function renderCoverImage(src, alt, loading = "") {
  const cover = isBlank(src) ? DEFAULT_COVER : src;
  const classAttr = cover === DEFAULT_COVER ? ' class="default-cover"' : "";
  const loadingAttr = loading ? ` loading="${escapeHtml(loading)}"` : "";
  return `<img src="${escapeHtml(cover)}" alt="${escapeHtml(alt)}"${classAttr}${loadingAttr} onerror="this.onerror=null;this.classList.add('default-cover');this.src='${DEFAULT_COVER}';" />`;
}

function renderPostCard(post) {
  return `
    <article class="post-card">
      <a href="#post/${post.slug}">
        <div class="thumb">
          ${renderCoverImage(post.cover, `${post.title} 封面`, "lazy")}
        </div>
        <div class="body">
          <div class="meta">
            <span>${formatDate(post.date)}</span>
            ${renderCategoryMeta(post)}
            ${!isBlank(post.series) ? `<span class="dot">${escapeHtml(post.series)}</span>` : ""}
            <span class="dot">${escapeHtml(post.readTime)}</span>
          </div>
          <h3>${highlight(post.title)}</h3>
          <p>${highlight(post.excerpt)}</p>
        </div>
      </a>
    </article>
  `;
}

function renderPostListItem(post) {
  return `
    <article class="post-list-item">
      <a href="#post/${post.slug}">
        <div class="list-thumb">
          ${renderCoverImage(post.cover, `${post.title} 封面`, "lazy")}
        </div>
        <div class="list-body">
          <div class="meta">
            <span>${formatDate(post.date)}</span>
            ${renderCategoryMeta(post)}
            ${!isBlank(post.series) ? `<span class="dot">${escapeHtml(post.series)}</span>` : ""}
            <span class="dot">${escapeHtml(post.readTime)}</span>
          </div>
          <h3>${highlight(post.title)}</h3>
          <p>${highlight(post.excerpt)}</p>
        </div>
      </a>
    </article>
  `;
}

function renderImportPanel() {
  return `
    <section class="import-panel">
      <div>
        <h2>导入本地笔记</h2>
        <p>选择单个 Markdown，或选择包含 index.md 与 attachments/ 的笔记文件夹。导入内容只在当前浏览器预览；长期保存请放入 content/ 后运行 manifest 生成器。</p>
      </div>
      <div class="import-actions">
        <label class="file-button">
          <span>选择 Markdown</span>
          <input id="markdownFileInput" type="file" accept=".md,.markdown" />
        </label>
        <label class="file-button">
          <span>选择笔记文件夹</span>
          <input id="folderInput" type="file" webkitdirectory directory multiple />
        </label>
      </div>
      <p class="import-status" id="importStatus"></p>
    </section>
  `;
}

function renderSeriesList() {
  const groups = getSeriesGroups();
  if (!groups.length) return "";
  return groups
    .map(
      (group) => `
        <li>
          <a href="#series/${encodeURIComponent(group.name)}">
            <strong>${escapeHtml(group.name)}</strong>
            <span>${group.posts.length} 篇</span>
          </a>
        </li>
      `,
    )
    .join("");
}

function renderSeriesIndexItem(group) {
  const preview = group.posts[0];
  return `
    <article class="post-list-item series-list-item">
      <a href="#series/${encodeURIComponent(group.name)}">
        <div class="list-thumb">
          ${renderCoverImage(preview?.cover, `${group.name} 专栏封面`, "lazy")}
        </div>
        <div class="list-body">
          <div class="meta">
            <span>${group.posts.length} 篇文章</span>
            <span class="dot">Series</span>
            ${preview ? `<span class="dot">${formatDate(preview.date)}</span>` : ""}
          </div>
          <h3>${escapeHtml(group.name)}</h3>
          <p>${escapeHtml(preview?.excerpt || "这个专栏还没有摘要。")}</p>
        </div>
      </a>
    </article>
  `;
}

function renderSeriesIndexList(groups) {
  return groups.map(renderSeriesIndexItem).join("");
}

function renderResearchPanel() {
  const stats = getStats();
  return `
    <section class="research-panel">
      <div>
        <span>${stats.posts}</span>
        <strong>Notes</strong>
      </div>
      <div>
        <span>${stats.categories}</span>
        <strong>Categories</strong>
      </div>
      <div>
        <span>${stats.series}</span>
        <strong>Series</strong>
      </div>
      <div>
        <span>${stats.attachments}</span>
        <strong>Attachments</strong>
      </div>
    </section>
  `;
}

function renderHome() {
  const filteredPosts = getFilteredPosts();
  const pageData = paginateItems(filteredPosts, homePage);
  homePage = pageData.page;
  const rangeText = filteredPosts.length
    ? `${pageData.start + 1}-${pageData.start + pageData.items.length} / ${filteredPosts.length} 篇`
    : "0 篇";

  app.innerHTML = `
    <section class="intro-band" id="home">
      <div class="intro-copy">
        <p class="eyebrow">Research Notebook / 2026</p>
        <h1>计算物理、数学模型与代码实验的交汇处。</h1>
        <p>
          这里记录数值方法、PDE、Hamiltonian 系统、稀疏线性代数和研究工程化。
          每篇文章都尽量留下公式、图像、代码、附件和可复现线索。
        </p>
      </div>
      <aside class="search-panel" aria-label="文章筛选">
        <div class="search-box">
          <label for="searchInput">SEARCH FULL TEXT</label>
          <input id="searchInput" type="search" placeholder="Hamiltonian / PDE / solver / 正文关键词" value="${escapeHtml(searchTerm)}" />
        </div>
        <div class="filter-block">
          <div class="filter-label">CATEGORY</div>
          <div class="tag-row" id="categoryRow">${renderButtonRow(getCategories(), activeCategory, "category")}</div>
        </div>
      </aside>
    </section>

    <section class="home-list-section" aria-label="文章列表">
      <div class="list-heading">
        <h2>文章列表</h2>
        <span>${rangeText}</span>
      </div>
      ${
        filteredPosts.length
          ? `
            <div class="post-list">${pageData.items.map(renderPostListItem).join("")}</div>
            ${renderPagination(pageData, "home")}
          `
          : `<div class="empty-state">没有找到匹配的文章，换个关键词或筛选条件试试。</div>`
      }
      ${SHOW_LOCAL_IMPORT_TOOLS ? renderImportPanel() : ""}
    </section>
  `;

  bindHomeEvents();
  bindPaginationEvents();
}

function bindHomeEvents() {
  const searchInput = document.querySelector("#searchInput");
  const categoryRow = document.querySelector("#categoryRow");
  const seriesRow = document.querySelector("#seriesRow");
  const tagRow = document.querySelector("#tagRow");
  const markdownFileInput = document.querySelector("#markdownFileInput");
  const folderInput = document.querySelector("#folderInput");

  searchInput?.addEventListener("input", (event) => {
    searchTerm = event.target.value;
    homePage = 1;
    renderHome();
    document.querySelector("#searchInput")?.focus();
  });

  categoryRow?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-category]");
    if (!button) return;
    activeCategory = button.dataset.category;
    homePage = 1;
    renderHome();
  });

  seriesRow?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-series]");
    if (!button) return;
    activeSeries = button.dataset.series;
    homePage = 1;
    renderHome();
  });

  tagRow?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-tag]");
    if (!button) return;
    activeTag = button.dataset.tag;
    homePage = 1;
    renderHome();
  });

  markdownFileInput?.addEventListener("change", importMarkdownFile);
  folderInput?.addEventListener("change", importNoteFolder);
}

async function importMarkdownFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const markdown = await file.text();
  const post = postFromMarkdown(markdown, `local/${file.name}`, slugify(file.name.replace(/\.(md|markdown)$/i, "")));
  addImportedPost(post, "已导入 Markdown。图片若使用相对路径，请选择完整笔记文件夹导入。");
}

async function importNoteFolder(event) {
  const files = Array.from(event.target.files || []);
  const markdownFile = files.find((file) => /(^|\/)index\.md$/i.test(file.webkitRelativePath || file.name));
  if (!markdownFile) {
    setImportStatus("没有找到 index.md。请选择包含 index.md 的笔记文件夹。");
    return;
  }

  const objectUrls = new Map();
  files.forEach((file) => {
    const relativePath = file.webkitRelativePath || file.name;
    objectUrls.set(relativePath, URL.createObjectURL(file));
  });

  const folderRoot = (markdownFile.webkitRelativePath || "").split("/")[0] || "local-note";
  const markdown = await markdownFile.text();
  const post = postFromMarkdown(markdown, `${folderRoot}/index.md`, slugify(folderRoot), {
    attachments: files
      .map((file) => file.webkitRelativePath || file.name)
      .filter((filePath) => !/(^|\/)index\.md$/i.test(filePath)),
  });

  post.cover = objectUrls.get(`${folderRoot}/${post.cover.replace(`${folderRoot}/`, "")}`) || post.cover;
  post.attachments = post.attachments.map((attachment) => ({
    ...attachment,
    path: objectUrls.get(attachment.path) || attachment.path,
  }));
  post.content = post.content.map((block) => {
    if (block.type !== "image") return block;
    const relative = block.src.replace(`${folderRoot}/`, "");
    return { ...block, src: objectUrls.get(`${folderRoot}/${relative}`) || block.src };
  });

  addImportedPost(post, "已导入笔记文件夹。此导入只在当前浏览器会话中预览。");
}

function addImportedPost(post, message) {
  posts = [post, ...posts.filter((item) => item.slug !== post.slug)];
  activeCategory = "全部";
  activeSeries = "全部";
  activeTag = "全部";
  searchTerm = "";
  renderHome();
  setImportStatus(message);
}

function setImportStatus(message) {
  const status = document.querySelector("#importStatus");
  if (status) status.textContent = message;
}

function getPostToc(post) {
  return post.content.filter((block) => block.type === "h2" || block.type === "h3");
}

function renderResearchLinks(post) {
  const entries = [
    ["状态", post.research.status],
    ["论文", post.research.paper],
    ["代码", post.research.repo],
    ["数据", post.research.dataset],
  ].filter(([, value]) => value);

  if (!entries.length) return "";

  return `
    <h2>研究线索</h2>
    <dl>
      ${entries
        .map(([label, value]) => {
          const isLink = /^(https?:|attachments\/|content\/|\/)/.test(value);
          const resolved = resolveAssetPath(post.sourcePath, value);
          return `
            <dt>${label}</dt>
            <dd>${
              isLink
                ? `<a class="text-link" href="${escapeHtml(resolved)}" target="_blank" rel="noreferrer">${escapeHtml(value)}</a>`
                : escapeHtml(value)
            }</dd>
          `;
        })
        .join("")}
    </dl>
  `;
}

function renderAttachments(post) {
  if (!post.attachments.length) return "";

  return `
    <h2>本文附件</h2>
    <ul class="attachment-list">
      ${post.attachments
        .map(
          (attachment) => `
            <li>
              <a href="${escapeHtml(attachment.path)}" target="_blank" rel="noreferrer">
                <span>${escapeHtml(attachment.name)}</span>
                <small>${escapeHtml(attachment.path)}</small>
              </a>
            </li>
          `,
        )
        .join("")}
    </ul>
  `;
}

function renderArticle(slug) {
  const post = posts.find((item) => item.slug === slug);
  if (!post) {
    window.location.hash = "#home";
    return;
  }

  const seriesPosts = !isBlank(post.series)
    ? posts
        .filter((item) => item.series === post.series)
        .sort((a, b) => a.seriesOrder - b.seriesOrder || new Date(a.date) - new Date(b.date))
    : [];
  const toc = getPostToc(post);

  app.innerHTML = `
    <article class="article-page">
      <a class="back-link" href="#home">返回文章列表</a>
      <header class="article-header">
        <div>
          <div class="meta">
            <span>${formatDate(post.date)}</span>
            ${renderCategoryMeta(post)}
            ${!isBlank(post.series) ? `<span class="dot">${escapeHtml(post.series)}</span>` : ""}
            <span class="dot">${escapeHtml(post.readTime)}</span>
          </div>
          <h1>${escapeHtml(post.title)}</h1>
        </div>
      </header>
      <div class="article-layout">
        <div class="article-body">
          ${post.content.map((block) => renderContentBlock(block, post)).join("")}
        </div>
        <aside class="article-aside">
          ${
            toc.length
              ? `
                <h2>目录</h2>
                <ol class="toc-list">
                  ${toc
                    .map(
                      (item) => `
                        <li class="level-${item.level}">
                          <a href="#${item.id}">${escapeHtml(item.text)}</a>
                        </li>
                      `,
                    )
                    .join("")}
                </ol>
              `
              : ""
          }
          <h2>文章信息</h2>
          <dl>
            <dt>分类</dt>
            <dd>${escapeHtml(post.categories.join(" / "))}</dd>
            <dt>专栏</dt>
            <dd>${escapeHtml(isBlank(post.series) ? "无" : post.series)}</dd>
            <dt>来源</dt>
            <dd>${escapeHtml(post.sourcePath)}</dd>
          </dl>
          ${renderResearchLinks(post)}
          ${renderAttachments(post)}
          ${
            seriesPosts.length
              ? `
                <h2>同专栏</h2>
                <ol>
                  ${seriesPosts
                    .map(
                      (item) => `
                        <li class="${item.slug === post.slug ? "current" : ""}">
                          <a href="#post/${item.slug}">${escapeHtml(item.title)}</a>
                        </li>
                      `,
                    )
                    .join("")}
                </ol>
              `
              : ""
          }
        </aside>
      </div>
    </article>
  `;

  typesetEnhancements();
}

function renderSeriesPage(seriesName) {
  const group = getSeriesGroups().find((item) => item.name === seriesName);
  if (!group) {
    window.location.hash = "#home";
    return;
  }
  const pageData = paginateItems(group.posts, seriesPostPage);
  seriesPostPage = pageData.page;
  const rangeText = group.posts.length
    ? `${pageData.start + 1}-${pageData.start + pageData.items.length} / ${group.posts.length} 篇`
    : "0 篇";

  app.innerHTML = `
    <section class="series-page">
      <a class="back-link" href="#home">返回文章列表</a>
      <header class="series-hero">
        <p class="eyebrow">Series</p>
        <h1>${escapeHtml(seriesName)}</h1>
        <p>这个专栏共有 ${group.posts.length} 篇文章，按 seriesOrder 排列，适合连续阅读。</p>
      </header>
      <div class="list-heading">
        <h2>文章列表</h2>
        <span>${rangeText}</span>
      </div>
      <div class="post-list series-post-list">
        ${pageData.items.map(renderPostListItem).join("")}
      </div>
      ${renderPagination(pageData, "series-posts")}
    </section>
  `;
  bindPaginationEvents();
}

function renderSeriesIndex() {
  const groups = getSeriesGroups();
  const pageData = paginateItems(groups, seriesIndexPage);
  seriesIndexPage = pageData.page;
  const rangeText = groups.length ? `${pageData.start + 1}-${pageData.start + pageData.items.length} / ${groups.length} 个` : "0 个";

  app.innerHTML = `
    <section class="series-page">
      <a class="back-link" href="#home">返回文章列表</a>
      <header class="series-hero">
        <p class="eyebrow">All Series</p>
        <h1>专栏</h1>
        <p>这里按 series 字段自动聚合文章。给多篇文章写同一个 series 名字，它们就会组成一个连续阅读的专栏。</p>
      </header>
      <div class="list-heading">
        <h2>专栏列表</h2>
        <span>${rangeText}</span>
      </div>
      ${
        groups.length
          ? `
            <div class="post-list series-index-list">
              ${renderSeriesIndexList(pageData.items)}
            </div>
            ${renderPagination(pageData, "series-index")}
          `
          : `<div class="empty-state">还没有专栏。给文章添加 series 字段后，这里会自动出现专栏。</div>`
      }
    </section>
  `;
  bindPaginationEvents();
}

function renderProfileInfoItem(item, index) {
  return `
    <article class="post-list-item profile-list-item">
      <div class="profile-row">
        <div class="list-thumb profile-index">${String(index + 1).padStart(2, "0")}</div>
        <div class="list-body">
          <div class="meta">
            <span>${escapeHtml(item.meta)}</span>
            <span class="dot">Profile</span>
          </div>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.text)}</p>
        </div>
      </div>
    </article>
  `;
}

function renderProfileLinkItem(link) {
  const external = /^https?:/.test(link.href);
  return `
    <article class="post-list-item profile-list-item">
      <a href="${escapeHtml(link.href)}" ${external ? 'target="_blank" rel="noreferrer"' : ""}>
        <div class="list-thumb profile-index">Go</div>
        <div class="list-body">
          <div class="meta">
            <span>Contact</span>
            <span class="dot">${external ? "External" : "Site"}</span>
          </div>
          <h3>${escapeHtml(link.label)}</h3>
          <p>${escapeHtml(link.href)}</p>
        </div>
      </a>
    </article>
  `;
}

function renderProfile() {
  const profileItems = SITE_PROFILE.introItems.filter(
    (item) => !isBlank(item.title) && !isBlank(item.text),
  );
  const profileLinks = SITE_PROFILE.links.filter(
    (link) => !isBlank(link.label) && !isBlank(link.href),
  );

  app.innerHTML = `
    <section class="series-page profile-page" id="profile">
      <a class="back-link" href="#home">返回文章列表</a>
      <header class="series-hero">
        <p class="eyebrow">${escapeHtml(SITE_PROFILE.profileEyebrow)}</p>
        <h1>${escapeHtml(SITE_PROFILE.profileTitle)}</h1>
        <p>${escapeHtml(SITE_PROFILE.profileIntro)}</p>
      </header>

      <div class="list-heading">
        <h2>介绍</h2>
        <span>${profileItems.length} 项</span>
      </div>
      <div class="post-list profile-list">
        ${profileItems.map(renderProfileInfoItem).join("")}
      </div>

      <div class="list-heading profile-contact-heading">
        <h2>联系方式</h2>
        <span>${profileLinks.length} 个</span>
      </div>
      <div class="post-list profile-list">
        ${profileLinks.map(renderProfileLinkItem).join("")}
      </div>
    </section>
  `;
}

function renderAbout() {
  renderProfile();
}

function renderContact() {
  renderProfile();
}

function renderGuide() {
  app.innerHTML = `
    <section class="about-page">
      <a class="back-link" href="#home">返回文章列表</a>
      <div class="about-panel">
        <div>
          <p class="eyebrow">Guide</p>
          <h1>如何写一篇新笔记。</h1>
        </div>
        <div>
          <p>每篇文章一个独立文件夹，正文使用 Markdown，附件放在同级 attachments/ 目录。新增文章后运行 manifest 生成器，网站会自动发现文章和附件。</p>
          <div class="code-block"><pre><code class="language-bash">${escapeHtml(`node scripts/generate-manifest.mjs`)}</code></pre></div>
          <div class="code-block"><pre><code class="language-text">${escapeHtml(`content/
  manifest.json
  symplectic-integrator-notes/
    index.md
    attachments/
      cover.png
      phase-plot.png
      result.csv`)}</code></pre></div>
          <p>独立文章不需要专栏，直接省略 series 和 seriesOrder：</p>
          <div class="code-block"><pre><code class="language-yaml">${escapeHtml(`---
title: 一个独立的误差分析笔记
date: 2026-06-08
readTime: 5 分钟
categories: [数学札记, 数值方法]
tags: [误差分析, PDE]
status: experiment
paper: arXiv:xxxx.xxxxx
repo: https://github.com/your/name
dataset: attachments/result.csv
cover: attachments/cover.png
excerpt: 这篇文章不属于任何专栏。
---`)}</code></pre></div>
          <p>如果文章属于一个系列，再写 series 和 seriesOrder：</p>
          <div class="code-block"><pre><code class="language-yaml">${escapeHtml(`---
title: 辛积分方法笔记
date: 2026-06-08
readTime: 8 分钟
categories: [计算物理, 数值方法]
series: 结构保持算法
seriesOrder: 2
tags: [计算物理, Hamiltonian, 数值方法]
cover: attachments/cover.png
excerpt: 这是一篇关于辛积分的研究笔记。
---`)}</code></pre></div>
          <p>Markdown 支持行内公式、块级公式、图片、代码块、表格、链接、脚注和任务列表。本地导入工具默认隐藏，只建议本地预览时临时开启。完整说明已经写在 README.md。</p>
        </div>
      </div>
    </section>
  `;
  typesetEnhancements();
}

function route() {
  const hash = window.location.hash || "#home";
  if (hash.startsWith("#post/")) {
    renderArticle(hash.replace("#post/", ""));
  } else if (hash === "#series") {
    activeSeries = "全部";
    renderSeriesIndex();
  } else if (hash.startsWith("#series/")) {
    const nextSeries = decodeURIComponent(hash.replace("#series/", ""));
    if (activeSeries !== nextSeries) seriesPostPage = 1;
    activeSeries = nextSeries;
    renderSeriesPage(activeSeries);
  } else if (hash === "#profile" || hash === "#about" || hash === "#contact") {
    renderProfile();
  } else if (hash === "#guide") {
    renderGuide();
  } else {
    renderHome();
  }

  window.scrollTo({ top: 0, behavior: "instant" });
  typesetEnhancements();
}

async function initialize() {
  app.innerHTML = `<div class="empty-state">正在加载研究笔记...</div>`;
  try {
    posts = await loadManifestPosts();
    route();
  } catch (error) {
    app.innerHTML = `
      <div class="empty-state">
        内容加载失败：${escapeHtml(error.message)}
      </div>
    `;
  }
}

window.addEventListener("hashchange", route);
initialize();
