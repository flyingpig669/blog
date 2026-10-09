/**
 * ==============================================================================
 * Aurora Blog - 全局统一配置文件 (Global Blog Configuration)
 * ==============================================================================
 * 所有站点名称、作者资料、社交媒体链接、导航菜单与显示选项均在此集中配置。
 * 修改此处即可全站生效，无需翻找繁琐的 HTML 或 JS 模板。
 */

window.BlogConfig = {
  // 1. 站点基础信息 (Site Metadata)
  site: {
    // 博客标题 (显示在浏览器标签页与顶部 Logo)
    title: "Aurora Notes",
    // 顶部 Logo 标识 (支持等宽文字与前缀)
    brand: "aurora.notes",
    // 网站一句话介绍 (显示在首页大标题下方)
    tagline: "Curated research essays, system architecture notes, and computing fundamentals.",
    // SEO 与元描述
    description: "Personal technical blog focused on modern computing architecture, elegant systems, and clean code.",
    // 页脚版权说明
    footerText: "© 2026 Alex Chen · All rights reserved.",
    // 默认每页显示文章数
    postsPerPage: 10,
    // 文章预估阅读速度 (每分钟字数)
    wordsPerMinute: 300,
  },

  // 2. 作者个人资料 (Author Profile)
  author: {
    name: "CCC",
    title: "Student",
    bio: "Physics, Math, and Computer Science Enthusiast.",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=CCC&backgroundColor=161618&textColor=EDEDED&fontWeight=600",
    location: "Shandong, China",
    email: "flyingpig06@outlook.com",
    github: "https://github.com/flyingpig669",
    // twitter: "https://twitter.com",
  },

  // 3. 顶部主导航菜单 (Navigation Menu)
  nav: [
    { id: "home", label: "Home", route: "/" },
    { id: "columns", label: "Columns", route: "/columns" },
    { id: "archives", label: "Archive", route: "/archives" },
    { id: "categories", label: "Tags", route: "/categories" },
    { id: "about", label: "About", route: "/about" }
  ],

  // 4. 页脚与关于页社交链接 (Social Links)
  // social: [
  //   { name: "GitHub", url: "https://github.com/flyingpig669", icon: "github" },
  //   { name: "Twitter", url: "https://twitter.com", icon: "twitter" },
  //   { name: "Email", url: "mailto:flyingpig06@outlook.com", icon: "mail" },
  // ],

  // 5. 专栏 / 系列默认元信息 (Series Metadata Fallback)
  // 当 posts/columns/<folder-name> 缺少自定义元数据时，将自动匹配此处的名称与描述
  columns: {
    "system-design": {
      name: "System Design & Distributed Architecture",
      desc: "Deep dives into high-availability systems, consensus algorithms, and cloud infrastructure.",
      icon: "terminal"
    },
    "algorithms": {
      name: "Algorithms & Mathematical Computing",
      desc: "Exploring computational complexity, graphs, dynamic programming, and numeric derivations.",
      icon: "atom"
    },
    "frontend-engineering": {
      name: "Modern Frontend Engineering",
      desc: "Deep insights into reactivity runtimes, compiler pipelines, and user experience design.",
      icon: "code"
    }
  },

  // 6. 功能开关 (Feature Toggles)
  features: {
    // 启用顶部平滑阅读进度条
    readingProgress: true,
    // 文章详情页常驻右侧悬浮 Outline (目录导航与自动 Scrollspy 高亮)
    outlineSidebar: true,
    // 启用 Cmd+K / Ctrl+K 全文即时检索
    searchModal: true,
    // 启用在线 Markdown 创作器 (#/editor)
    editor: true,
    // 启用数学公式 KaTeX 解析渲染
    mathKaTeX: true,
    // 启用代码块语法高亮与一键复制代码
    codeHighlight: true
  },

  // 7. 过滤与排除规则 (Exclude & Filter Settings)
  exclude: {
    // 测试文档显示开关：为 false 时过滤隐藏所有带 test 标签或 test: true 的测试文档，为 true 时展示
    showTest: true,

    // 根据文件名排除指定文档 (例如: ["secret.md", "draft-1.md"])
    files: [],

    // 根据目录名排除指定文件夹 (例如: ["drafts", "temp"])
    dirs: []
  }
};