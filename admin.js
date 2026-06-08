const app = document.querySelector("#adminApp");
const state = {
  authenticated: false,
  options: { categories: [], tags: [], series: [] },
};

const defaultBody = `## 问题背景

这里写研究问题、模型假设和符号约定。

$$
\\dot q = \\frac{\\partial H}{\\partial p}
$$

## 数值实验

这里写实验设置、参数和结果。

\`\`\`python
print("hello simulation")
\`\`\`

## 结论

- [ ] 补充误差分析
- [ ] 上传结果图到 attachments/
`;

init();

async function init() {
  try {
    const session = await fetchJson("/api/session");
    state.authenticated = session.authenticated;
    if (!state.authenticated) {
      renderLogin();
      return;
    }
    await loadOptions();
    renderEditor();
  } catch (error) {
    renderServerMissing(error);
  }
}

function renderServerMissing(error) {
  app.innerHTML = `
    <section class="login-panel">
      <h1>后台服务未启动</h1>
      <p>
        当前页面需要 Node 服务提供登录和保存 API。你现在很可能使用的是
        <code>python3 -m http.server 4173</code> 静态服务，所以 <code>/api/session</code>
        不存在，后台无法初始化。
      </p>
      <p>请在项目目录运行：</p>
      <pre><code>node server.mjs</code></pre>
      <p>然后访问：</p>
      <pre><code>http://localhost:4173/admin</code></pre>
      <p class="status">错误信息：${escapeHtml(error.message)}</p>
      <div class="actions">
        <a href="/"><button type="button">返回博客</button></a>
      </div>
    </section>
  `;
}

function renderLogin() {
  app.innerHTML = `
    <section class="login-panel">
      <h1>写作后台</h1>
      <p>请输入 .env 中配置的账号密码。</p>
      <form id="loginForm">
        <label>
          账号
          <input name="username" autocomplete="username" required />
        </label>
        <label>
          密码
          <input name="password" type="password" autocomplete="current-password" required />
        </label>
        <div class="actions">
          <button class="primary" type="submit">登录</button>
          <a href="/"><button type="button">返回博客</button></a>
        </div>
        <p class="status" id="loginStatus"></p>
      </form>
    </section>
  `;

  document.querySelector("#loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.target);
    const status = document.querySelector("#loginStatus");
    status.textContent = "正在登录...";
    try {
      await fetchJson("/api/login", {
        method: "POST",
        body: JSON.stringify({
          username: form.get("username"),
          password: form.get("password"),
        }),
      });
      await init();
    } catch (error) {
      status.textContent = error.message;
    }
  });
}

async function loadOptions() {
  state.options = await fetchJson("/api/options");
}

function renderEditor() {
  const today = new Date().toISOString().slice(0, 10);
  app.innerHTML = `
    <div class="shell">
      <header class="topbar">
        <div>
          <h1>在线写作</h1>
          <p>保存后会写入 content/&lt;slug&gt;/index.md，并自动刷新 manifest。专栏为空时就是独立文章。</p>
        </div>
        <div class="actions">
          <a href="/"><button type="button">查看博客</button></a>
          <button class="danger" id="logoutButton" type="button">退出</button>
        </div>
      </header>

      <div class="editor-grid">
        <section>
          <h2>固定模板字段</h2>
          <div class="field-grid">
            ${field("title", "标题", "辛积分方法笔记")}
            ${field("slug", "Slug", "symplectic-integrator-notes")}
            ${field("date", "日期", today, "date")}
            ${field("readTime", "阅读时长", "8 分钟")}
            ${field("categories", "分类，多分类用逗号", "计算物理, 数值方法")}
            ${field("tags", "标签，用逗号分隔", "Hamiltonian, 辛积分")}
            ${seriesField()}
            ${field("seriesOrder", "专栏顺序，专栏为空时忽略", "1", "number")}
            ${field("status", "状态", "experiment")}
            ${field("paper", "论文 / arXiv / PDF", "")}
            ${field("repo", "代码仓库", "")}
            ${field("dataset", "数据文件", "attachments/result.csv")}
            ${field("cover", "封面", "attachments/cover.png")}
          </div>
          <label>
            摘要
            <input id="excerpt" value="这是一篇新的研究笔记。" />
          </label>
          <label>
            正文 Markdown
            <textarea id="body">${defaultBody}</textarea>
          </label>
          <div class="actions">
            <button class="primary" id="saveButton" type="button">保存文章</button>
            <button id="templateButton" type="button">重置模板</button>
          </div>
          <p class="hint">专栏字段留空就是独立文章；保存时不会写入 series 和 seriesOrder。</p>
          <p class="status" id="saveStatus"></p>
        </section>

        <aside class="preview-panel">
          <h2>实时预览</h2>
          <article class="preview" id="preview"></article>
        </aside>
      </div>
    </div>
  `;

  document.querySelector("#logoutButton").addEventListener("click", logout);
  document.querySelector("#saveButton").addEventListener("click", saveNote);
  document.querySelector("#templateButton").addEventListener("click", () => {
    document.querySelector("#body").value = defaultBody;
    updatePreview();
  });
  document.querySelectorAll("input, textarea, select").forEach((item) => {
    item.addEventListener("input", updatePreview);
    item.addEventListener("change", updatePreview);
  });
  document.querySelector("#title").addEventListener("input", updateSlugFromTitle);
  updatePreview();
}

