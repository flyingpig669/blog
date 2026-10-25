# Aurora Notes（极光随笔）

基于 Vue 3、Vue Router 和 Vite 的静态博客，支持 Markdown、专栏、书籍、阅读索引、数学公式与附件预览。提供白天／黑暗模式，保持统一的留白、细边框和阅读布局。可部署到 GitHub Pages，线上无需 Node.js 或 Python 服务。

字段参考：

- [Markdown YAML：全部字段、可选值、默认行为与示例](docs/frontmatter.md)
- [config：站点、作者、功能开关、导航与路由配置](docs/configuration.md)
- [写作模板：选择并复制模板](templates/README.md)

## 快速开始

构建环境：Node.js 24、Python 3。首次运行：

```bash
npm ci
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
npm run dev
```

打开 `http://127.0.0.1:18888/`。保存源码或 Markdown 后自动重建并刷新；不要直接双击 `index.html` 预览。

创建第一篇文章：

```bash
cp templates/template-standard-post.md posts/my-first-note.md
```

修改标题、标签、摘要与正文即可。所有模板的选择方法、字段说明和独立页入口示例见 [写作模板指南](templates/README.md)。

## 常用命令

| 命令 | 用途 |
| --- | --- |
| `npm run dev` / `./run.sh` | 本地预览与自动刷新，默认端口 18888 |
| `./run.sh --port 8900` | 使用其他端口 |
| `./run.sh --daemon` | 后台预览，日志写入 `server.log` |
| `npm run build:preview` | 只生成本地预览资源 |
| `npm run build` | 构建并组装完整站点到 `_site/` |
| `./check.sh` | 构建、内容校验、语法检查与 Node/Python 测试 |
| `npm test` | 单独执行 JavaScript 测试 |
| `npm run build:og` | 根据站点配置重新生成分享图 |
| `./deploy.sh "更新说明"` | 完整检查、提交并推送，触发线上部署 |

`run.sh` 与 `check.sh` 优先使用项目 `.venv`；其他 Python 环境可通过 `AURORA_PYTHON` 指定。`deploy.sh` 会执行 `git add .`，运行前检查改动范围。

## 白天与黑暗模式

导航右侧的太阳／月亮按钮可切换主题，桌面和手机均可使用，键盘可通过 Tab 聚焦后按 Enter 或空格操作。

- 首次访问跟随系统外观；没有手动选择时，系统外观改变会同步更新。
- 点击切换后记住当前浏览器的偏好，刷新、跳转页面或重新打开网站都会保留。
- 同源标签页同步主题选择。浏览器禁止本地存储时，仍可切换当前页面。
- 清除站点存储中的 `aurora_blog_theme_v3` 后重新加载，可恢复跟随系统。
- 首屏在样式与 Vue 加载前确定主题，避免刷新时闪到另一种外观。

颜色和透明层统一定义在 [main.css](src/styles/main.css)：`:root` 是黑暗调色板，`:root[data-theme="light"]` 覆盖浅色值。代码高亮、公式、搜索、下拉菜单和附件控件共用这些令牌；图片和 PDF 内容保留原貌。修改配色时调整令牌，不要给某个页面另写一套颜色。强调按钮文字使用独立的 `--text-on-accent`。

## 目录与修改位置

```text
src/
├── components/        # Navbar、Footer、主题、搜索、文章与附件等公共组件
├── views/             # 页面组装
├── composables/       # 文档、折叠、阅读与主题生命周期
├── lib/               # 内容状态、路由、Markdown、主题和预览逻辑
├── config/
│   ├── blog.config.js # 站点信息、作者、功能开关、操作入口
│   └── routes.js      # 路由与主导航的唯一声明来源
└── styles/            # main.css 令牌与共享样式、utilities.css 编译入口
posts/                 # 文章、专栏、书籍、索引与独立页
about.md               # About 的结构化内容
attachments/           # 原始 PDF、Office、图片、音视频与下载资料
templates/             # 不公开发布的写作模板
scripts/               # 构建、校验、发布组装与 Python 内容编译
index.html             # 首屏主题、静态 SEO、Vue 挂载入口
check.sh               # 完整检查
.cache/                # 忽略的正式构建／本地预览缓存
_site/                 # 忽略的完整静态发布产物
```

Vue 组件管理交互；只有经过 DOMPurify 清理的 Markdown 正文使用 `v-html`。正文按需加载，全文索引首次搜索时加载，PDF.js 与 KaTeX 按需加载。生成的内容索引、CSS 和应用包无需提交，CI 会从源码重建。

## 站点配置

全部配置字段、当前值及生效范围见 [config 配置说明](docs/configuration.md)。

修改 [blog.config.js](src/config/blog.config.js) 中的配置：

| 配置 | 内容 |
| --- | --- |
| `site` | 标题、Logo 文本、简介、部署 URL、页脚与阅读速度 |
| `author` | 作者、头像和 About 默认资料 |
| `features` | 搜索、目录、公式、高亮、阅读进度、首页分页 |
| `actions` | 导航右侧的站外操作链接 |
| `exclude` | 测试文章、草稿目录和指定文件排除规则 |

