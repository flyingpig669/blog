# 极光随笔 (Aurora Notes) · 现代化独立博客系统

> 探索技术前沿 · 沉淀思考与生活。一个基于现代 Web 技术构建的全功能、单页交互式（SPA）个人技术与生活博客系统。

![Aurora Notes Home](https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80)

## 项目简介

**极光随笔（Aurora Notes）** 专为开发者、技术作者与数字游民设计，集成了内容浏览、多维分类、全文即时搜索、数学公式与代码高亮渲染、双栏实时预览 Markdown 编辑器以及评论互动系统。整体架构轻量且完备，所有第三方核心依赖已本地离线化整合，无需复杂的 Node.js 打包或预编译流程，即可在任何设备上实现开箱即用。

---

## 核心功能特性

### 1. 沉浸式阅读与视觉设计
- **双主题引擎**：内置深邃暗夜（Dark）与极简亮白（Light）两种视觉模式，支持一键切换并自动同步系统级色彩偏好。采用平滑缓动贝塞尔曲线与毛玻璃滤镜（Backdrop Blur）。
- **动态阅读进度条**：视口顶部精准反馈当前文章的滚动与阅读进度百分比。
- **悬浮目录导航（TOC）**：自动提取正文中的各级标题，结合滚动位置进行目录项的高亮跟踪，支持点击锚点平滑平移。
- **响应式网格布局**：自适应适配桌面大屏、平板以及移动端设备，配备专用的折叠抽屉导航菜单。

### 2. 深度排版与富文本渲染
- **KaTeX 数学公式渲染**：原生支持行内公式与独立块级公式，支持矩阵、极限、微积分与求和符号，例如：
  $$
  \text{Attention}(Q, K, V) = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V
  $$
- **Prism.js 代码高亮引擎**：覆盖 JavaScript、TypeScript、Python、Go、Bash、CSS、JSON 等常用开发语言，配备语言标识徽章与一键复制代码功能。
- **语义化提示块（Callouts）**：支持使用 `::: tip`（提示）、`::: warning`（警告）、`::: note`（笔记）、`::: danger`（警示）构建富信息结构。

### 3. 全局实时检索与多维筛选
- **全局搜索浮层（`⌘K` / `Ctrl+K`）**：支持快捷键随时唤起居中搜索面板，对全站文章标题、摘要、标签以及正文内容进行毫秒级全文检索与快速直达。
- **硬核科技与前沿分类**：主题分类升级为**量子计算与深度智能**（融合高维希尔伯特空间、量子线路模拟、统计物理与深度自注意力同构）、前端技术、后端架构、设计美学与思考随笔，提供动态排序（最新发布、获赞最多、阅读最多）与标签云筛选。

### 4. 强大的在线创作与图片自动化管理
- **剪贴板截图粘贴（⌘V / Ctrl+V）**：无需手动上传并编写图片链接，直接截屏后在编辑区按粘贴键，系统自动通过 HTML5 Canvas 压缩为高保真轻量格式（WebP/JPEG），自动生成 Markdown 图片语法并即时渲染预览。
- **本地图片拖拽与上传**：支持将本地 PNG/JPG 图像直接拖拽放入编辑区，或点击“插入图片”按钮选择，自动完成尺寸规范化与插入。
- **双栏分屏实时预览**：左侧 Markdown 源码编辑，右侧同步更新排版、公式渲染与代码高亮效果。
- **编辑快捷工具栏**：支持一键插入加粗、斜体、各级标题、引用块、行内代码、语言代码块、数学公式及提示框。
- **本地草稿箱**：编辑内容实时缓存，防止误关浏览器导致未完稿丢失。

### 5. Markdown 文件导入与离线 Commit 机制
- **Web 界面一键导入**：点击编辑器顶部的“导入 .md 文档”按钮，或将电脑中的 `.md` 文件直接拖拽入编辑区，系统会自动解析 YAML Frontmatter（标题、日期、分类、标签）并填充至表单，随时可进行二次修改或立即发布。
- **本地目录批量 Commit 同步**：支持在 `outputs/blog/posts/` 目录中像写本地笔记一样保存 `.md` 文件，运行 `python3 sync_posts.py` 即可批量扫描并全自动 Commit 同步至博客索引数据库，适合配合 Obsidian 或 VS Code 离线写作工作流。

