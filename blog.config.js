/**
 * ==============================================================================
 * Aurora Blog - 全局统一配置文件 (Global Blog Configuration)
 * ==============================================================================
 * 所有站点名称、作者资料、社交媒体链接、导航菜单与显示选项均在此集中配置。
 * 修改此处即可全站生效，无需翻找繁琐的 HTML 或 JS 模板。
 *
 * 注意：`routes` 与 `nav` 不再手写 —— 它们由 js/lib/routes.js 的声明式路由表派生。
 * 新增页面或改路由请改那张表（一个模块一行）；本文件只保留「不对应站内路由」的
 * 即席导航项（见下方 nav 的 concat 部分）。
 */

window.BlogConfig = {
  // 统一路由字典：由 js/lib/routes.js 的声明表派生（name -> path）。
  // 这里不再手写字面量 —— 新增/改名请改那张表，路由、导航、校验会一起跟上。
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
    // 页脚版权说明。此前这里沿用了模板自带的 "Alex Chen"，与下面 author.name 不是同一个人，
    // 属于上线前必须清掉的模板残留；署名统一以 author.name 为准。
    footerText: "© 2026 CCC · All rights reserved.",
    // 部署后的站点根地址（含子路径，末尾不带 /），用于生成 sitemap.xml 与 og:url。
    // 填好后 sync_posts.py 会产出 sitemap.xml，app.js#absoluteSiteUrl 也会用它作 canonical。
    url: "https://flyingpig669.github.io/blog",
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
  // 主体由路由声明表派生：每个模块的 label / 分组 / 目标都写在 js/lib/routes.js 里，
  // 这里只补「有导航项但不对应任何站内路由」的即席入口，例如外部链接。
  // 单个对象 = 普通导航项；数组 = 下拉菜单（展示第一项，其余折叠进下拉）。
  // 站内新模块请改路由表，不要写在这里；写法参考 js/lib/routes.js 顶部的「怎么加一个新模块」。
  // 外部链接项用 href 而不是 target（target 会被当作站内路由解析）。
  nav: window.BlogRouteRegistry.buildNav().concat([
    // { id: "rss", label: "RSS", href: "https://example.com/feed.xml" },
  ]),

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
    // 测试文档显示开关：为 false 时过滤隐藏所有带 test 标签或 test: true 的测试文档，为 true 时展示。
    // 生产环境必须是 false —— 被隐藏的文档不会进入 js/posts-data.js，也不会生成 data/documents/*.json。
    showTest: false,

    // 根据文件名排除指定文档 (例如: ["secret.md", "draft-1.md"])
    files: [],

    // 根据目录名排除指定文件夹 (例如: ["templates", "drafts", "temp"])
    dirs: ["templates", "drafts"]
  }
};
