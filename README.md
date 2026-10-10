# Aurora Notes (极光随笔)

> 冷静、克制、严谨的深色科技风个人博客系统。整体美学参考 Linear、Vercel 与 Raycast 的深色设计语言：依靠充裕留白与 1px 极细边框建立视觉秩序，内容优先，零构建依赖。

---

## 目录索引 (Documentation Index)

- [一、核心架构与目录结构](#一核心架构与目录结构)
- [二、全站统一配置 (`blog.config.js`)](#二全站统一配置-blogconfigjs)
- [三、导航与路由系统](#三导航与路由系统)
- [四、文档两大类型：normal 与 post](#四文档两大类型normal-与-post)
- [五、撰写文章与专栏 (`posts/`)](#五撰写文章与专栏-posts)
- [六、关于页与结构化单页 (`about.md`)](#六关于页与结构化单页-aboutmd)
- [七、排版语法与功能特性](#七排版语法与功能特性)
- [八、本地开发与预览](#八本地开发与预览)
- [九、自动化部署 (GitHub Actions & Pages)](#九自动化部署-github-actions--pages)
- [十、FAQ 与已知限制](#十faq-与已知限制)

---

## 一、核心架构与目录结构

本系统是**零构建的纯静态单页应用 (SPA)**：没有 Node.js 打包、没有 Webpack/Vite，浏览器直接执行原生 ES5 语法脚本，秒级加载、无依赖维护成本。

内容层由 `sync_posts.py` 扫描 Markdown 并编译为一份数据包 `js/posts-data.js`，前端只读该数据包渲染页面。

```text
~/Documents/blog/
├── blog.config.js          # ⭐ 全局配置中心：站点信息、作者、导航 nav、路由字典、功能开关
├── about.md                # ⭐ 关于页数据源：状态/座右铭/时间线/关注领域/社交
├── index.html              # 主入口：SPA 挂载容器、页脚、资源载入
├── css/
│   └── main.css            # 设计系统：Tokens、组件样式、导航下拉、时间线、幻灯片播放器
├── js/
│   ├── app.js              # 核心控制器：Hash 路由分发、各视图渲染、事件监听
│   ├── store.js            # 数据中心：读取配置与编译数据，管理本地点赞/浏览/书签状态
│   ├── markdown.js         # Markdown 渲染：KaTeX 公式、Prism 高亮、Callout、Slide 容器、TOC
│   ├── slide-viewer.js     # PDF.js 幻灯片/演示文稿播放器
│   ├── icons.js            # 极简内联 SVG 图标库 (Lucide)
│   └── posts-data.js       # ⚙ 自动生成：由 sync_posts.py 编译产出的内容索引，请勿手改
├── posts/                  # ⭐ 文章与独立页存放目录（纯 Markdown）
│   ├── hello-world.md
│   ├── quantum-simulator.md
│   ├── roadmap.md          # 结构化独立页示例 (type: post)
│   ├── 02-群论测试.md       # 专栏章节示例
│   └── 群论/01-简介.md      # 专栏章节（子目录形式）
├── attachments/            # 附件（幻灯片 PDF、图片、压缩包等），同步脚本自动跳过
│   └── slides/
├── templates/              # 写作模板库（不参与发布）
├── sync_posts.py           # 内容编译脚本：扫描 posts/ 与 about.md → 生成 js/posts-data.js
├── check.sh                # 一键自检：JS/Python/Shell 语法 + 重建索引
├── server.py               # 本地预览服务器（多线程加固，默认端口 18888）
├── run.sh                  # 启动脚本（等价于 python3 server.py）
├── deploy.sh               # 一键发布：自检 → 同步 → Commit → Push
├── AGENTS.md               # UI 设计系统与开发协作约束手册
└── README.md               # 本文档
```

> **关键约定**：新增文章后必须重新运行 `python3 sync_posts.py`（或 `./check.sh`）生成索引，网页才会读取到新内容。

---

## 二、全站统一配置 (`blog.config.js`)

站点所有核心属性都收敛在根目录的 [`blog.config.js`](blog.config.js) 中，修改即可全站生效：

```javascript
window.BlogRoutes = Object.freeze({
  home: "/", posts: "/posts", columns: "/columns",
  archive: "/archive", tags: "/tags", about: "/about"
});

window.BlogConfig = {
  routes: window.BlogRoutes,
  defaultRoute: window.BlogRoutes.home,   // 访问空 Hash / 根地址时的落地路由

  site: {
    title: "Aurora Notes",     // 浏览器标签页与首页大标题
    brand: "aurora.notes",     // 顶部 Logo 文字
    tagline: "...",            // 首页副标题
    description: "...",        // SEO 描述
    footerText: "© 2026 ...",  // 页脚版权（整站唯一一行）
    postsPerPage: 10,
    wordsPerMinute: 300,       // 阅读时长估算速度
  },

  author: { name, title, bio, avatar, location, email, github },

  nav: [ /* 见下一节 */ ],

  features: {
    readingProgress: true,   // 顶部阅读进度条
    outlineSidebar: true,    // 文章右侧常驻悬浮 Outline（Scrollspy 高亮）
    tocLevels: [2, 3, 4],    // Outline 追踪的标题层级
    searchModal: true,       // Cmd+K / Ctrl+K 全文检索
    mathKaTeX: true,         // KaTeX 数学公式
    codeHighlight: true      // Prism 代码高亮 + 一键复制
  },

  exclude: {
    showTest: true,               // false 时隐藏带 test 标签 / test: true 的文档
    files: [],                    // 按文件名排除
    dirs: ["templates", "drafts"] // 按目录名排除
  }
};
```

---

## 三、导航与路由系统

### 1. Hash 路由

全站采用客户端 Hash 路由（`#/path`）。之所以不用 HTML5 History 路由：GitHub Pages 等纯静态托管无法配置服务端回退，直接刷新深链会 404；而 Hash 由浏览器内核原生处理，本地与线上均 100% 保证刷新不丢页。

| 页面 | 路由 |
| :--- | :--- |
| 首页 | `#/` |
| 文章列表 | `#/posts` |
| 文章详情 | `#/posts/<slug>` |
| 专栏列表 | `#/columns` |
| 专栏详情 | `#/columns/<columnSlug>` |
| 归档时间线 | `#/archive` |
| 标签云 | `#/tags`、`#/tags/<tagName>` |
| 关于 | `#/about` |
| 独立单页（示例） | `#/roadmap` |

### 2. 统一导航目标：`target`

导航在 `blog.config.js` 的 `nav` 中定义。每一项用统一的 `target` 描述目标，**新增导航只需改这一处**：

| `target` 写法 | 含义 |
| :--- | :--- |
| `"/archive"` 或 `window.BlogRoutes.archive` | 绑定一个路由（默认路由模式） |
| `"dir:posts/群论"` | 绑定一个目录，自动列出该目录（含子目录）下的普通文章 |
| `"file:about.md"` | 绑定一个 Markdown 文件，按文档类型自动分流渲染 |

- **单个对象** = 普通导航项。
- **数组** = 下拉菜单：数组第一项常显，其余项折叠进下拉。
- 未提供 `target` 时，向下兼容旧的 `route` / `file` / `dir` 字段。

当前默认导航：

```javascript
nav: [
  { id: "home",    label: "Home",    target: window.BlogRoutes.home },
  { id: "columns", label: "Columns", target: window.BlogRoutes.columns },
  { id: "archive", label: "Archive", target: window.BlogRoutes.archive },
  { id: "tags",    label: "Tags",    target: window.BlogRoutes.tags },
  // 数组 = 下拉菜单：About 常显，Roadmap 折叠进下拉
  [
    { id: "about",   label: "About",   target: "file:about.md" },
    { id: "roadmap", label: "Roadmap", target: "file:posts/roadmap.md" }
  ]
]
```

### 3. 四种扩展场景

```javascript
// 场景 A：普通路由栏目
{ id: "archive", label: "Archive", target: "/archive" }

// 场景 B：按目录聚合文章（posts/ 下任意目录，含子目录）
{ id: "notes", label: "Notes", target: "dir:posts/群论" }

// 场景 C：独立 Markdown 页面（友链、书单、说明书……）
//   type: normal → 以文章形态渲染；type: post → 以 about 式结构化单页渲染
{ id: "friends", label: "Friends", target: "file:friends.md" }

// 场景 D：下拉菜单（数组）
[
  { id: "about",   label: "About",   target: "file:about.md" },
  { id: "roadmap", label: "Roadmap", target: "file:posts/roadmap.md" }
]
```

### 4. 下拉菜单的交互与实现约束

- 下拉面板样式定义在 [`css/main.css`](css/main.css) 的 `.nav-dropdown` / `.nav-dropdown-panel`，支持 **鼠标 hover、键盘 focus、点击箭头** 三种展开方式；点击页面其它区域或切换路由会自动收起。
- **实现红线**：导航容器 `#desktop-nav` 上**禁止**使用任何 `overflow-*`。`overflow-x-auto` 会把 `overflow-y` 一并变为 `auto`，从而裁掉绝对定位的下拉面板（这正是历史 bug「展开啥都没有」的根因）。同理，下拉菜单不使用 Tailwind 命名 group 变体（`group-hover/xxx`），因为导航 HTML 是运行时注入的，命名变体样式可能来不及生成。

> 路由模式导航项还可附带 `title` / `subtitle` / `category` / `tag` / `items` 字段，走通用动态栏目渲染器（按分类/标签筛选，或渲染声明式卡片集合）。

---

## 四、文档两大类型：normal 与 post

FrontMatter 的 `type`（或 `layout`）字段决定文档类型，缺省为 `normal`：

### 类型 1：`normal` 普通文章（默认）

标准技术长文排版，进入首页 / 归档 / 标签等**博文流**，具备：

- 发布日期、阅读时长估算、字数统计、标签
- 右侧常驻悬浮 Outline 目录 + 滚动高亮（Scrollspy）
- KaTeX 数学公式、Prism 代码高亮与一键复制
- 底部上一篇 / 下一篇翻页（专栏内为章节间导航）

### 类型 2：`post` 结构化独立页

`type: "post"`（旧写法 `type: "page"` 仍兼容）→ **不进入博文流**，以 about 式结构渲染：

- 支持区块：`status` / `quote` / `bio` / `timeline`（时间线）/ `focusAreas`（关注领域）/ `social` / `contacts` / `links`
- 追加一段自由 Markdown 正文（支持 KaTeX、Prism、Callout）
- 通过导航 `target: "file:xxx.md"` 绑定为独立页面

```yaml
---
title: "个人发展路线图"
type: "post"
excerpt: "关于知识库使用约定与演进路线。"
status: "Open to collaboration"
quote: "用严谨推导建立秩序。"
bio: "一句话自述。"
timeline:
  - period: "2024 – PRESENT"
    title: "架构设计与前沿计算探索"
    desc: "分布式共识与量子线路变分模拟。"
focusAreas:
  - title: "分布式系统"
    desc: "共识协议与一致性存储。"
social:
  - name: "GitHub"
    url: "https://github.com/..."
---
正文从这里开始，支持常规 Markdown 与公式。
```

> 若该页面在 `posts/` 下，也可直接用 `#/posts/<slug>` 访问，此时会自动落到单页渲染器。

---

## 五、撰写文章与专栏 (`posts/`)

### 1. 基础文章

在 `posts/` 下新建 `.md`（支持子目录）：

```markdown
---
title: "我的第一篇技术文章"
date: "2026-10-09"
slug: "my-first-post"        # 可选：URL 标识；文件名含中文时建议显式声明 ASCII slug
category: "architecture"
tags: ["分布式", "架构设计"]
pinned: false
excerpt: "一句话摘要；不填写则自动截取正文前 140 字符。"
---

# 正文从这里开始
支持 KaTeX 公式、Prism 代码高亮与 Callout 提示块。
```

访问路径：`#/posts/my-first-post`（未声明 `slug` 时使用去掉扩展名的文件名）。

### 2. 专栏 / 系列

专栏**完全由 FrontMatter 驱动**，无需创建 `columns/` 目录，文章可平铺在 `posts/` 下：

```yaml
---
title: "01 简介：代数结构与映射"
date: "2026-10-09"
slug: "group-theory-intro"          # 本文 URL 标识
column: "抽象代数"                   # 专栏聚合键（多篇相同即自动成组）
columnSlug: "group-theory"          # 专栏 URL 标识（建议 ASCII）
columnName: "抽象代数与群论导引"      # 专栏展示名
columnDesc: "系统梳理群、环、域的公理化体系。"  # 专栏描述（可选）
order: 1                            # 章节序号，决定上一篇/下一篇顺序
tags: ["algebra", "math"]
---
```

- 只要多篇文章声明相同的 `column`，即可在 `#/columns` 自动汇聚为一个专栏。
- 专栏详情页路由使用 `columnSlug`（未声明时回退到 `column`）。
- 专栏描述优先取任一章节的 `columnDesc`。

> **路由规范**：路由参数禁止中文。文件名/专栏名含中文时，请显式声明 `slug` 与 `columnSlug`（见 `AGENTS.md` 第 6 节）。仓库内示例文章已全部声明 ASCII slug。

---

## 六、关于页与结构化单页 (`about.md`)

为了避免直接倾倒 Markdown 的粗糙排版，关于页采用**数据驱动的组件化渲染**。你只需像填表一样维护 [`about.md`](about.md)：

```yaml
---
status: "Physics, Math & Computer Science"     # 顶部状态胶囊
quote: "Turning complexity into clean order."  # 引言格言
bio: "一句话自述，位于标题下方。"
timeline:                                      # 发光导轨纵向时间线
  - period: "2024 – PRESENT"
    title: "架构设计与前沿计算探索"
    desc: "..."
focusAreas:                                    # 关注领域
  - title: "分布式系统与高可用架构"
    desc: "..."
social:                                        # 名片区纯文字外链（自动加 ↗）
  - name: "GitHub"
    url: "https://github.com/flyingpig669"
---
```

> 关于页与所有 `type: post` 的独立页**共用同一套渲染器**，字段完全通用。

---

## 七、排版语法与功能特性

### 1. 常驻悬浮 Outline

- 桌面端（≥ 600px）：文章右侧常驻吸顶目录，滚动实时高亮当前小节。
- 点击目录项平滑滚动，并自动避让 56px 顶栏（预留 76px 缓冲）。
- 移动端折叠为右下角 `# Outline` 胶囊 + 侧滑抽屉。

### 2. 学术级数学公式 (KaTeX)

- 行内公式：`$$E = mc^2$$` 或 `\( E = mc^2 \)`。**禁止**单个 `$` 内联（与 AGENTS.md 约定一致）。
- 块级公式：独立 `$$` 块，前后保留空行：

$$
i \hbar \frac{\partial}{\partial t} \left| \psi(t) \right\rangle = \hat{H} \left| \psi(t) \right\rangle
$$

- 狄拉克符号用 `\left| \psi \right\rangle`；多行用 `\begin{aligned} ... \end{aligned}`。

### 3. 深色代码高亮与一键复制 (Prism)

```python
def fibonacci(n: int) -> int:
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a
```

### 4. PDF 幻灯片 / 演示文稿播放 (Slide Deck)

**方式 A：正文容器语法**

```markdown
::: slide attachments/slides/quantum-computing-slides.pdf
量子计算与态矢量演化汇报 PPT 演示
:::
```

**方式 B：FrontMatter 声明**

```yaml
---
title: "量子算法与变分线路实录"
slide: "attachments/slides/quantum-computing-slides.pdf"
---
```

两种方式都会在正文中挂载基于 PDF.js 的播放器（全屏演播、下载课件、深色高对比视口）；若正文已内嵌 `::: slide`，FrontMatter 的 `slide` 不会重复挂载。

### 5. 附件与相对路径

- 幻灯片、图片、压缩包统一放在 `attachments/`（如 `attachments/slides/`）。
- `sync_posts.py` 会自动跳过 `attachments/`、`assets/` 等资源目录，路径引用在本地与 GitHub Pages 均可用。

### 6. Callout 提示块

```markdown
::: tip 提示
常规提示块。
:::

::: warning 注意
告警提示块。
:::

::: note 笔记
笔记提示块。
:::

::: danger 警示
危险警示块。
:::
```

---

## 八、本地开发与预览

内置轻量服务器已针对浏览器并发做了加固（多线程 + 守护线程、TCP 监听队列 256、HTTP/1.1 keep-alive），避免静态资源偶发 `ERR_CONNECTION_RESET` 导致的白屏。

```bash
cd ~/Documents/blog

# 方式 1：后台守护进程（默认端口 18888）
python3 server.py --daemon

# 方式 2：启动脚本
./run.sh

# 方式 3：自定义端口
python3 server.py --port 8900
```

浏览器打开 `http://127.0.0.1:18888/` 预览。

**一键自检**（语法检查 + 重建索引）：

```bash
./check.sh
```

---

## 九、自动化部署 (GitHub Actions & Pages)

发布流程采用单一的 `main` 分支，无需维护 `gh-pages` 冗余分支。

```bash
cd ~/Documents/blog
./deploy.sh "发布新文章与更新配置"
```

脚本依次执行：

1. `./check.sh`：JS/Python/Shell 语法自检并重建 `js/posts-data.js`。
2. `git add .` 并创建 Commit。
3. 推送到远程 `main` 分支。
4. 触发云端 [`.github/workflows/static.yml`](.github/workflows/static.yml)，由 GitHub Actions 完成 Pages 打包上线。

> **仓库设置**：GitHub 仓库 → **Settings** → **Pages** → **Build and deployment / Source** 选择 **GitHub Actions**。

---

## 十、FAQ 与已知限制

### Q1: 新增文章后网页没有显示？

静态站点依赖索引包 `js/posts-data.js`。本地执行一次 `python3 sync_posts.py`；发布时直接运行 `./deploy.sh`（脚本与 CI 都会自动重建）。

### Q2: 改了配置刷新没变化？

浏览器强缓存所致。用 `Cmd + Shift + R`（Mac）/ `Ctrl + F5`（Windows）强制刷新，或用无痕窗口验证。

### Q3: 下拉菜单展开后是空的？

历史原因：导航容器曾使用 `overflow-x-auto`，导致绝对定位的下拉面板被裁切。现已修复（见第三节第 4 点）。若自行改动导航结构，请勿给 `#desktop-nav` 及其祖先加 `overflow-*`。

### Q4: 为什么路由里出现过中文？还能用吗？

路由参数**不应包含中文**（违反 `AGENTS.md` 第 6 节）。现已在示例文章与专栏上统一声明 ASCII 的 `slug` / `columnSlug`。**若你的历史文章文件名是中文且未声明 `slug`，其路由仍会是中文**——建议逐步补齐 `slug` 字段（补齐后文章 URL 会变化，需注意旧链接失效）。

### Q5: 为什么不用 `gh-pages` 分支？

GitHub 官方现代推荐方式为 Actions 原生部署：直接从 `main` 源码构建，免去双分支同步冲突。

### Q6: 如何自定义主题强调色？

打开 [`css/main.css`](css/main.css)，修改 `:root` 中的 `--accent-primary`（主强调色，默认 `#3B82F6`）与 `--accent-secondary`（次强调色，默认 `#22D3EE`），保存刷新即可全站生效。

---

## 开发约束

UI、路由、样式与模块化的强制约束见 [`AGENTS.md`](AGENTS.md)。撰写前端代码前请务必阅读：它定义了设计令牌、版心几何、路由命名规范、导航准入流程与交付自检清单。
