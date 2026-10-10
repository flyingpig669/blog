/**
 * ==============================================================================
 * Aurora Blog - 全局统一配置文件 (Global Blog Configuration)
 * ==============================================================================
 * 所有站点名称、作者资料、社交媒体链接、导航菜单与显示选项均在此集中配置。
 * 修改此处即可全站生效，无需翻找繁琐的 HTML 或 JS 模板。
 */

window.BlogRoutes = Object.freeze({
  home: "/",
  posts: "/posts",
  columns: "/columns",
  archive: "/archive",
  tags: "/tags",
  about: "/about"
});

window.BlogConfig = {
  // 统一路由字典：导航与页面链接均从这里读取。
  routes: window.BlogRoutes,

  // 默认路由：访问空 Hash (#) 或根地址时落到哪里
  defaultRoute: window.BlogRoutes.home,

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
    // 部署后的站点根地址（含子路径，末尾不带 /），用于生成 sitemap.xml 与 og:url。
    // 例：https://<用户名>.github.io/<仓库名> ；留空则跳过 sitemap 生成。
    url: "",
    // 文章预估阅读速度 (每分钟字数)：由 sync_posts.py 在编译期读取，用于估算 readTime
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
  // 统一用 target 描述导航目标，新增导航「只需改这一处」即可生效，支持三种写法：
  //   target: "/archive"                  → 绑定一个路由（默认路由）
  //   target: "dir:posts/群论"             → 绑定一个目录，渲染该目录下的文章列表
  //   target: "file:about.md"             → 绑定一个 Markdown 文件（normal 文章 或 post 独立页）
  // 单个对象 = 普通导航项；数组 = 下拉菜单（展示第一项，其余折叠进下拉）。
  // 仍兼容旧的 route / file / dir 字段（未提供 target 时自动回退识别）。
  nav: [
    { id: "home",     label: "Home",     target: window.BlogRoutes.home },
    { id: "columns",  label: "Columns",  target: window.BlogRoutes.columns },
    { id: "archive",  label: "Archive",  target: window.BlogRoutes.archive },
    { id: "tags",     label: "Tags",     target: window.BlogRoutes.tags },
    // 目录绑定示例（取消注释即可新增一个「按目录聚合文章」的导航项，无需改动其它任何代码）：
    // { id: "notes", label: "Notes", target: "dir:posts/群论" },
    // 数组形式 = 下拉菜单：展示第一个 (About)，其余项折叠进下拉菜单，可绑定任意单页文件
    [
      { id: "about",   label: "About",   target: "file:about.md" },
      { id: "roadmap", label: "Roadmap", target: "file:posts/roadmap.md" }
    ]
  ],

  // 4. 社交媒体链接 (Social Links - 预留：关于页社交信息统一在 about.md 的 social 字段维护)
  // social: [
  //   { name: "GitHub", url: "https://github.com/flyingpig669", icon: "github" },
  //   { name: "Twitter", url: "https://twitter.com", icon: "twitter" },
  //   { name: "Email", url: "mailto:flyingpig06@outlook.com", icon: "mail" },
  // ],

  // 说明：专栏 / 系列无需在此登记，完全由文章 FrontMatter 驱动
  // （column / columnSlug / columnName / columnDesc）。

  // 5. 功能开关 (Feature Toggles)
  features: {
    // 启用顶部平滑阅读进度条
    readingProgress: true,
    // 文章详情页常驻右侧悬浮 Outline (目录导航与自动 Scrollspy 高亮)
    outlineSidebar: true,
    // Outline 目录标题追踪层级 (统一单选数组，如 [2, 3] 仅追踪 h2 和 h3，[2, 3, 4] 追踪至 h4)
    tocLevels: [2, 3, 4],
    // 启用 Cmd+K / Ctrl+K 全文即时检索
    searchModal: true,
    // 启用数学公式 KaTeX 解析渲染（false 时公式以纯文本代码形式展示）
    mathKaTeX: true,
    // 启用代码块语法高亮与一键复制代码（false 时仅保留代码容器与复制按钮，不做着色）
    codeHighlight: true
  },

  // 6. 过滤与排除规则 (Exclude & Filter Settings)
  exclude: {
    // 测试文档显示开关：为 false 时过滤隐藏所有带 test 标签或 test: true 的测试文档，为 true 时展示
    showTest: true,

    // 根据文件名排除指定文档 (例如: ["secret.md", "draft-1.md"])
    files: [],

    // 根据目录名排除指定文件夹 (例如: ["templates", "drafts", "temp"])
    dirs: ["templates", "drafts"]
  }
};