修改标题、描述、站点 URL 或页脚时，同步 `index.html` 中的静态 SEO／无 JS 兜底文本，再运行 `./check.sh`。分享图文案改变后另运行 `npm run build:og`。

`site.url` 填部署根地址，包含子路径、末尾不加 `/`。配置后构建生成 `sitemap.xml`。阅读速度使用 `site.wordsPerMinute`，英文按单词、中文按字符估算阅读时长。

## 写文章、专栏与书籍

完整字段字典（包括结构化区块与旧字段兼容）见 [Markdown YAML 说明](docs/frontmatter.md)。

最小文章放在 `posts/` 中：

```markdown
---
title: "我的第一篇笔记"
tags: ["技术笔记"]
excerpt: "用一两句话说明文章解决的问题。"
---

先写引言。

## 问题与方法

在这里撰写正文。
```

页面会显示 FrontMatter 标题，正文不必重复 `#` 大标题。`date` 可省略，首次构建写入并保持不变；`updated` 可记录更新日期。`slug` 可省略，由文件名自动生成：中文保留、英文转小写、空格与符号转连字符。修改文件名会改变自动地址；要保持地址稳定就显式填写 `slug`。

| `type` | 场景 | 进入文章流 |
| --- | --- | --- |
| `normal`（默认） | 普通文章，也可通过 `column` 组成专栏 | 是 |
| `books` | 通过 `column` 聚合的书籍章节 | 是，首页按书聚合 |
| `index` | 分组知识索引、编号阅读入口 | 是 |
| `post` | About 式结构化独立页 | 否，需配置页面入口 |

新内容只使用 `type`；`category` 已停用，主题分类放进 `tags`。`pinned: true` 首页置顶；`home: false` 仅隐藏首页展示，文章仍保留在归档、标签和搜索中。

专栏／书籍章节追加：

```yaml
column: "my-series"
columnName: "我的专栏"
columnDesc: "介绍这个系列的阅读目标。"
order: 1
```

同组的三个 `column` 字段保持一致，每章使用不同的正整数 `order`。普通专栏自动进入 Columns；加上 `type: books` 则进入 Books，推荐放 `posts/books/my-book/`。上一章／下一章按章节顺序生成，无需手写。书籍插图放 `attachments/books/my-book/`。

结构化独立页支持 `focus`、`bio`、`quote`、`timeline`、`focusAreas`、`publications` 和 `social`。时间线与关注领域的 `detail` / `links` 提供折叠内容；论著按年份分组，支持展开摘要与点击加载 PDF。具体格式见 [独立页模板](templates/template-independent-page.md) 和 [论著模板](templates/template-publications-page.md)。

仓库收录的 **Git from the Bottom Up** 保留原文来源与 CC BY 4.0 许可；导入日期为本地收录日期。

## 路由与导航

路由与主导航都由 [routes.js](src/config/routes.js) 的 `routeTable` 派生。新增模块先登记路由表，不要直接修改 Navbar 或在 `config.nav` 里手写站内入口。

| 内容 | 规范地址 |
| --- | --- |
| 首页／关于 | `/`、`/about` |
| 归档 | `/archive`；`/posts` 自动收敛到归档 |
| 文章与书籍章节 | `/posts/:slug` |
| 专栏／专栏详情 | `/columns`、`/columns/:columnSlug` |
| 书目／章节目录 | `/books`、`/books/:slug` |
| 标签与交集 | `/tags`、`/tags/:tag`、多标签路径或查询参数 |
| 搜索 | Cmd+K / Ctrl+K 弹窗，无独立展示路由 |

当前使用 Hash 路由，浏览器地址形如 `/#/archive`。Roadmap 声明目前处于注释状态，启用时需在路由表中登记。

新增结构化单页的例子（先创建对应文件）：

```javascript
{
  name: 'publications',
  path: '/publications',
  view: 'page',
  shell: 'shell',
  kind: 'page',
  page: 'posts/publications.md',
  nav: { label: 'Publications', group: 'about', target: 'file:posts/publications.md' },
  note: '研究成果单页。'
}
```

新模块沿用小写连字符地址，集合使用复数名词并声明详情路径；过滤、排序和分页放查询参数。About、Archive 等单页沿用现有命名。主导航通过 `group` 折叠，搜索与主题归操作区。导航容器不要使用 `overflow-*`，以免裁切下拉菜单。修改后执行 `./check.sh`。

所有标准页面使用 `shell`（720px），只有文章详情用 `shell-detail`（1000px）放正文和常驻目录；宽度令牌在 `main.css`。列表保持单栏，Archive 不加分割线或计数标签，标签云保持紧凑胶囊。

## 正文写法

### 站内引用

```markdown
[[文章的slug]]
[[文章的slug|自定义文字]]
[显示文字](posts/另一篇文章.md)
```

也可引用文章标题、文件路径或专栏名称；标签歧义时用 `[[#标签名]]`。不要硬编码 `#/posts/...`。未找到的双链显示缺失标记，发布前需修正。`type: index` 用二级标题分组、列表整理文章链接，自动生成分组导航与编号。

