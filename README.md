# Aurora Notes (极光随笔)

> 冷静、克制、严谨的深色科技风个人博客系统。设计语言参考 Linear、Vercel 与 Raycast，依托留白与极细边框建立秩序。

---

## 目录索引

- [一、核心架构与项目结构](#一核心架构与项目结构)
- [二、全站统一配置 (blog.config.js)](#二全站统一配置-blogconfigjs)
- [三、博文撰写与目录组织 (posts/)](#三博文撰写与目录组织-posts)
- [四、一键同步与自动部署](#四一键同步与自动部署)
- [五、本地预览与开发](#五本地预览与开发)

---

## 一、核心架构与项目结构

本系统采用纯静态现代化架构，无重度构建依赖，开箱即用。核心模块职责清晰：

```text
.
├── blog.config.js          # ⭐️ 全局统一配置文件 (站点名、作者、社交链接、导航)
├── index.html              # 主入口 HTML (SPA 挂载容器与资源引用)
├── css/
│   └── main.css            # 核心样式系统 (Tokens、暗色主题、动效、自适应断点)
├── js/
│   ├── app.js              # 应用控制器与模块化视图 (Home, Post, Series, Tags, Archive, About)
│   ├── store.js            # 数据中心 (连接 BlogConfig 与 BlogPostsData, LocalStorage 交互)
│   ├── posts-data.js       # 自动编译的真实博文索引 (由 sync_posts.py 生成)
│   ├── markdown.js         # Markdown + KaTeX 数学公式 + Prism 代码高亮解析引擎
│   └── icons.js            # 轻量级极简 SVG 图标库
├── posts/                  # ⭐️ 用户博文存放目录 (Markdown)
│   └── hello-world.md      # 初始入门指南
├── sync_posts.py           # 扫描 posts/ 目录并自动编译生成 js/posts-data.js
├── deploy.sh               # 一键编译、提交并推送到 GitHub Pages
├── server.py               # 本地轻量预览开发服务器
└── README.md               # 本项目说明文档
```

---

## 二、全站统一配置 (`blog.config.js`)

所有个人信息与站点属性均收敛在根目录的 `blog.config.js` 中。**修改此处即可全站生效**，无需修改任何 HTML 或 JS 模板代码：

```javascript
window.BlogConfig = {
  // 1. 站点基础信息
  site: {
    title: "Aurora Notes",         // 浏览器标签页标题
    brand: "aurora.notes",         // 顶部 Logo 文字 (如 / aurora.notes)
    tagline: "Curated research essays and computing fundamentals.", // 首页大标副标题
    description: "Personal technical blog.",                        // SEO 描述
    footerText: "© 2026 Alex Chen · All rights reserved."          // 页脚版权
  },

  // 2. 作者个人资料 (展示在关于页与元信息中)
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

  // 4. 页脚与关于页社交链接
  social: [
    { name: "GitHub", url: "https://github.com/flyingpig669" },
    { name: "Twitter", url: "https://twitter.com" },
    { name: "Email", url: "mailto:flyingpig06@outlook.com" },
    { name: "RSS", url: "#/archives" }
  ]
};
```

---

## 三、博文撰写与目录组织 (`posts/`)

本博客直接以本地 `posts/` 目录下的 Markdown 文件作为唯一数据源。

### 1. 单篇文章撰写
直接将 `.md` 文件保存在 `posts/` 目录或任意分类子目录下（如 `posts/tech/my-first-post.md`）。

支持的 YAML Frontmatter 格式：
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

文件名前缀的数字序号（如 `01-`、`02-`）会自动识别为章节顺序（Part 01、Part 02），并在专栏页面（Columns）汇聚成体系化时间线。

---

## 四、一键同步与自动部署

每次新增或修改博文后，可通过以下方式发布：

### 自动化一键发布（推荐）
在终端根目录下运行：
```bash
./deploy.sh "新增文章：Raft 机制详解"
```

脚本将自动执行：
1. 运行 `python3 sync_posts.py` 编译最新文章与专栏索引生成 `js/posts-data.js`。
2. 提交当前变更到 Git 本地仓库。
3. 推送到远程 GitHub 仓库，自动触发 `.github/workflows/deploy.yml` 进行 GitHub Pages 在线部署。

### 手动同步索引
若只需在本地预览更新，直接运行：
```bash
python3 sync_posts.py
```

---

## 五、本地预览与开发

项目内置了即时轻量 Web 服务器：

```bash
./run.sh
# 或
python3 server.py 8900
```

在浏览器中打开：`http://127.0.0.1:8900/` 即可实时预览。

---

## 六、核心特性支持

- **常驻浮动 Outline（目录导航）**：文章详情页在屏幕右侧吸顶浮动展示章节目录，支持平滑偏移跳转与滚动高亮（Scrollspy）。
- **学术级数学公式**：集成 KaTeX，支持行内公式 `$$...$$`、\( ... \) 与独立块级方程式。
- **深色代码高亮**：集成 Prism.js，支持 Python、Bash、TypeScript、JavaScript、JSON 等语法高亮与悬浮一键复制。
- **全文即时检索**：支持 `Cmd+K` / `Ctrl+K` 全文检索标题、标签与正文。
- **在线创作器**：内置 `#/editor` 实时预览 Markdown 编辑器，支持即时本地发布与草稿自动保存。
