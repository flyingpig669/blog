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

内容层由 `sync_posts.py` 扫描 Markdown，生成轻量元数据索引 `js/posts-data.js` 与带内容哈希的 `data/documents/*.json`。集合只存文档 ID，正文在打开文档时加载；全文检索独立索引在第一次打开搜索时加载。失败可重试，同一资源请求合并，过期页面/搜索响应不会覆盖当前视图。

```text
~/Documents/blog/
├── blog.config.js          # ⭐ 全局配置中心：站点信息、作者、导航 nav、路由字典、功能开关
├── about.md                # ⭐ 关于页数据源：状态/座右铭/时间线/关注领域/社交
├── index.html              # 主入口：SPA 挂载容器、页脚、资源载入
├── css/
│   └── main.css            # 设计系统：Tokens、组件样式、导航下拉、时间线、幻灯片播放器
├── js/
│   ├── app.js              # 核心控制器：Hash 路由分发、各视图渲染、事件监听
│   ├── store.js            # 数据中心：读取配置与编译数据，文档/专栏/标签检索与站内互链解析
│   ├── markdown.js         # Markdown 渲染：KaTeX 公式、Prism 高亮、Callout、Slide 容器、TOC、双链
│   ├── slide-viewer.js     # PDF.js 幻灯片/演示文稿播放器（按需懒加载，约 20KB）
│   ├── icons.js            # 极简内联 SVG 图标库 (Lucide，仅保留 Callout 用到的 3 个)
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
├── sync_posts.py           # 内容编译脚本：扫描 posts/ 与 about.md → 生成 js/posts-data.js（+ sitemap.xml）
├── check.sh                # 一键自检：重建索引 → JS/Python/Shell 语法校验
├── server.py               # 本地预览服务器（多线程加固，默认端口 18888）
├── run.sh                  # 启动脚本（等价于 python3 server.py）
├── deploy.sh               # 一键发布：自检 → 同步 → Commit → Push
├── robots.txt              # 爬虫规则（配合 blog.config.js 的 site.url 使用）
├── sitemap.xml             # ⚙ 自动生成：仅当 site.url 非空时产出
├── AGENTS.md               # UI 设计系统与开发协作约束手册
└── README.md               # 本文档
```

> **关键约定**：新增文章后运行 `npm run build`（或 `./check.sh`），同时生成索引、正文、搜索数据与静态 CSS。浏览器不再运行 Tailwind。预览必须通过 HTTP 服务器访问，不能直接打开本地 HTML。

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
    description: "...",        // SEO 描述（同时写入 meta description 与 og/twitter:description）
    footerText: "© 2026 ...",  // 页脚版权（整站唯一一行）
    url: "",                   // 部署后的站点根地址，用于 sitemap.xml 与 og:url；留空则跳过 sitemap
    wordsPerMinute: 300,       // 阅读时长估算速度（编译期读取，改动后需重跑 sync_posts.py）
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
| 归档时间线 | `#/archive`（`#/posts` 会通过 `replaceState` 收敛到此，不再出现「同内容两个 URL」） |
| 文章详情 | `#/posts/<slug>` |
| 专栏列表 | `#/columns` |
| 专栏详情 | `#/columns/<columnSlug>` |
| 标签云 | `#/tags`、`#/tags/<tag>`、`#/tags/<t1>/<t2>`（多选交集）、`#/tags?tag=<tag>` |
| 关于 | `#/about` |
| 独立单页（示例） | `#/roadmap` |

> **标签筛选是「URL 即状态」**：选中集合完全由地址栏推导，标签胶囊只是写入 URL 的入口。
> 因此刷新还原、复制分享、浏览器前进/后退三者行为天然一致（历史 bug：清空筛选后刷新会「复活」）。
> URL 中的标签名按大小写不敏感归一化，`#/tags/TEST` 与 `#/tags/test` 等价。

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

普通文章与结构化页面共用 `lib/frontmatter.py`，使用 PyYAML 的安全 BaseLoader（标量统一保留为文本，不执行自定义对象标签），支持数组、嵌套映射、块文本与标准 YAML 引号转义。重复字段、非法日期、章节顺序和结构化字段类型会中止构建，并指出源文件。没有条目的列表应写 `[]`。