function field(id, label, value = "", type = "text") {
  return `
    <label>
      ${label}
      <input id="${id}" type="${type}" value="${escapeHtml(value)}" />
    </label>
  `;
}

function seriesField() {
  return `
    <label>
      专栏，留空表示无专栏
      <input id="series" list="seriesOptions" placeholder="留空就是独立文章" />
      <datalist id="seriesOptions">
        ${state.options.series.map((item) => `<option value="${escapeHtml(item)}"></option>`).join("")}
      </datalist>
    </label>
  `;
}

function updateSlugFromTitle() {
  const slug = document.querySelector("#slug");
  if (!isBlank(slug.value)) return;
  slug.value = slugify(document.querySelector("#title").value);
}

function collectNote() {
  const value = (id) => document.querySelector(`#${id}`).value.trim();
  return {
    title: value("title"),
    slug: value("slug") || slugify(value("title")),
    date: value("date"),
    readTime: value("readTime"),
    categories: value("categories"),
    tags: value("tags"),
    series: value("series"),
    seriesOrder: value("seriesOrder"),
    status: value("status"),
    paper: value("paper"),
    repo: value("repo"),
    dataset: value("dataset"),
    cover: value("cover"),
    excerpt: value("excerpt"),
    body: document.querySelector("#body").value,
  };
}

function buildFrontMatter(note) {
  const categories = parseList(note.categories);
  const tags = parseList(note.tags);
  const lines = [
    "---",
    `title: ${note.title || "未命名文章"}`,
    `date: ${note.date}`,
    `readTime: ${note.readTime || "5 分钟"}`,
    categories.length === 1
      ? `category: ${categories[0]}`
      : `categories: [${categories.join(", ")}]`,
    !isBlank(note.series) ? `series: ${note.series}` : "",
    !isBlank(note.series) && !isBlank(note.seriesOrder)
      ? `seriesOrder: ${Number(note.seriesOrder) || 1}`
      : "",
    tags.length ? `tags: [${tags.join(", ")}]` : "",
    !isBlank(note.status) ? `status: ${note.status}` : "",
    !isBlank(note.paper) ? `paper: ${note.paper}` : "",
    !isBlank(note.repo) ? `repo: ${note.repo}` : "",
    !isBlank(note.dataset) ? `dataset: ${note.dataset}` : "",
    `cover: ${note.cover || "attachments/cover.png"}`,
    `excerpt: ${note.excerpt || "这篇文章还没有摘要。"}`,
    "---",
  ];
  return lines.filter((line) => line !== "").join("\n");
}

function updatePreview() {
  const note = collectNote();
  const markdown = `${buildFrontMatter(note)}\n\n${note.body}`;
  document.querySelector("#preview").innerHTML = renderMarkdown(markdown);
  if (window.MathJax?.typesetPromise) {
    window.MathJax.typesetPromise([document.querySelector("#preview")]).catch(() => {});
  }
}

async function saveNote() {
  const status = document.querySelector("#saveStatus");
  const note = collectNote();
  if (isBlank(note.title)) {
    status.textContent = "标题不能为空。";
    return;
  }
  if (!parseList(note.categories).length) {
    status.textContent = "至少需要一个分类。";
    return;
  }

  status.textContent = "正在保存...";
  try {
    const result = await fetchJson("/api/notes", {
      method: "POST",
      body: JSON.stringify(note),
    });
    status.textContent = `已保存：${result.path}，manifest 共 ${result.manifestCount} 篇。`;
    await loadOptions();
  } catch (error) {
    status.textContent = error.message;
  }
}

async function logout() {
  await fetchJson("/api/logout", { method: "POST" });
  await init();
}

function renderMarkdown(markdown) {
  const body = markdown.replace(/^---[\s\S]*?\n---\s*/, "");
  const lines = body.split(/\r?\n/);
  const html = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();
    if (!trimmed) {
      index += 1;
      continue;
    }
    if (trimmed.startsWith("```")) {
      const code = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        code.push(lines[index]);
        index += 1;
      }
      html.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
    } else if (trimmed === "$$") {
      const formula = [];
      index += 1;
      while (index < lines.length && lines[index].trim() !== "$$") {
        formula.push(lines[index]);
        index += 1;
      }
      html.push(`<div>\\[${formula.join("\n")}\\]</div>`);
    } else if (trimmed.startsWith("### ")) {
      html.push(`<h3>${inline(trimmed.slice(4))}</h3>`);
    } else if (trimmed.startsWith("## ")) {
      html.push(`<h2>${inline(trimmed.slice(3))}</h2>`);
    } else if (trimmed.startsWith("![")) {
      const match = trimmed.match(/^!\[(.*)]\((.*)\)$/);
      html.push(match ? `<figure><img src="${escapeHtml(match[2])}" alt="${escapeHtml(match[1])}" /><figcaption>${escapeHtml(match[1])}</figcaption></figure>` : "");
    } else if (/^- \[[ xX]\]/.test(trimmed)) {
      html.push(`<p>${escapeHtml(trimmed)}</p>`);
    } else {
      html.push(`<p>${inline(trimmed)}</p>`);
    }
    index += 1;
  }
  return html.join("");
}

function inline(text) {
  return escapeHtml(text)
    .replace(/\[([^\]]+)]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "请求失败");
  return data;
}

function parseList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter((item) => !isBlank(item));
}

function isBlank(value) {
  return String(value || "").trim().length === 0;
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "");
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
