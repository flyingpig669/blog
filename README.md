# Aurora Notes (极光随笔)

> 冷静、克制、严谨的深色科技风个人博客系统。整体美学参考 Linear、Vercel 与 Raycast 的深色设计语言：靠充裕留白与 1px 极细边框建立视觉秩序，杜绝高饱和度色块堆砌，内容优先。

---

## 目录索引 (Documentation Index)

- [一、核心架构与项目结构](#一核心架构与项目结构)
- [二、全站统一配置手册 (blog.config.js)](#二全站统一配置手册-blogconfigjs)
- [三、个人经历与时间线配置 (about.md)](#三个人经历与时间线配置-aboutmd)
- [四、零代码动态栏目扩展与前端路由机制](#四零代码动态栏目扩展与前端路由机制)
- [五、博文撰写与专栏目录组织 (posts/)](#五博文撰写与专栏目录组织-posts)
- [六、排版语法与前沿功能支持](#六排版语法与前沿功能支持)
- [七、自动化部署流程 (GitHub Actions & Pages)](#七自动化部署流程-github-actions--pages)
- [八、本地开发与预览调试](#八本地开发与预览调试)
- [九、常见问题排查与技术问答 (FAQ)](#九常见问题排查与技术问答-faq)

---

## 一、核心架构与项目结构

本系统采用现代轻量级单页应用（SPA）静态架构。无需 Node.js 打包或 Webpack/Vite 复杂编译流程，直接由浏览器原生执行，秒级加载且零构建依赖维护成本。

```text
~/Documents/blog/
├── blog.config.js          # ⭐️ 全局统一配置中心 (站点属性、作者名衔、社交链接、导航定义)
├── about.md                # ⭐️ 关于页独立数据源 (履历时间线、关注领域、精选项目、座右铭)
├── projects.md             # 自定义拓展页面示例 (项目展厅)
├── index.html              # 主入口 HTML (SPA 挂载容器、极简无扰页脚、资源载入)
├── css/
│   └── main.css            # 设计系统样式体系 (Tokens、Linear 时间线、Bento 网格、响应式断点)
├── js/
│   ├── app.js              # 核心控制器 (动态路由匹配分发、模块化视图渲染、Scrollspy 滚动侦听)
│   ├── store.js            # 数据中心 (响应式连接配置与编译数据，隔离管理本地点赞/浏览状态)
│   ├── posts-data.js       # 自动编译生成的纯净博文与页面索引包 (由 sync_posts.py 生成)
│   ├── markdown.js         # Markdown + KaTeX 学术数学公式 + Prism 语法高亮解析引擎
│   └── icons.js            # 极简 SVG 图标库 (GitHub, Twitter, Mail, RSS, Search 等)
├── posts/                  # ⭐️ 用户博文存放目录 (纯 Markdown，无干扰数据)
│   └── hello-world.md      # 初始入门指南
├── sync_posts.py           # 自动化编译脚本 (扫描 posts/、about.md 与自定义页面并更新 posts-data.js)
├── deploy.sh               # 一键自动发布脚本 (本地编译 -> Git Commit -> Push 到 GitHub)
├── server.py               # 本地轻量预览服务器 (支持自定义端口如 18888 与后台守护模式)
├── AGENTS.md               # UI 设计系统规范与开发协作约束手册
└── README.md               # 本项目详细文档
```

---

## 二、全站统一配置手册 (`blog.config.js`)

全站所有核心属性收敛在根目录的 [**`blog.config.js`**](blog.config.js)。修改此文件即可实现全站响应，无需翻找繁琐的 HTML 或 JS 模板：

```javascript
window.BlogConfig = {
  // 1. 站点基础信息 (Site Metadata)
  site: {
    title: "Aurora Notes",         // 浏览器标签页标题
    brand: "aurora.notes",         // 顶部 Logo 文字 (/ aurora.notes)
    tagline: "Curated research essays and computing fundamentals.", // 首页大标题下方副标题
    description: "Personal technical blog.",                        // SEO 搜索引擎描述
    footerText: "© 2026 Alex Chen · All rights reserved.",         // 全局页脚版权 (整站极简展示)
    postsPerPage: 10,              // 分页单页篇数
    wordsPerMinute: 300,           // 预估阅读速度 (每分钟字数)
  },

  // 2. 作者个人资料 (Author Profile)
  author: {
    name: "CCC",                   // 作者展示姓名
    title: "Student",              // 头衔 / 角色
    bio: "Physics, Math & Computer Science.", // 一句话简介
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=CCC&backgroundColor=161618&textColor=EDEDED&fontWeight=600", // 头像 URL
    location: "Shandong, China",   // 常驻地点
    email: "flyingpig06@outlook.com", // 电子邮箱
    github: "https://github.com/flyingpig669", // GitHub 主页
  },

  // 3. 顶部主导航菜单 (Navigation Menu - 支持零代码动态扩展)
  nav: [
    { id: "home", label: "Home", route: "/" },
    { id: "columns", label: "Columns", route: "/columns" },
    { id: "projects", label: "Projects", route: "/projects", title: "Projects", subtitle: "Selected open-source and engineering experiments.", file: "projects.md" },
    { id: "archives", label: "Archive", route: "/archives" },
    { id: "categories", label: "Tags", route: "/categories" },
    { id: "about", label: "About", route: "/about" }
  ],

  // 4. 社交媒体与联系方式 (Social Links - ⭐️ 仅在 About 页面独占展示，页脚保持纯净)
  social: [
    { name: "GitHub", url: "https://github.com/flyingpig669", icon: "github" },
    { name: "Twitter", url: "https://twitter.com", icon: "twitter" },
    { name: "Email", url: "mailto:flyingpig06@outlook.com", icon: "mail" },
  ],

  // 5. 专栏 / 系列默认元信息 (Series Metadata Fallback)
  columns: {
    "system-design": {
      name: "System Design & Distributed Architecture",
      desc: "Deep dives into high-availability systems, consensus algorithms, and cloud infrastructure.",
      icon: "terminal"
    }
  },

  // 6. 功能开关 (Feature Toggles)
  features: {
    readingProgress: true,  // 顶部平滑阅读进度条
    outlineSidebar: true,   // 文章详情页常驻右侧悬浮 Outline 目录导航与实时高亮
    searchModal: true,      // 快捷键 Cmd+K / Ctrl+K 全文即时检索
    editor: true,           // 在线实时预览 Markdown 创作器 (#/editor)
    mathKaTeX: true,        // 学术级数学公式 KaTeX 解析引擎
    codeHighlight: true     // 代码块语法高亮与悬浮一键复制代码
  }
};
```

---

## 三、个人经历与时间线配置 (`about.md`)

为了避免直接倾倒原生 Markdown 导致的排版粗糙感，关于页全面采用了**数据驱动的组件化渲染架构**。

你只需在根目录下的 [**`about.md`**](about.md) 中像填写表格一样维护内容，前端会自动以 Linear 风格的**带发光导轨纵向时间线**、**Bento 卡片**及**项目胶囊**呈现：

```yaml
---
# 状态标签与个人座右铭
status: "Physics, Math & Computer Science"
quote: "Turning complexity into clean order through rigorous logic, mathematics, and craft."
bio: "热爱理论物理与计算机科学的交叉前沿。致力于从高维希尔伯特空间、哈密顿量演化与微观统计力学的物理视角，理解并构建现代大规模计算架构与复杂分布式系统。坚持极简主义与深度心流开发，崇尚用严谨的数学推导与干净的代码建立秩序。"

# 经历与时间线 (Timeline & Milestones) - 随时在此记录不同阶段的沉淀
timeline:
  - period: "2024 – PRESENT"
    title: "架构设计与前沿计算探索"
    desc: "深耕高吞吐分布式共识算法（Raft / Paxos）与容灾架构；探索量子线路变分模拟、张量网络计算与自注意力机制的数学同构。"
  - period: "2022 – 2024"
    title: "核心系统研发与基础设施优化"
    desc: "主导云原生后端基础设施重构，优化微服务拓扑与多级缓存一致性；搭建端到端高可用监控体系。"
  - period: "2020 – 2022"
    title: "现代 Web 架构与工程化探索"
    desc: "深入探索现代前端响应式渲染引擎演进（Virtual DOM Diff、Signals 与 Server Components）；活跃于开源社区。"

# 核心关注领域 (Focus Areas) - 自动渲染为双列卡片 Bento 网格
focusAreas:
  - title: "分布式系统与高可用架构"
    desc: "分布式共识协议、一致性存储模型与高并发中间件开发。"
  - title: "数学与理论物理同构"
    desc: "复线性代数、高维希尔伯特空间、信息熵与统计热力学。"
  - title: "现代化工程美学"
    desc: "精细化 Design Tokens、极简暗色交互与极致留白秩序。"

# 精选项目 (Selected Projects) - 自动渲染为带外链指示标与技术标签的交互卡片
projects:
  - name: "Aurora Notes"
    tag: "Open Source"
    desc: "冷静、克制、严谨的深色科技风个人博客系统。"
    url: "https://github.com/flyingpig669/blog"
  - name: "Distributed Engine"
    tag: "Go / Systems"
    desc: "基于 Raft 协议构建的高性能分布式键值存储系统。"
    url: "https://github.com/flyingpig669"
  - name: "Quantum Simulator"
    tag: "Python / Physics"
    desc: "轻量级态矢量仿真器与 Bloch 球面演化工具。"
    url: "https://github.com/flyingpig669"
---
```

> **关于页独占联系方式**：关于页底部会自动挂载 `blog.config.js` 中声明的社交渠道卡片（配备专属图标与动态悬浮箭头），而全站其他页面底部保持纯净无扰。

---

## 四、零代码动态栏目扩展与前端路由机制

### 1. Hash 客户端路由机制说明
本项目采用客户端 Hash 路由（`#/path`）：
* 首页：`/#/`
* 专栏：`/#/columns`
* 归档：`/#/archives`
* 标签：`/#/categories`
* 关于：`/#/about`
* 动态项目页：`/#/projects`
* 文章详情页：`/#/post/<post-id>`
* 在线创作器：`/#/editor`

**为什么使用 Hash 路由？**
在 GitHub Pages 等纯静态服务器托管场景下，普通 HTML5 History 路由在用户直接刷新页面或分享深层链接时会导致致命的 404 错误。而 Hash 路由由浏览器内核原生处理哈希变化（`hashchange` 事件），无论在本地开发还是云端部署，均 100% 保证刷新不丢页、免去复杂的服务器端重定向配置。

---

### 2. 零代码新增栏目指南
系统内置了动态路由分发引擎，**你无需编写任何 JavaScript 代码**，只需在 `blog.config.js` 的 `nav` 数组中添加配置即可开箱即用：

#### 场景 A：新增独立 Markdown 页面（如项目展厅、友链、书单）
```javascript
// 在 blog.config.js 的 nav 中添加：
{ 
  id: "projects", 
  label: "Projects", 
  route: "/projects", 
  title: "Projects", 
  subtitle: "Selected open-source and engineering experiments.", 
  file: "projects.md" 
}
```
在根目录下创建对应的 `projects.md`，运行发布命令，系统会自动将其编译并以整站统一规范渲染（包含标题留白、1px 分割线、代码块高亮与卡片动效）。

#### 场景 B：按分类或标签自动筛选博文（如只看硬件、读书笔记）
```javascript
{ 
  id: "papers", 
  label: "Papers", 
  route: "/papers", 
  category: "papers", 
  title: "Research Papers", 
  subtitle: "Reading notes on theoretical physics and quantum computing." 
}
```
配置后，该栏目会自动拉取所有 `category: "papers"` 的文章，并直接套用统一的博文列表流。

#### 场景 C：纯卡片集合页面（直接在配置中声明卡片）
```javascript
{ 
  id: "tools", 
  label: "Tools", 
  route: "/tools", 
  title: "Recommended Tools",
  subtitle: "Essential tools for daily workflows.",
  items: [
    { title: "Neovim", desc: "Hyperextensible Vim-based text editor.", tag: "Editor", url: "https://neovim.io" },
    { title: "Ghostty", desc: "Fast, GPU-accelerated terminal emulator.", tag: "Terminal", url: "https://ghostty.org" }
  ]
}
```

---

## 五、博文撰写与专栏目录组织 (`posts/`)

### 1. 单篇文章撰写
直接在 `posts/` 目录下创建 `.md` 文件（例如 `posts/my-article.md` 或 `posts/tech/my-article.md`）：

```markdown
---
title: "我的第一篇技术文章"
date: "2026-10-09"
category: "architecture"
tags: ["分布式", "架构设计", "Raft"]
pinned: false
excerpt: "这里是一句话摘要，若不填写将自动提取正文前 140 字符。"
---

# 正文从这里开始
正文支持各种高级排版语法与公式渲染。
```

### 2. 专题专栏（Series / Columns）组织
若需要创建体系化的长文专题，在 `posts/columns/` 下建立文件夹：

```text
posts/columns/distributed-systems/
├── 01-consensus-and-raft.md
├── 02-log-replication.md
└── 03-membership-changes.md
```

文件名中的数字序号（如 `01-`、`02-`）会自动识别为章节顺序（Part 01、Part 02），并在专栏页面（Columns）自动汇聚为时间线章节索引。

---

## 六、排版语法与前沿功能支持

### 1. 常驻悬浮 Outline 目录导航
* **桌面端自适应浮动**：屏幕宽度 $ge 600	ext{px}$ 时，文章右侧常驻吸顶目录，标题滚动时实时高亮指示当前小节（Scrollspy）。
* **平滑跳转避让**：点击目录任意标题，平滑滚动至对应段落，并自动避让顶部 56px 固定导航栏（预留 76px 舒适缓冲区）。
* **移动端自适应**：在小屏手机上优雅折叠为右下角 `# Outline` 悬浮胶囊与侧滑抽屉。

### 2. 学术级数学与物理公式 (KaTeX)
为确保在各种环境下渲染稳健，严格遵循以下规范：
* **行内公式**：使用双美元符号（如 `$$E = mc^2$$`）或 LaTeX 圆括号转义（`\( E = mc^2 \)`）。
* **块级方程式**：前后保留空行：
  $$
  i hbar rac{partial}{partial t} left| psi(t) ightangle = hat{H} left| psi(t) ightangle
  $$
* **语法建议**：狄拉克符号推荐使用 `\left| \psi \right\rangle`，多行公式推荐在 `$$` 内使用 `\begin{aligned} ... \end{aligned}`。

### 3. 深色代码高亮与一键复制 (Prism)
代码块采用 `#161618` 暗色底衬，右上角支持悬浮即现的一键复制按钮：
```python
def fibonacci(n: int) -> int:
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a

print([fibonacci(i) for i in range(10)])
```

### 4. 提示块 Callouts 语法
支持四种级别的语义化提示容器：
```markdown
::: tip 提示
这是常规提示块。
:::

::: warning 注意
这是告警提示块。
:::

::: note 笔记
这是笔记提示块。
:::

::: danger 警示
这是危险警示块。
:::
```

---

## 七、自动化部署流程 (GitHub Actions & Pages)

本项目发布流程采用单一的 **`main`** 分支，无需维护任何冗余分支。

### 自动化一键发布（推荐）
在项目根目录下直接运行：
```bash
cd ~/Documents/blog
./deploy.sh "发布新文章与更新配置"
```

该脚本将依次执行：
1. 调用 `python3 sync_posts.py`，自动扫描编译所有博文、`about.md` 及自定义 Markdown 文件生成 `js/posts-data.js` 索引。
2. 收集本地变更并创建 Git Commit。
3. 推送到远程 GitHub 仓库的 `main` 分支。
4. 自动触发云端 [**`.github/workflows/static.yml`**](.github/workflows/static.yml) 工作流，全自动完成 GitHub Pages 在线打包与上线。

> **GitHub 仓库设置检查**：
> 进入 GitHub 仓库 -> **Settings** -> **Pages** -> 将 **Build and deployment / Source** 设置为 **GitHub Actions** 即可。

---

## 八、本地开发与预览调试

项目内置了轻量 Web 服务器，在本地根目录下运行：

```bash
cd ~/Documents/blog

# 方式 1: 启动后台守护进程 (推荐，当前配置端口 18888)
python3 server.py 18888 --daemon

# 方式 2: 使用启动脚本
./run.sh
```

在浏览器中打开：`http://127.0.0.1:18888/` 即可实时预览全站效果。

若需要更换运行端口：
打开 `server.py` 修改第 8 行 `PORT = 18888` 为你想要的端口号（如 `8900`）即可。

---

## 九、常见问题排查与技术问答 (FAQ)

### Q1: 新增的 Markdown 文章为什么在网页上没有显示？
**解答**：静态博客依赖文章索引包 `js/posts-data.js`。
1. 本地预览时：在根目录下执行一次 `python3 sync_posts.py` 重新扫描并更新索引文件。
2. 发布到云端时：直接运行 `./deploy.sh`，脚本会在提交前自动完成同步编译，GitHub Actions 也会在构建阶段自动执行一次编译。

### Q2: 为什么修改了头像或文字，浏览器刷新没有改变？
**解答**：现代浏览器会对静态资源进行强缓存。
1. 在浏览器中按下 `Cmd + Shift + R`（Mac）或 `Ctrl + F5`（Windows）强制刷新清除缓存。
2. 在隐私模式（Incognito Window）中打开验证。

### Q3: 为什么不使用 gh-pages 分支了？
**解答**：GitHub 官方现代推荐的 Pages 部署方式为 **GitHub Actions 原生部署**。相比于传统的 `gh-pages` 分支推送，GitHub Actions 直接从 `main` 源码构建部署，免去了双分支来回同步冲突的繁琐问题，版本树更加纯净。

### Q4: 如何自定义整站主题强调色？
**解答**：打开 [**`css/main.css`**](css/main.css)，在 `:root` 变量中修改：
* `--accent-primary: #3B82F6;`（电光蓝主强调色）
* `--accent-secondary: #22D3EE;`（青绿点缀色）
保存后刷新页面即可全局替换强调色风格。