### 数学、代码与提示块

行内数学使用 `\(E = mc^2\)` 或同行 `$$E = mc^2$$`，不使用单美元符号。块公式的 `$$` 独占前后两行，整个块前后留空行。狄拉克符号写 `\left| \psi \right\rangle`；多行等式用 `aligned`，不用 `align`。

代码使用带语言名的围栏，支持 JavaScript、TypeScript、Python、Bash、YAML、BibTeX、Markdown 等已注册语言，自动提供高亮和复制。添加语言时需同步本地 Prism 组件；构建会检查遗漏。

```text
::: note 笔记
提示内容。
:::
```

提示类型支持 `tip`、`note`、`warning`、`danger`，使用全站蓝／青强调令牌并适配日夜主题。

### 图片、附件与演示文稿

所有静态材料放 `attachments/`；路径相对站点根书写。图片放在 `posts/` 旁边不会被发布，构建会报错。

```markdown
![图片说明](attachments/images/my-image.png)
[课程资料](attachments/files/my-notes.docx)
```

启用前必须上传真实文件。文末集中附件使用 FrontMatter：

```yaml
attachments: ["attachments/files/data.zip", "attachments/files/my-notes.docx"]
```

附件显示类型、大小、预览与下载入口。PDF / Word / PPT 点击后才加载预览；`.doc`、`.docx`、`.ppt`、`.pptx` 在构建时由 LibreOffice 转成 PDF，并缓存结果。macOS 支持 `/Applications/LibreOffice.app`，其他环境使用 PATH 中的 `soffice`，也可设置 `AURORA_SOFFICE`。CI 已安装转换器与中文字体。PPT 不保留动画、音视频和切换效果，复杂版式可能与 Office 有差异。外部 Office 链接不自动转换。

演示文稿可用 FrontMatter `slide: "attachments/slides/talk.pdf"` 在文首提供入口，或用正文 `::: slide 路径 标题` 指定位置；同文件会去重。支持翻页、缩放和全屏。音视频可使用带 `controls` 的原生 `audio` / `video`。完整例子见 [媒体模板](templates/template-media-attachments.md) 与 [课件模板](templates/template-slide-presentation.md)。

## 阅读与搜索

- 首页、书目与书籍详情提供继续阅读；当前浏览器最多保存 100 条进度，点击继续阅读时才恢复位置。
- 阅读设置可调整字号、行距并保存；章节目录支持折叠，手机底部提供上一篇、目录、下一篇。
- 搜索支持文章、书籍、标签与正文片段；空搜索优先显示最近阅读。方向键选择、Enter 打开、Escape 关闭。
- 文末展示共同标签的相关文章和「引用本文」；引用关系由双链与相对 `.md` 链接在构建时生成，代码示例不参与统计。
- 控件支持键盘焦点和系统减少动效偏好，正文加载失败可重试。

## 构建与发布

本地预览产物写入 `.cache/preview/`；正式构建写入 `.cache/build/`，由 `scripts/assemble-site.js` 按白名单组装到 `_site/`。源码、Markdown、脚本和模板不直接发布。文件监听排除生成数据、日志与缓存，避免重载循环。

GitHub 仓库 Settings → Pages → Build and deployment → Source 选择 **GitHub Actions**。`.github/workflows/static.yml` 对 PR 运行检查，推送主分支时在通过检查后部署。可使用：

```bash
./check.sh
./deploy.sh "发布新文章"
```

`deploy.sh` 自带完整检查；上面的独立检查适合提交前验证。CI 从干净源码构建，不需要维护 `gh-pages` 分支。发布目录包含入口 HTML、CSS、JS、JSON 数据、第三方资源、附件与 SEO 文件，构建会阻止源码泄露。

## 常见问题

**新增文章或修改配置后没变化？** 本地使用 `./run.sh` 自动构建，正式构建运行 `npm run build`。确认浏览器访问 HTTP 预览地址；必要时强制刷新。

**附件报 missing resource？** 检查文件真实存在、大小写一致，并位于 `attachments/` 中。模板中的示例路径必须替换后才能启用。

**时间线没有展开箭头？** 只有 `detail` 或 `links` 有内容才会显示箭头，纯描述条目不会生成空开关。

**论著没有正确显示？** 检查 YAML 缩进，`publications` 是对象列表；`abstract` 与 `links` 同级，年份使用四位数字。

**为什么 sitemap 只有一个地址？** Hash 片段不是独立文档 URL，因此 sitemap、canonical 和 `og:url` 统一指向站点根。若要独立文章 SEO，需要另行迁移路由与静态页面架构。

**修改 slug 后旧链接还能用吗？** 当前没有文章旧 slug 兼容层。发布后尽量保持显式 slug 稳定；模块路由变更则必须保留兼容重定向。

**本地反复自动刷新？** 日志和运行期产物已经排除；新增缓存或临时文件时，也需加入 `scripts/python/server.py` 的忽略规则。

开发的设计、组件与路由约束见 [AGENTS.md](AGENTS.md)；写作从 [模板指南](templates/README.md) 开始。
