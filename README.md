# Aurora Notes (极光随笔)

> 冷静、克制、严谨的深色科技风个人博客系统。设计语言参考 Linear、Vercel 与 Raycast，依托留白与极细边框建立秩序。

---

## 目录索引

- [一、核心架构与项目结构](#一核心架构与项目结构)
- [二、全站统一配置 (blog.config.js)](#二全站统一配置-blogconfigjs)
- [三、个人介绍与时间线独立文件 (about.md)](#三个人介绍与时间线独立文件-aboutmd)
- [四、博文撰写与专栏目录组织 (posts/)](#四博文撰写与专栏目录组织-posts)
- [五、如何增加新栏目与前端路由设置](#五如何增加新栏目与前端路由设置)
- [六、一键同步与自动部署 (GitHub Pages)](#六一键同步与自动部署-github-pages)
- [七、本地预览与调试](#七本地预览与调试)

---

## 一、核心架构与项目结构

本系统采用纯静态现代化架构，无重度构建工具链依赖，开箱即用。核心文件结构如下：

```text
~/Documents/blog/
├── blog.config.js          # ⭐️ 全局统一配置文件 (站点名、作者、社交链接、导航菜单)
├── about.md                # ⭐️ 独立关于页 Markdown 文件 (个人介绍、经历时间线、项目)
├── index.html              # 主入口 HTML (SPA 挂载容器与资源引用，极简页脚)
├── css/
│   └── main.css            # 科技风样式系统 (Tokens、暗色主题、动效、自适应断点)
├── js/
│   ├── app.js              # 核心应用控制器与模块化视图 (路由分发、页面渲染)
│   ├── store.js            # 数据中心 (连接 BlogConfig 与 BlogPostsData, 响应式状态管理)
│   ├── posts-data.js       # 自动编译的真实博文索引 (由 sync_posts.py 生成)
│   ├── markdown.js         # Markdown + KaTeX 数学公式 + Prism 代码高亮解析引擎
│   └── icons.js            # 极简 SVG 图标库
├── posts/                  # ⭐️ 用户博文存放目录 (Markdown)
│   └── hello-world.md      # 初始入门指南
├── sync_posts.py           # 扫描 posts/ 与 about.md 并编译生成 js/posts-data.js
├── deploy.sh               # 一键自动编译、提交并推送到 GitHub (main 分支)
├── server.py               # 本地轻量预览开发服务器
└── README.md               # 本项目说明文档
```

---

## 二、全站统一配置 (`blog.config.js`)

所有个人信息与站点全局属性均收敛在根目录的 `blog.config.js` 中。**修改此处即可全站生效**：

```javascript
window.BlogConfig = {
  // 1. 站点基础信息
  site: {
    title: "Aurora Notes",         // 浏览器标签页标题
    brand: "aurora.notes",         // 顶部 Logo 文字 (/ aurora.notes)
    tagline: "Curated research essays and computing fundamentals.", // 首页副标题
    description: "Personal technical blog.",                        // SEO 描述
    footerText: "© 2026 Alex Chen · All rights reserved."          // 页脚版权 (全站极简展示)
  },

  // 2. 作者个人资料 (展示在关于页头部与元信息中)
  author: {
    name: "Alex Chen",
    title: "Software Architect & Systems Researcher",
    bio: "Turning complexity into clean order through rigorous logic and craft.",
    avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=AlexChen",
    location: "Shanghai / Remote",
    email: "flyingpig06@outlook.com",
    github: "https://github.com/flyingpig669",
    twitter: "https://twitter.com"
  },

  // 3. 顶部主导航菜单
  nav: [
    { id: "home", label: "Home", href: "#/" },
    { id: "columns", label: "Columns", href: "#/columns" },
    { id: "archives", label: "Archive", href: "#/archives" },
    { id: "categories", label: "Tags", href: "#/categories" },
    { id: "about", label: "About", href: "#/about" }
  ],

  // 4. 社交媒体与联系方式 (⭐️ 仅在 About 页面独占展示，页脚已取消显示)
  social: [
    { name: "GitHub", url: "https://github.com/flyingpig669" },
    { name: "Twitter", url: "https://twitter.com" },
    { name: "Email", url: "mailto:flyingpig06@outlook.com" },
    { name: "RSS", url: "#/archives" }
  ]
};
```

---

## 三、个人介绍与时间线独立文件 (`about.md`)

为了方便你随时更新自己的阶段性经历与成就，关于页已完全由根目录下的 **`about.md`** 独立驱动：

- **随时编辑**：直接打开 `about.md` 编写任意 Markdown 内容，包括**时间线（在哪一个时间段做了一些事情）**、参与项目、技能树等。
- **排版支持**：完全支持二级标题、列表、粗体高亮、数学公式、代码块与引用块。
- **联系方式独占展示**：页面底部会自动挂载 `blog.config.js` 中配置的社交与联系方式卡片（GitHub、Twitter、Email 等）。首页及其他页面的底部已取消联系方式显示，保持极致安静与极简。

### 示例 `about.md` 结构：
```markdown
# About Me

> Turning complexity into clean order through rigorous logic and craft.

这里是个人总体介绍...

## 个人履历与时间线 (Timeline & Milestones)

### 2024 – 至今 · 架构设计与前沿计算
- 深耕高吞吐分布式共识算法（Raft / Paxos）。
- 探索量子线路变分模拟与自注意力机制同构。

### 2022 – 2024 · 核心系统研发
- 主导云原生后端基础设施重构，优化微服务拓扑。

### 2020 – 2022 · 现代 Web 架构探索
- 深入探索 Virtual DOM 与 Signals 细粒度响应性演进。
```

---

## 四、博文撰写与专栏目录组织 (`posts/`)

本博客直接以本地 `posts/` 目录下的 Markdown 文件作为数据源。

### 1. 单篇文章撰写
直接将 `.md` 文件保存在 `posts/` 目录或任意分类子目录（如 `posts/tech/my-first-post.md`）：

```markdown
---
title: "我的第一篇技术文章"
date: "2026-10-09"
category: "architecture"
tags: ["分布式", "架构设计", "Raft"]
pinned: false
excerpt: "这里是一句话摘要，若不填写将自动提取正文前 140 字符。"
---

# 正文内容
支持 KaTeX 公式：$$E = mc^2$$
支持代码高亮与右上角一键复制。
```

### 2. 专题专栏（Series / Columns）组织
若需要创建章节化系列文章，只需在 `posts/columns/` 下建立文件夹：

```text
posts/columns/distributed-systems/
├── 01-consensus-and-raft.md
├── 02-log-replication.md
└── 03-membership-changes.md
```

文件名前缀的数字序号（如 `01-`、`02-`）会自动识别为章节顺序（Part 01、Part 02），并在专栏页面（Columns）汇聚成体系化连载。

---

## 五、如何增加新栏目与前端路由设置

### 1. 前端路由机制说明
本项目采用 **Hash 路由（Hash History Router）**，路径形如：
- 首页：`http://domain/#/`
- 专栏：`http://domain/#/columns`
- 归档：`http://domain/#/archives`
- 标签：`http://domain/#/categories`
- 关于：`http://domain/#/about`
- 文章：`http://domain/#/post/<post-id>`
- 编辑器：`http://domain/#/editor`

**为什么使用 Hash 路由？**
在 GitHub Pages 等纯静态服务器托管时，传统 Path 路由在用户直接刷新页面或深层链接时会导致 404 错误。而 Hash 路由（`/#/xxx`）只在客户端触发浏览器的 `hashchange` 事件，无需任何后端或重写规则配置，100% 保证在任意静态环境下刷新不丢页。

---

### 2. 增加一个新栏目（以新增「项目展厅 Projects」为例）

只需两步即可完成新栏目的扩充：

#### 第一步：在 `blog.config.js` 中添加导航菜单项
打开 `blog.config.js`，在 `nav` 数组中新增一行：
```javascript
  nav: [
    { id: "home", label: "Home", href: "#/" },
    { id: "columns", label: "Columns", href: "#/columns" },
    { id: "projects", label: "Projects", href: "#/projects" }, // 👈 新增这一行
    { id: "archives", label: "Archive", href: "#/archives" },
    { id: "categories", label: "Tags", href: "#/categories" },
    { id: "about", label: "About", href: "#/about" }
  ],
```

#### 第二步：在 `js/app.js` 中注册路由与渲染函数
打开 `js/app.js`，在 `handleRoute` 路由分发器中追加匹配分支：
```javascript
    } else if (path === '/projects') {
      this.currentRoute = { name: 'projects', params: {} };
      var link = document.querySelector('[data-nav-link="projects"]');
      if (link) link.classList.add('active');
      this.renderProjectsView(); // 👈 调用视图渲染
    }
```

然后在下方的视图区域添加对应的渲染函数 `renderProjectsView`：
```javascript
  renderProjectsView: function() {
    var container = document.getElementById('app-main');
    var html = '<div class="max-w-[720px] mx-auto pt-16 md:pt-20 pb-20">';
    html += '  <header class="mb-10 pb-6 border-b border-white/[0.06]">';
    html += '    <h1 class="text-[32px] font-bold text-[#EDEDED] font-sans">Projects</h1>';
    html += '    <p class="text-[16px] text-[#8B8B8E]">Selected open source and engineering projects.</p>';
    html += '  </header>';
    html += '  <div class="space-y-4">';
    html += '    <div class="linear-card p-5">';
    html += '      <h3 class="text-[18px] font-semibold text-[#EDEDED] mb-2">Aurora Notes</h3>';
    html += '      <p class="text-[14px] text-[#8B8B8E]">Ultra-modern cyber minimalist blog engine.</p>';
    html += '    </div>';
    html += '  </div>';
    html += '</div>';
    container.innerHTML = html;
  },
```

保存后即可通过导航栏直接点击访问 `#/projects`，全站样式与动效自动保持高度统一。

---

## 六、一键同步与自动部署 (GitHub Pages)

本项目部署完全基于单一的 **`main`** 分支，无需 `gh-pages` 分支。

### 自动化一键发布（推荐）
在终端根目录下运行：
```bash
./deploy.sh "更新个人经历与文章"
```

脚本将自动执行：
1. 运行 `python3 sync_posts.py` 编译最新博文与 `about.md` 为 `js/posts-data.js`。
2. 提交当前变更到 Git 本地仓库。
3. 推送到远程 GitHub 仓库的 `main` 分支，自动触发 `.github/workflows/static.yml` 工作流完成在线部署。

---

## 七、本地预览与调试

项目内置轻量 Web 服务器，在本地根目录下运行：

```bash
./run.sh
# 或
python3 server.py 8900
```

在浏览器中打开 `http://127.0.0.1:8900/` 即可实时预览。