### 6. 系统化专题专栏（Series & Columns）
博客原生支持深度系统化专栏连载，已重磅上线**《量子物理与深度智能前沿专栏》**等 4 大专题专栏：
- **⚡《量子物理与深度智能前沿专栏》 (Quantum Physics, Math & AI)**：
  - **第 1 讲**：《量子态叠加与希尔伯特空间：狄拉克符号、Bloch 球面与幺正变换》——严密解构复内积空间、两能级系统态叠加、Pauli/Hadamard 量子门阵列与量子不可克隆定理。
  - **第 2 讲**：《量子机器学习（QML）：变分量子线路（VQC）与参数化哈密顿量优化》——深入 NISQ 时代量子神经网络、Parameter-Shift Rule 解析求导法则与量子贫瘠高原（Barren Plateaus）破解方案。
  - **第 3 讲**：《从量子信息熵到注意力机制：统计物理与 Transformer 的数学同构》——打通密度算符、冯·诺依曼信息熵、吉布斯玻尔兹曼正则系综、现代连续 Hopfield 能量泛函与大模型注意力机制的物理学统一同构。
- **《大模型系统化实战专栏》**：Prompt 提示词控制与生产级 RAG 检索增强。
- **《现代前端架构演进专栏》**：从虚拟 DOM 到细粒度 Signals 响应性与 RSC。
- **《分布式共识与系统工程专栏》**：Paxos、Raft 机制与高可用架构。

### 7. 互动反馈与数据持久化
- **点赞与书签系统**：文章底部支持点赞心跳动效与累加计数，支持加入个人本地书签列表，便于随时查阅。
- **评论讨论区**：提供包含昵称、邮箱、正文输入与常用表情快捷插入的评论表单，支持对优质评论单独点赞，所有交互数据均在本地存储中安全持久化。
- **一键重置与恢复**：提供一键恢复预置演示数据的功能，便于快速体验全套功能。

---

## 目录结构说明

```text
outputs/blog/
├── index.html            # 博客单页应用入口主文件
├── server.py             # 基于 Python 3 的轻量级本地 HTTP 服务（支持 CORS 与多端口）
├── run.sh                # 便捷终端一键启动脚本
├── sync_posts.py         # 本地 Markdown 文章批量扫描与 Commit 索引同步脚本
├── README.md             # 项目使用与架构说明文档
├── posts/                # 本地 Markdown 离线撰写与存放目录
│   └── sample-commit.md  # 带有标准 Frontmatter 的本地提交示例文章
├── css/
│   └── main.css          # 全局设计令牌、排版样式、动效与暗黑主题规范
├── js/
│   ├── app.js            # 主程序控制器：前端路由、视图渲染、图片压缩与文件导入
│   ├── store.js          # 本地状态管理与 LocalStorage 持久化存储引擎
│   ├── markdown.js       # 集成 KaTeX、Prism 与 Callout 的增强型 Markdown 解析器
│   ├── sample-data.js    # 默认预置的高质量多领域示例文章与作者配置
│   └── icons.js          # 矢量 Lucide SVG 图标库集合
└── vendor/
    ├── tailwind.js       # 本地离线 Tailwind CSS 样式引擎
    ├── marked.min.js     # 本地离线 Marked.js Markdown 解析核心
    ├── prism.js          # 本地离线 Prism 代码语法高亮核心
    ├── prism-components/ # 常用编程语言语法扩展包
    └── katex/            # 本地离线 KaTeX 数学公式渲染库与 Web 字体资产
```

---

## 快速开始

### 1. 启动本地服务（推荐）

直接在终端中运行启动脚本：

```bash
# 进入项目目录
cd outputs/blog

# 执行一键启动脚本
./run.sh
```