`tocLevels: []`（或 `false`）关闭目录，省略时使用全局默认。标题锚点基于标题内容生成，重复标题追加序号；插入其他标题不会改变已有锚点。修改标题本身会改变锚点，可以在浏览器检查对应标题的 `id` 获取当前地址。

搜索支持方向键选择、Enter 打开与 Escape 关闭；结果按标题、标签、摘要、正文的相关性排序，不再截断为八条。返回上一页时恢复该历史记录的滚动位置。

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
slug: "my-first-post"        # URL 标识；文件名含中文时必须显式声明英文小写 slug
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

### 3. 文章之间互相引用 / 写收录页

正文里不要手写 `#/posts/xxx` 路由，直接用双链 `[[slug]]`（自动补全标题）或相对 `.md` 链接，详见 [第七节 · 站内互链](#2-站内互链引用其它文章双链语法)。收录页起点模板：[`templates/template-collection.md`](templates/template-collection.md)。

---

## 六、关于页与结构化单页 (`about.md`)

为了避免直接倾倒 Markdown 的粗糙排版，关于页采用**数据驱动的组件化渲染**。你只需像填表一样维护 [`about.md`](about.md)：

```yaml
---
status: "Physics, Math & Computer Science"     # 顶部状态胶囊
quote: "Turning complexity into clean order."  # 引言格言
bio: "一句话自述，位于标题下方。"
publications:                                  # 论著列表：按年份倒序分组，卡片可展开
  - title: "Quantum State Vector Simulation at Scale"
    slug: "quantum-state-vector-simulation"
    authors: ["CCC", "L. Wang"]
    venue: "Physical Review A"
    year: 2026
    citations: 12
    links: { pdf: "attachments/papers/qsvs.pdf", doi: "10.1103/PhysRevA.113.012345" }
    abstract: "展开卡片后显示的摘要。"
timeline:                                      # 发光导轨纵向时间线
  - period: "2024 – PRESENT"
    title: "架构设计与前沿计算探索"
    desc: "始终可见的一句话概述。"
    detail: "点击标题后展开的补充说明。"
    links: { paper: "quantum-state-vector-simulation", code: "https://github.com/..." }
focusAreas:                                    # 关注领域（与 timeline 同一套展开逻辑）
  - title: "分布式系统与高可用架构"
    desc: "..."
social:                                        # 名片区纯文字外链（自动加 ↗）
  - name: "GitHub"
    url: "https://github.com/flyingpig669"
---
```

> 关于页与所有 `type: post` 的独立页**共用同一套渲染器**，字段完全通用。

### 论著列表 (Publications)

`publications` 是面向学术场景的结构化区块，渲染规则如下：

| 规则 | 说明 |
| :--- | :--- |
| **年份分组** | 按 `year` 倒序自动分组，未填年份的条目沉到末尾并标注 `UNYEARED` |
| **折叠卡片** | 默认折叠，只显示标题 / 署名 / 期刊 / 年份 / 引用数 / 资源徽章 |
| **点击展开** | 点标题或卡片空白处展开，显示 `abstract` 与 PDF 预览入口 |
| **PDF 懒加载** | 展开**不会**下载 PDF；只有点「预览 PDF」才创建 iframe，再点一次收起 |
| **署名高亮** | `authors` 里与 `blog.config.js` 的 `author.name` 同名者自动加粗 |
| **链接补全** | `doi: "10.1103/…"` → `https://doi.org/10.1103/…`；`arxiv: "2601.00001"` → `https://arxiv.org/abs/2601.00001` |

`links` 可用的 key 与徽章文案：`pdf` / `doi` / `arxiv` / `code` / `slides` / `dataset` / `video` / `poster` / `site` / `bib`。**未登记的 key 会自动大写生成徽章**，可随时自造 `dataset:`、`podcast:` 之类。区块右上角还会汇总 `N Papers · M Citations`（没有任何 `citations` 时只显示篇数）。

### 时间线 / 关注领域条目可展开

`timeline` 与 `focusAreas` 的条目除 `desc`（始终可见）外，还支持两个可选字段：

```yaml
timeline:
  - period: "2022 – 2024"
    title: "核心系统研发与基础设施优化"
    desc: "始终可见的一句话概述。"
    detail: "点击标题后展开的补充说明，可以写得更长。"     # 可选
    links:                                              # 可选
      paper: ["paper-slug-a", "paper-slug-b"]            # 同一类资源可挂多个（数组）
      post: "my-first-post"
      tag: "distributed-systems"
      code: "https://github.com/..."
```

- **两者都为空时不渲染箭头**，条目退化为纯静态展示 —— 不会出现「点了没反应」的空箭头。
- 整条可点（含标题与正文），但在条目里拖选文字不会误触折叠。
- `links` 的 key 决定筹码类型（`paper` / `post` / `note` / `slides` / `code` / `doi` / `tag` / `link`，未登记的大写直出）：
  - `paper` 写 `publications[].slug` 或完整标题时，筹码会变成**页内锚点**：点击滚动到该论著卡片并自动展开、高亮 1.6 秒；
  - `post` 命中博文 slug 时跳到文章详情页；`tag` 跳到标签筛选页；
  - 其余外链显示域名（`github.com ↗`），站内相对路径显示文件名。

### 文本字段可以写成多行数组

`bio`、`quote`、`timeline[].desc`、`timeline[].title`、`timeline[].detail`、`focusAreas[].desc` 都同时接受**字符串**与**数组**两种写法。写成数组时按行渲染，适合一条里程碑里放多句话：

```yaml
timeline:
  - period: "2026 – FUTURE"
    title: "前沿量子计算与分布式引擎开源"
    desc: ["发布高性能量子态矢量仿真器核心，推进变分量子算法工程落地。",
           "开源分布式共识算法与高可用系统架构。"]     # 数组可以跨行书写
  - period: "2024 – 2026"
    title: "Aurora Notes 知识库构建"
    desc: "单行字符串同样支持。"                        # 两种形态可混用
```

也支持 YAML 块序列写法：

```yaml
    desc:
      - "第一行"
      - "第二行"
```

---

## 七、排版语法与功能特性

### 1. 常驻悬浮 Outline

- 桌面端（≥ 600px）：文章右侧常驻吸顶目录，滚动实时高亮当前小节。
- 点击目录项平滑滚动，并自动避让 56px 顶栏（预留 76px 缓冲）。
- 移动端折叠为右下角 `# Outline` 胶囊 + 侧滑抽屉。

### 2. 站内互链：引用其它文章（双链语法）

写「收录 / 索引页」或文章之间互相引用时，不必手写 `#/posts/...` 路由，直接用双链：

```markdown
- [[hello-world]]                          → 自动取文章标题作为链接文字
- [[hello-world|去看 Hello World]]          → 自定义显示文字
- [[group-theory]]                         → 引用整个专栏
- [[algebra]]                              → 引用某个标签下的全部文章
- [[#algebra]]                             → 显式指定标签，避免与文章同名
- [[about.md]]                             → 引用关于页
```

`[[...]]` 中可填：文章 **slug**、**文件名/路径**（`群论/01-简介.md`、`posts/roadmap.md`）、**文章标题**、**专栏 id 或名称**、**标签名**、`about.md`。

标准 Markdown 链接只要指向 `.md` 文件，也会被自动解析为站内路由：

```markdown
[看这篇](hello-world.md)
[看这篇](./hello-world.md)
[看这篇](posts/hello-world.md)
[看这篇](群论/01-简介.md)
[看这一节](posts/群论/01-简介.md#section-2)
```

相对路径以当前文档所在目录为基准；`posts/` 开头的路径从文章根目录查找。
章节锚点会转换为路由查询参数 `heading`，目标页面渲染后自动定位到对应标题。
完整文件路径优先匹配，不再回退到其它目录的同名文件。

- **不会被改写**：外部链接（`https://…`、`mailto:`）、Hash 锚点（`#/tags`）、附件资源（`attachments/…pdf`）、行内代码与代码块内的 `[[…]]`。
- 引用不到目标时渲染为灰色虚线的「缺失」标记，便于发现写错的 slug。
- 可直接复制 [`templates/template-collection.md`](templates/template-collection.md) 作为收录页起点。

### 3. 学术级数学公式 (KaTeX)

- 行内公式：`$$E = mc^2$$` 或 `\( E = mc^2 \)`。**禁止**单个 `$` 内联（与 AGENTS.md 约定一致）。
- 块级公式：独立 `$$` 块，前后保留空行：

$$
i \hbar \frac{\partial}{\partial t} \left| \psi(t) \right\rangle = \hat{H} \left| \psi(t) \right\rangle
$$

- 狄拉克符号用 `\left| \psi \right\rangle`；多行用 `\begin{aligned} ... \end{aligned}`。

### 4. 深色代码高亮与一键复制 (Prism)

```python
def fibonacci(n: int) -> int:
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a
```

### 5. PDF 幻灯片 / 演示文稿播放 (Slide Deck)

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

播放器交互：

| 操作 | 效果 |
| :--- | :--- |
| **点击画布** | 进入全屏演示（鼠标悬停时底部会出现「点击展开全屏演示」引导；全屏态下不再响应，避免误点退出） |
| 点击画布左/右 25% 热区 | 上一页 / 下一页 |
| `←` `→` `Space` `PageUp` `PageDown` `Home` `End` | 翻页与首末页（鼠标悬停或全屏时生效） |
| `F` / `Esc` | 进入 / 退出全屏演示 |
| 工具栏 `○−` `○＋` | 缩放（**移动端同样可见**：窄屏才是最需要缩放的场景） |

> **性能**：PDF.js（约 1.3MB）与 `slide-viewer.js` 不会随首屏加载。只有真的渲染到带演示文稿的文章时，才由 `app.js#ensureSlideViewer()` 按需注入，首页与普通文章零额外开销。

### 6. 附件与相对路径

- 幻灯片、图片、压缩包统一放在 `attachments/`（如 `attachments/slides/`）。
- `sync_posts.py` 会自动跳过 `attachments/`、`assets/` 等资源目录，路径引用在本地与 GitHub Pages 均可用。
- 需要「下载型」附件时，在 FrontMatter 里声明 `attachments`，文章末尾会自动渲染带 `download` 属性的下载区：

```yaml
---
title: "量子算法与变分线路实录"
slide: "attachments/slides/quantum-computing-slides.pdf"
attachments: ["attachments/slides/quantum-computing-slides.pdf", "attachments/数据集.zip"]
---
```

### 7. Callout 提示块

四种类型各自有独立的强调色与浅色底（tip 青 / note 蓝 / warning 琥珀 / danger 红），便于一眼分辨语义：

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

### 8. 全站统一版心与列表页布局

**全站页面宽度统一为 720px**（定义在 `css/main.css` 的 `--shell`，页面挂 `.shell` 类）：首页、About、`/posts` 列表、Archive、Tags、Columns 列表与详情、页脚全部同宽。页面之间宽度一致比单页密度更重要 —— 切换页面时内容左右边缘不应跳变。

**唯一的例外是文章详情页** `--shell-detail: 1000px`：它需要在同一行内并排放置「正文列 680px + 右侧常驻目录 230px」，720px 装不下（会把正文挤成 402px 的窄栏）。除此之外不得再引入第三档宽度。

> 历史提示：曾有一版把 Archive / Tags / Columns 单独放宽到 1080px 做两栏平铺以提升密度，结果标准页宽度在 720 / 1000 / 1080 之间反复跳变，观感割裂，已全部移除。

**列表页一律单栏堆叠**：Archive / Tags / Columns 的列表**不做多栏平铺**。720px 版心的可用内容宽只有 672px —— 拆成两栏会压成 316px 窄栏，长标题被迫折行，反而更难读。

- **Archive**：**整页不画任何横向分割线**。页面头部、年份标签、条目行都没有 `border-*`，层次完全靠字号、等宽体与留白建立（年份是大号等宽体，条目靠 `space-y` 间隔）。也没有 `N POSTS` 计数标签 —— 这是本页既有的设计语言。
- **Tags**：标签索引（紧凑胶囊云）在上，筛选结果的文章条目单栏堆叠，行间以 1px 细线分隔。
- **Columns**：专栏条目单栏堆叠，条目之间以 1px 细线分隔，条内为章节列表。

**Tags / Columns 共用「细线分隔」语言**：容器型块一律不加底色、不加边框、不加圆角；横向分隔线统一为 1px `--divider`，且由**条目自身**的 `border-bottom` 提供。方框与圆角只留给可交互控件（标签胶囊、条目内标签 chip、元信息徽章）。标签云保持紧凑胶囊形态，禁止做成占满整行的磁贴。这一条是硬约束，新增模块时必须遵守，否则页面会立刻看起来像另一套设计。

---

## 八、本地开发与预览

首次准备构建环境（Node.js 24 与 Python 3）：

```bash
npm ci
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
npm run build
```

构建入口是 `scripts/build.js`；`run.sh` / `check.sh` 自动优先使用项目 `.venv`。使用其它 Python 环境可设置 `AURORA_PYTHON`。开发监听会同步重建 CSS 与内容，并排除生成数据、CSS、日志、依赖与缓存，避免刷新循环。

公共模块分别位于 `js/components/`（导航、文章条目、论著、搜索）与 `js/lib/`（路由、滚动状态、HTML/URL 安全）。组件通过注入服务使用数据和路由，不反向依赖页面控制器。设计颜色与字体只在 `css/main.css` 令牌中定义，Tailwind 配置引用变量。

Markdown 通过 DOMPurify 清理，再统一过滤链接/资源协议；前台标题与属性统一转义。搜索提供正文命中片段与安全高亮；章节标题旁的 `#` 可复制直达链接；About 提供区块跳转。普通文章按发布时间串联，专栏按章节顺序串联。

标签展示名保持原文，URL 统一为小写连字符（例如 `Getting Started` → `/tags/getting-started`）；构建会拒绝重名 slug 或非英文标签路由。标签选择仍由 URL 驱动，刷新和后退可恢复筛选。

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

1. `./check.sh`：先统一构建，再检查导航/路由一致性、站内引用、Markdown 链接、附件与脚本依赖，随后执行语法检查和 Node/Python 回归测试。
2. `git add .` 并创建 Commit。
3. 推送到远程 `main` 分支。
4. 触发云端 [`.github/workflows/static.yml`](.github/workflows/static.yml)，由 GitHub Actions 完成 Pages 打包上线。

Pull Request 也执行完整检查但不发布；只有检查通过的非 PR 构建才能部署。部署仍从项目根目录打包，没有引入 `dist/` 隔离。仍使用 Hash 路由，独立静态页面与 SSG 属于后续路由迁移，不在本次改造内。

> **仓库设置**：GitHub 仓库 → **Settings** → **Pages** → **Build and deployment / Source** 选择 **GitHub Actions**。

---

## 十、FAQ 与已知限制

### Q1: 新增文章后网页没有显示？

静态站点依赖索引与正文数据。本地执行 `npm run build`；发布时运行 `./deploy.sh`（脚本与 CI 都会自动重建并校验）。

### Q2: 改了配置刷新没变化？

浏览器强缓存所致。用 `Cmd + Shift + R`（Mac）/ `Ctrl + F5`（Windows）强制刷新，或用无痕窗口验证。

### Q3: 下拉菜单展开后是空的？

历史原因：导航容器曾使用 `overflow-x-auto`，导致绝对定位的下拉面板被裁切。现已修复（见第三节第 4 点）。若自行改动导航结构，请勿给 `#desktop-nav` 及其祖先加 `overflow-*`。

### Q4: 为什么路由里出现过中文？还能用吗？

路由参数必须使用英文小写、数字与连字符。中文文件名需要在 FrontMatter 中显式声明 `slug`，中文专栏名需要声明 `columnSlug`（示例均已补齐）。索引构建会拒绝不符合规则或重复的文章 slug，防止生成歧义链接。

修改 `slug` 会直接改变文章 URL；项目处于开发阶段，不维护旧 slug 兼容层。

### Q5: 为什么不用 `gh-pages` 分支？

GitHub 官方现代推荐方式为 Actions 原生部署：直接从 `main` 源码构建，免去双分支同步冲突。

### Q6: 如何自定义主题强调色？

打开 [`css/main.css`](css/main.css)，修改 `:root` 中的 `--accent-primary`（主强调色，默认 `#3B82F6`）与 `--accent-secondary`（次强调色，默认 `#22D3EE`），保存刷新即可全站生效。

### Q7: 文章卡片上的「字词」是怎么算的？阅读时长准吗？

由 `sync_posts.py` 的 `estimate_word_units()` 在编译期统计：**英文按单词数、CJK 按字符数**相加，故中英混排下用中性的「字词」标注。阅读时长 = 字词数 ÷ `site.wordsPerMinute`（默认 300，最少显示 1 min）。

> 旧的实现直接取正文**字符数**当字数，英文文章会被算成中文的 6～7 倍，阅读时长虚高。改动 `wordsPerMinute` 后需重跑 `sync_posts.py` 才会生效。

### Q8: 为什么 `sitemap.xml` 里只有一条 URL？

本站是 Hash 路由（`#/posts/xxx`）。搜索引擎**不把 Hash 片段视为独立 URL**，列出 `#/...` 反而会误导爬虫，因此 sitemap 只收录站点根地址。同理，`og:url` / `canonical` 也指向站点根。

若需要让每篇文章都被独立收录，必须改为 HTML5 History 路由并为静态托管配置 404 回退（GitHub Pages 不支持），这是当前架构的已知取舍。

### Q9: `sitemap.xml` 没有生成 / 生成的地址不对？

在 `blog.config.js` 的 `site.url` 填入部署后的站点根地址（**含子路径、末尾不带 `/`**），例如 `https://<用户名>.github.io/<仓库名>`，然后重跑 `python3 sync_posts.py`。

`site.url` 留空时会跳过 sitemap 生成，同时 `og:url` / `canonical` 退回「当前文档目录」，本地预览与子路径部署都能自洽。

### Q10: `publications` 里的条目没显示 / 显示成一堆 YAML 文本？

三个最常见的成因：

1. **缩进断层**：`publications:` 下的条目必须以 `-` 开头并比 `publications:` 更深一级缩进，字段再比条目深一级。YAML 对缩进敏感，混用 Tab 与空格会解析失败。
2. **年份写成非数字**：`year: "2026 年"` 可以（只取前四位），但 `year: "待定"` 会进入 `UNYEARED` 组而不是报错 —— 这是刻意设计，避免整页渲染失败。
3. **`abstract` / `links` 被吞掉**：解析器按「相对本行缩进更深」判定嵌套映射。若把 `abstract:` 写得比 `links:` 的**子键**还深，它会被当成 `links` 的一部分。请保持同一层级的字段左对齐。

改完执行 `python3 sync_posts.py`（或保存文件后由实时刷新自动重建 `js/posts-data.js`）。

### Q11: 时间线条目后面没有展开箭头？

箭头只在条目**确实有折叠内容**时才渲染，判据是 `detail` 或 `links` 至少有一个非空。这是刻意的：一个点了没反应的箭头比没有箭头更糟。

### Q12: 本地预览时浏览器一直在自己刷新？

已修复。历史版本把 `server.log` 也纳入了文件监听快照 —— 而 `--daemon` 模式下每个 HTTP 请求都会往这个文件写日志，于是形成「请求 → 日志 mtime 变化 → 广播刷新 → 浏览器重新请求」的无限重载循环。

现在 `server.py` 的监听层统一排除 `*.log` / `*.pyc` / `*.swp` 等运行期产物（见 `WATCH_IGNORED_FILES` / `WATCH_IGNORED_SUFFIXES`）。若你自定义了其它运行期产物文件，请一并加入该列表。

---

## 开发约束

UI、路由、样式与模块化的强制约束见 [`AGENTS.md`](AGENTS.md)。撰写前端代码前请务必阅读：它定义了设计令牌、版心几何、路由命名规范、导航准入流程与交付自检清单。
