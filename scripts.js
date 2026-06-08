let posts = [];
let activeCategory = "全部";
let activeSeries = "全部";
let activeTag = "全部";
let searchTerm = "";

const app = document.querySelector("#app");

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
    .replaceAll(">", "&gt;");
}

function slugify(value) {
  return String(value)
    .trim()
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
  if (Array.isArray(value)) return value.filter(Boolean);
  if (value) return [value];
  return fallback;
}

function parseMarkdown(markdown, markdownPath) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
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

    const fence = trimmed.match(/^```(\w+)?/);
    if (fence) {
      flushParagraph();
      const code = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        code.push(lines[index]);
        index += 1;
      }
      blocks.push({ type: "code", lang: fence[1] || "", text: code.join("\n") });
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
      blocks.push({ type: heading[1].length === 2 ? "h2" : "h3", text: heading[2] });
      continue;
    }

    if (trimmed.startsWith(">")) {
      flushParagraph();
      blocks.push({ type: "quote", text: trimmed.replace(/^>\s?/, "") });
      continue;
    }

    paragraph.push(trimmed);
  }

  flushParagraph();
  return blocks;
}

function postFromMarkdown(markdown, markdownPath, fallbackSlug) {
  const { attrs, body } = parseFrontMatter(markdown);
  const title = attrs.title || fallbackSlug;
  const slug = attrs.slug || fallbackSlug || slugify(title);
  const categories = normalizeList(attrs.categories, normalizeList(attrs.category, ["未分类"]));
  return {
    slug,
    title,
    date: attrs.date || new Date().toISOString().slice(0, 10),
    readTime: attrs.readTime || "未估算",
    category: categories[0],
    categories,
    series: attrs.series || "",
    seriesOrder: Number(attrs.seriesOrder || 0),
    tags: normalizeList(attrs.tags),
    cover: resolveAssetPath(markdownPath, attrs.cover || ""),
    excerpt: attrs.excerpt || "这篇笔记还没有摘要。",
    content: parseMarkdown(body, markdownPath),
    sourcePath: markdownPath,
  };
}

async function loadManifestPosts() {
  const manifestResponse = await fetch("content/manifest.json");
  if (!manifestResponse.ok) throw new Error("content/manifest.json 加载失败");
  const manifest = await manifestResponse.json();

  const loaded = await Promise.all(
    manifest.notes.map(async (entry) => {
      const response = await fetch(entry.path);
      if (!response.ok) throw new Error(`${entry.path} 加载失败`);
      return postFromMarkdown(await response.text(), entry.path, entry.slug);
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
    ...Array.from(new Set(posts.map((post) => post.series).filter(Boolean))),
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
    const matchesSeries = activeSeries === "全部" || post.series === activeSeries;
    const matchesTag = activeTag === "全部" || post.tags.includes(activeTag);
    const haystack = [
      post.title,
      post.excerpt,
      ...post.categories,
      post.series,
      ...post.tags,
    ]
      .join(" ")
      .toLowerCase();
    return matchesCategory && matchesSeries && matchesTag && (!query || haystack.includes(query));
  });
}

function renderButtonRow(items, activeValue, dataName) {
  return items
    .map(
      (item) => `
        <button class="tag-button ${item === activeValue ? "active" : ""}" type="button" data-${dataName}="${item}">
          ${item}
        </button>
      `,
    )
    .join("");
}

function renderCategoryMeta(post) {
  return post.categories.map((category) => `<span class="dot">${category}</span>`).join("");
}

function renderContentBlock(block) {
  if (block.type === "h2") return `<h2>${block.text}</h2>`;
  if (block.type === "h3") return `<h3>${block.text}</h3>`;
  if (block.type === "quote") return `<blockquote>${block.text}</blockquote>`;
  if (block.type === "math") return `<div class="math-block">\\[${block.text}\\]</div>`;
  if (block.type === "code") {
    return `
      <div class="code-block">
        <pre><code>${escapeHtml(block.text)}</code></pre>
      </div>
    `;
  }
  if (block.type === "image") {
    return `
      <figure class="article-figure">
        <img src="${block.src}" alt="${block.alt || ""}" loading="lazy" />
        ${block.caption ? `<figcaption>${block.caption}</figcaption>` : ""}
      </figure>
    `;
  }
  return `<p>${block.text}</p>`;
}

function typesetMath() {
  if (window.MathJax?.typesetPromise) {
    window.MathJax.typesetPromise([app]).catch(() => {});
  }
}

function renderPostCard(post) {
  return `
    <article class="post-card">
      <a href="#post/${post.slug}">
        <div class="thumb">
          <img src="${post.cover}" alt="${post.title} 封面" loading="lazy" />
        </div>
        <div class="body">
          <div class="meta">
            <span>${formatDate(post.date)}</span>
            ${renderCategoryMeta(post)}
            ${post.series ? `<span class="dot">${post.series}</span>` : ""}
            <span class="dot">${post.readTime}</span>
          </div>
          <h3>${post.title}</h3>
          <p>${post.excerpt}</p>
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
        <p>选择单个 Markdown，或选择包含 index.md 与 attachments/ 的笔记文件夹。导入内容只在当前浏览器预览。</p>
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
            <strong>${group.name}</strong>
            <span>${group.posts.length} 篇</span>
          </a>
        </li>
      `,
    )
    .join("");
}

function renderHome() {
  const [featured, ...rest] = getFilteredPosts();
  const archive = posts
    .slice(0, 5)
    .map(
      (post) => `
        <li>
          <a href="#post/${post.slug}">
            <strong>${post.title}</strong>
            <span>${formatDate(post.date)}</span>
          </a>
        </li>
      `,
    )
    .join("");

  app.innerHTML = `
    <section class="intro-band" id="home">
      <div class="intro-copy">
        <p class="eyebrow">Research Notebook / 2026</p>
        <h1>计算物理、数学模型与代码实验的交汇处。</h1>
        <p>
          这里记录数值方法、PDE、Hamiltonian 系统、稀疏线性代数和研究工程化。
          每篇文章都尽量留下公式、图像、代码和可复现线索。
        </p>
      </div>
      <aside class="search-panel" aria-label="文章筛选">
        <div class="search-box">
          <label for="searchInput">SEARCH</label>
          <input id="searchInput" type="search" placeholder="Hamiltonian / PDE / solver" value="${searchTerm}" />
        </div>
        <div class="filter-block">
          <div class="filter-label">CATEGORY</div>
          <div class="tag-row" id="categoryRow">${renderButtonRow(getCategories(), activeCategory, "category")}</div>
        </div>
        <div class="filter-block">
          <div class="filter-label">SERIES</div>
          <div class="tag-row" id="seriesRow">${renderButtonRow(getSeries(), activeSeries, "series")}</div>
        </div>
        <div class="filter-block">
          <div class="filter-label">TAG</div>
          <div class="tag-row" id="tagRow">${renderButtonRow(getTags(), activeTag, "tag")}</div>
        </div>
      </aside>
    </section>

    <section class="home-layout">
      <div>
        ${
          featured
            ? `
              <a class="featured-link" href="#post/${featured.slug}">
                <div class="featured-media">
                  <img src="${featured.cover}" alt="${featured.title} 封面" />
                </div>
                <div class="featured-body">
                  <div class="meta">
                    <span>${formatDate(featured.date)}</span>
                    ${renderCategoryMeta(featured)}
                    ${featured.series ? `<span class="dot">${featured.series}</span>` : ""}
                    <span class="dot">${featured.readTime}</span>
                  </div>
                  <h2>${featured.title}</h2>
                  <p>${featured.excerpt}</p>
                </div>
              </a>
              <div class="post-grid">${rest.map(renderPostCard).join("")}</div>
            `
            : `<div class="empty-state">没有找到匹配的文章，换个关键词或筛选条件试试。</div>`
        }
        ${renderImportPanel()}
      </div>

      <aside class="sidebar">
        <section class="side-section">
          <h2>FOCUS</h2>
          <ul class="now-list">
            <li>长时间数值积分中的结构保持方法。</li>
            <li>PDE 离散化、谱方法和误差分析。</li>
            <li>面向可复现实验的代码与数据流程。</li>
          </ul>
        </section>
        <section class="side-section">
          <h2>SERIES</h2>
          <ul class="archive-list">${renderSeriesList()}</ul>
        </section>
        <section class="side-section">
          <h2>RECENT</h2>
          <ul class="archive-list">${archive}</ul>
        </section>
        <section class="side-section">
          <h2>GUIDE</h2>
          <p>文章来自 content/ 下的 Markdown 文件。每篇文章有独立 attachments/ 文件夹；分类和专栏写在 Markdown 头信息里。</p>
          <p><a class="text-link" href="#guide">查看使用说明</a></p>
        </section>
      </aside>
    </section>
  `;

  bindHomeEvents();
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
    renderHome();
    document.querySelector("#searchInput")?.focus();
  });

  categoryRow?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-category]");
    if (!button) return;
    activeCategory = button.dataset.category;
    renderHome();
  });

  seriesRow?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-series]");
    if (!button) return;
    activeSeries = button.dataset.series;
    renderHome();
  });

  tagRow?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-tag]");
    if (!button) return;
    activeTag = button.dataset.tag;
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
    objectUrls.set(relativePath.replace(/^.*?\/index\.md$/i, "index.md"), URL.createObjectURL(file));
    objectUrls.set(relativePath, URL.createObjectURL(file));
  });

  const folderRoot = (markdownFile.webkitRelativePath || "").split("/")[0] || "local-note";
  const markdown = await markdownFile.text();
  const post = postFromMarkdown(markdown, `${folderRoot}/index.md`, slugify(folderRoot));
  post.cover = objectUrls.get(`${folderRoot}/${post.cover.replace(`${folderRoot}/`, "")}`) || post.cover;
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

function renderArticle(slug) {
  const post = posts.find((item) => item.slug === slug);
  if (!post) {
    window.location.hash = "#home";
    return;
  }

  const seriesPosts = post.series
    ? posts
        .filter((item) => item.series === post.series)
        .sort((a, b) => a.seriesOrder - b.seriesOrder || new Date(a.date) - new Date(b.date))
    : [];

  app.innerHTML = `
    <article class="article-page">
      <a class="back-link" href="#home">返回文章列表</a>
      <header class="article-header">
        <div>
          <div class="meta">
            <span>${formatDate(post.date)}</span>
            ${renderCategoryMeta(post)}
            ${post.series ? `<span class="dot">${post.series}</span>` : ""}
            <span class="dot">${post.readTime}</span>
          </div>
          <h1>${post.title}</h1>
        </div>
        <figure class="article-cover">
          <img src="${post.cover}" alt="${post.title} 封面" />
        </figure>
      </header>
      <div class="article-layout">
        <div class="article-body">
          ${post.content.map(renderContentBlock).join("")}
        </div>
        <aside class="article-aside">
          <h2>文章信息</h2>
          <dl>
            <dt>分类</dt>
            <dd>${post.categories.join(" / ")}</dd>
            <dt>专栏</dt>
            <dd>${post.series || "无"}</dd>
            <dt>来源</dt>
            <dd>${post.sourcePath}</dd>
          </dl>
          ${
            seriesPosts.length
              ? `
                <h2>同专栏</h2>
                <ol>
                  ${seriesPosts
                    .map(
                      (item) => `
                        <li class="${item.slug === post.slug ? "current" : ""}">
                          <a href="#post/${item.slug}">${item.title}</a>
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

  typesetMath();
}

function renderAbout() {
  app.innerHTML = `
    <section class="about-page" id="about">
      <a class="back-link" href="#home">返回文章列表</a>
      <div class="about-panel">
        <div>
          <p class="eyebrow">About / Research</p>
          <h1>计算、物理和数学之间的研究笔记。</h1>
        </div>
        <div>
          <p>
            我关注计算物理、数值分析、PDE、Hamiltonian 系统和科学计算工具链。
            这个博客会放推导、实验记录、代码片段、论文阅读和可视化结果。
          </p>
          <p>
            写作目标是让每个想法都能被重新检查：假设清楚，公式可追踪，实验可复现，代码能回到具体问题。
          </p>
          <div class="contact-row">
            <a href="mailto:hello@example.com">Email</a>
            <a href="https://github.com/" target="_blank" rel="noreferrer">GitHub</a>
            <a href="#guide">使用说明</a>
          </div>
        </div>
      </div>
    </section>
  `;
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
          <p>每篇文章一个独立文件夹，正文使用 Markdown，附件放在同级 attachments/ 目录。</p>
          <div class="code-block"><pre><code>${escapeHtml(`content/
  manifest.json
  symplectic-integrator-notes/
    index.md
    attachments/
      cover.png
      phase-plot.png`)}</code></pre></div>
          <p>在 index.md 开头写分类和专栏信息：</p>
          <div class="code-block"><pre><code>${escapeHtml(`---
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
          <p>如果只有一个分类，也可以写 category: 计算物理。最后把文章登记到 content/manifest.json。完整说明已经写在 README.md。</p>
        </div>
      </div>
    </section>
  `;
}

function route() {
  const hash = window.location.hash || "#home";
  if (hash.startsWith("#post/")) {
    renderArticle(hash.replace("#post/", ""));
  } else if (hash.startsWith("#series/")) {
    activeSeries = decodeURIComponent(hash.replace("#series/", ""));
    renderHome();
  } else if (hash === "#about") {
    renderAbout();
  } else if (hash === "#guide") {
    renderGuide();
  } else {
    renderHome();
  }

  window.scrollTo({ top: 0, behavior: "instant" });
  typesetMath();
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