启动后在浏览器中访问 [http://localhost:8900](http://localhost:8900) 即可开始体验。如需在后台守护进程运行，可执行：

```bash
python3 server.py --daemon
```

### 2. 离线双击浏览

在文件管理器（Finder）中直接双击 `index.html`，亦可离线使用完整的阅读、本地图片压缩插入与 Markdown 编辑发布功能。

---

## Markdown 文件手动提交与同步说明

### 方式一：在 Web 编辑器中拖拽导入
1. 访问导航栏的“写文章”页面；
2. 点击顶部“导入 .md 文档”按钮选择本地文件，或直接将桌面上的 `.md` 文件拖拽进编辑框；
3. 系统将自动解析 Frontmatter 中的元信息并填充表单，直接点击“立即发布”即可入库。

### 方式二：在 posts/ 目录中编写并命令行 Commit
1. 在 `outputs/blog/posts/` 目录下新建或存放 `.md` 文件，推荐包含标准头部：

```markdown
---
title: 我的新架构实践思考
date: 2026-10-07
category: backend
tags: [Go, 微服务, 分布式]
---

## 正文内容...
```

2. 在项目根目录执行同步命令：

```bash
python3 sync_posts.py
```

终端将打印同步结果，刷新博客首页即可看到最新提交的文章。

---

## 常用快捷键与操作

| 快捷键 / 操作 | 功能描述 |
| :--- | :--- |
| `⌘ + K` 或 `Ctrl + K` | 全局任意页面呼出全文搜索弹窗 |
| `ESC` | 快速关闭搜索弹窗 |
| `⌘ + V` 或 `Ctrl + V`（编辑器内） | 剪贴板屏幕截图自动压缩并插入 Markdown |
| 点击顶部日/夜图标 | 切换亮色、暗黑及跟随系统主题 |
| 点击代码块右上角“复制” | 将完整源码一键复制到操作系统剪贴板 |
| 点击右下角蓝色悬浮箭头 | 平滑返回文章或页面顶部 |

---


---


---

## 文件夹子目录分类与技术专栏（Series）体系

系统原生支持通过文件系统目录树自动组织分类与专题专栏：

### 1. 普通分类子目录
只需在 `posts/` 下创建对应分类名称的文件夹，其中的文章将自动继承该文件夹名称作为分类：
```text
posts/
├── frontend/             # 自动归入“前端技术”分类
│   └── react-notes.md
├── backend/              # 自动归入“后端架构”分类
│   └── go-microservice.md
├── design/               # 自动归入“设计美学”分类
└── life/                 # 自动归入“思考随笔”分类
```

### 2. 专题技术专栏（Series）子目录
在 `posts/columns/<专栏标识>/` 目录下创建子文件夹，系统将自动识别为独立专栏，并在导航栏的 **“专栏”** 页面呈现完整的章节进阶学习树：
```text
posts/columns/
├── llm-in-action/                        # 大模型系统化实战专栏
│   ├── 01-prompt-engineering-mastery.md  # 第 1 讲
│   └── 02-rag-production-guide.md        # 第 2 讲
├── frontend-architecture/                # 现代前端架构演进专栏
│   └── 01-virtual-dom-to-signals.md      # 第 1 讲
└── distributed-systems/                  # 分布式共识与系统工程专栏
    └── 01-consensus-and-raft.md          # 第 1 讲
```

* **章节命名规范**：文件名前缀使用数字（如 `01-xxx.md`、`02-xxx.md`），脚本将自动识别篇章序号并按顺序排版。
* **专栏联动体验**：文章阅读页会自动浮现【专栏连载导读横幅】，展示当前章节序号并支持一键回溯专栏全集目录。

## GitHub Pages 自动化部署指南

系统已内置官方 **GitHub Actions** CI/CD 自动化流水线（[.github/workflows/deploy.yml](.github/workflows/deploy.yml)）与本地一键部署脚本（[deploy.sh](deploy.sh)）。

### 1. 自动化流水线运作原理
无论何时你向 GitHub 仓库的 `main` 分支推送代码或新增/修改 `posts/` 中的 Markdown 文件：
1. GitHub Actions 自动拉取最新仓库；
2. 自动化运行 `python3 sync_posts.py` 重新编译并索引所有博文；
3. 全自动将静态站点发布到 GitHub Pages 全球 CDN 网络，零人工干预。

### 2. 首次启用配置（仅需 1 分钟）
在 GitHub 仓库中开启官方 Pages 支持：
1. 打开你的 GitHub 仓库页面，点击顶部 **Settings**（设置）；
2. 在左侧菜单中找到 **Pages**；
3. 在 **Build and deployment** 下方的 **Source** 下拉菜单中，选择 **GitHub Actions**。

### 3. 本地一键推送与发布

你可以在本地终端中直接运行部署脚本：

```bash
# 进入项目目录
cd outputs/blog

# 运行一键发布脚本（可选附加 commit 说明）
./deploy.sh "添加一篇关于分布式系统的新博文"
```

脚本会自动完成：
- 扫描并同步 `posts/` 下的 Markdown 文件；
- 自动检查并绑定你的 GitHub 远程仓库；
- 提交更新并一键 `git push` 推送，自动触发 GitHub Actions 线上发布。
- 构建完成后，访问 `https://flyingpig669.github.io/blog/` 即可查看线上博客。

## 二次开发与个性化配置

- **博主信息**：修改 `js/sample-data.js` 中的 `author` 对象（姓名、简介、头像、社交链接）。
- **分类主题**：修改 `js/sample-data.js` 中的 `categories` 列表增减分类与色彩。
- **生产部署**：由于全站无打包编译依赖，可直接将 `outputs/blog/` 内的文件推送到 GitHub Pages、Cloudflare Pages、Vercel 或 Nginx 静态目录部署。

---

## 开源许可

本项目基于 [MIT 许可协议](https://opensource.org/licenses/MIT) 开源，文章内容遵循 CC BY-NC 4.0 国际许可协议。