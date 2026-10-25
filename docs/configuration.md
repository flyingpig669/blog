# config 配置说明

本项目有两个配置入口：

- [`src/config/blog.config.js`](../src/config/blog.config.js)：站点资料、作者、功能开关、排除规则和站外操作链接。
- [`src/config/routes.js`](../src/config/routes.js)：路由与主导航声明，自动生成 `routes` 和 `nav`。

它们是 JavaScript 模块，不是 YAML。字符串加引号、对象键值用冒号、条目之间用逗号。修改后运行 `./run.sh` 预览，发布前执行 `./check.sh`。单篇文章的字段见 [Markdown YAML 说明](frontmatter.md)。

## 1. 顶层配置

| 字段 | 值／当前设置 | 用途与修改方式 |
| --- | --- | --- |
| `routes` | 导入的 `routes` 对象 | 路由表自动生成的 `name → path` 字典；禁止另写一份，改地址去 `routes.js` |
| `defaultRoute` | `routes.home` | 保留的默认入口配置；当前 Vue Router 没有读取该字段，单改它不会改变首页。根路径由路由表中的 Home 决定 |
| `site` | 对象 | 站点信息，逐项见下表 |
| `author` | 对象 | About 默认资料和论著本人姓名匹配 |
| `nav` | `registry.buildNav().concat([...])` | 主体从路由表派生；`concat` 只用于额外站外链接，站内入口登记路由表 |
| `actions` | 数组，当前 `[]` | 导航右侧的可选站外链接；搜索和主题按钮由独立组件负责，不在此数组中定义 |
| `features` | 对象 | 功能开关和首页／目录参数 |
| `exclude` | 对象 | 从构建内容中排除测试、草稿或指定文件 |

不存在全局 `theme` 开关：日夜模式由读者选择，初次跟随系统；调色板在 `src/styles/main.css`，不是本配置文件。RSS 已删除，不再配置 `feedPath`、`features.rss` 或 `rssIncludeHidden`。

## 2. `site`：站点信息

| 字段 | 值／当前设置 | 作用、默认与注意事项 |
| --- | --- | --- |
| `title` | 文本，当前 `"CCC de Notes"` | 首页大标题、浏览器标题的站点名、分享元信息；建议始终填写 |
| `brand` | 文本，当前 `"CCC de Notes"` | 左上角 Logo 文本；与首页标题可不同，保持简短以适配手机 |
| `tagline` | 文本 | 首页标题下的一句话介绍 |
| `description` | 文本 | SEO 描述；同步 `index.html` 中 description、og:description、twitter:description 三处，构建会互查 |
| `footerText` | 文本，当前 `"© 2026 CCC · All rights reserved."` | 全站页脚版权；同时同步 `index.html` 的 `noscript` 兜底 |
| `footerEmail` | 邮箱文本，当前 `"ccc0000006@gmail.com"`；`""` 关闭 | 页脚的 EMAIL 超链接；与 `author.email` 是不同字段，同步无 JS 兜底 |
| `url` | 部署根 URL，当前 `"https://notes.theccyy.com"`；可写 `""` | 生成 sitemap、校验静态 canonical 和分享 URL；含项目子路径，末尾不加 `/`。留空时不生成新 sitemap。更改域名要同步 `index.html`、`CNAME` 及托管设置 |
| `wordsPerMinute` | 正整数，当前 `300` | 构建期估算阅读用时：英文按单词、中文按字符，最少 1 分钟；修改后重新构建 |

示例：

```javascript
site: {
  title: '我的笔记',
  brand: 'my.notes',
  tagline: '记录数学、物理与工程。',
  description: '我的技术学习与研究笔记。',
  footerText: '© 2026 Your Name · All rights reserved.',
  footerEmail: 'you@example.com',
  url: 'https://example.com/notes',
  wordsPerMinute: 300,
},
```

静态 HTML 不会自动从所有配置字段回填。改标题、介绍、域名或页脚时按 `./check.sh` 提示保持静态内容一致；更新分享图后运行 `npm run build:og`。

## 3. `author`：作者资料

| 字段 | 值／当前设置 | 实际用途 |
| --- | --- | --- |
| `name` | 文本，当前 `"CCC"` | About 姓名兜底；匹配论著作者时自动加粗本人 |
| `aliases` | 可选文本或文本数组，如 `["C. Chen", "中文姓名"]` | 额外本人署名，用于论著作者匹配；当前配置未填，可按需新增 |
| `title` | 文本，当前 `"Student"` | About 头像旁的职务／身份 |
| `location` | 文本，当前 `"Shandong, China"` | About 头像旁的位置，与 `title` 一起显示 |
| `avatar` | 图片 URL 或资源路径 | About 头像兜底；`about.md` 的 `avatar` 可覆盖 |
| `bio` | 文本 | 当前保留资料字段，组件不会自动取它作为简介；实际简介写 `about.md` 的 `bio` 或 `excerpt` |
| `email` | 邮箱文本 | 当前保留资料字段，不会自动生成社交链接；页面邮箱写 `about.md.social`，页脚邮箱写 `site.footerEmail` |
| `github` | GitHub URL | 当前保留资料字段，不会自动生成页面链接；实际入口写 `about.md.social` |
| `twitter` 等自定义属性 | 可选资料 | 没有组件消费时不会显示；不要仅新增字段就期待出现入口 |

`about.md` 的 `name`／`author`、`avatar` 优先于对应默认资料。社交信息使用页面的 `social` 对象列表。旧的注释示例 `config.social` 当前没有消费者，不能代替它。

## 4. `features`：开关与参数

| 字段 | 可选值／当前设置 | 用途与关闭后的行为 |
| --- | --- | --- |
| `homePageSize` | 整数 1～100，当前 `10` | 首页每页入口数量；一本书算一个入口。省略时分页服务使用 10 |
| `readingProgress` | `true` / `false`，当前 `true` | 文章顶部阅读进度线；`false` 隐藏进度线，不删除阅读历史 |
| `outlineSidebar` | `true` / `false`，当前 `true` | 文章目录／章节侧栏及手机目录入口；`false` 关闭目录入口，相邻章节链接仍保留 |
| `tocLevels` | 1～6 的层级数组，当前 `[2,3,4,5,6]` | 全站默认追踪哪些标题；单篇 `tocLevels` 可覆盖，单篇 `false` 关闭标题目录。建议至少保留二级标题 |
| `searchModal` | `true` / `false`，当前 `true` | 搜索按钮与 Cmd+K / Ctrl+K 弹窗；`false` 同时停用入口和快捷键 |
| `mathKaTeX` | `true` / `false`，当前 `true` | 数学解析与 KaTeX 按需加载；`false` 不调用公式渲染器，保留文本形式 |
| `codeHighlight` | `true` / `false`，当前 `true` | Prism 语法着色；`false` 仍保留代码容器与复制功能，只关闭高亮 |

开关建议显式写布尔值；多数开关只有严格等于 `false` 才关闭。调整字号、行距与阅读位置属于读者的浏览器偏好，不在这里写全站默认配置。

## 5. `exclude`：排除内容

| 字段 | 值／当前设置 | 用途与边界 |
| --- | --- | --- |
| `showTest` | `true` / `false`，当前 `false` | `false` 不构建 `test: true` 或包含 `test` 标签的文章，索引和正文产物也会排除；`true` 用于本地检查测试内容 |
| `files` | 文件名或相对 `posts/` 的文件路径数组，当前 `[]` | 如 `["draft.md", "notes/private.md"]`，从源扫描阶段排除；前端另兼容 slug 过滤，但为避免生成正文，推荐文件路径 |
| `dirs` | 目录名数组，当前 `["templates", "drafts"]` | 扫描到同名目录即跳过，不是完整路径 glob；例如 `"drafts"` 会匹配各层级同名目录 |

编译器还会跳过内置资源、依赖和草稿目录，例如 `.git`、`node_modules`、`attachments`、`images`、`templates`、`drafts`，不是删掉 `exclude.dirs` 就能把它们当文章扫描。

`home: false` 是首页展示控制，不负责排除正文；真正不发布的内容应移出扫描目录或使用构建排除规则。

## 6. `nav` 与 `actions`：两种入口

### 主导航 `nav`

站内入口只在 `routeTable[].nav` 声明，`registry.buildNav()` 自动生成 `id`、`label`、`target` 和分组。多个同组项按路由表顺序放进同一下拉菜单，当前模块可被提升为桌面显示项。

额外站外链接可追加在 `concat` 内，使用：

```javascript
{ id: 'github', label: 'GitHub', href: 'https://github.com/your-name' }
```

| 站外导航字段 | 值 | 用途 |
| --- | --- | --- |
| `id` | 唯一的小写标识 | Vue 标识；不要与已有模块重复 |
| `label` | 短文本 | 导航显示文字 |
| `href` | 安全完整 URL | 站外目标；不要用 `target` 冒充站外地址 |

不要通过外部链接追加机制绕过站内路由登记。旧导航还兼容数组分组、`items`／`children`、`route`／`file`／`dir`，新站内入口统一使用路由表。

### 右侧链接 `actions`

当前为空，可为需要的站外工具增加入口：

```javascript
actions: [
  { id: 'github', label: 'GitHub', description: '打开项目源码', href: 'https://github.com/your-name/project' },
],
```

| 字段 | 值／默认 | 用途 |
| --- | --- | --- |
| `id` | 唯一文本标识 | 列表渲染键，建议小写 |
| `label` | 短文本 | 可见文字，手机端也会保留，避免太长 |
| `href` | 安全 URL | 链接目标，危险协议会过滤 |
| `description` | 文本，可省略 | 无障碍标签，省略时使用 `label` |
| `feature` | `features` 中的字段名，可省略 | 填写时仅在对应值为真时显示；引用不存在字段会隐藏入口 |
| `requiresSiteUrl` | `true` / `false`，省略相当于 `false` | `true` 时只有填写 `site.url` 才显示 |

搜索与主题不是普通链接，不能通过 `actions` 中伪造同名 id 控制。加入口后检查 320px、768px 和桌面导航是否仍能放下。

## 7. `routes.js` 的全部声明字段

`routeTable` 每一项定义一个模块。模块地址小写、词间连字符；所有站内 URL 统一从此派生。

| 字段 | 可选值／省略行为 | 用途与限制 |
| --- | --- | --- |
| `name` | 必填；小写字母开头，只含小写字母数字 | 模块唯一标识，同时成为 `routes` 字典键和导航 id |
| `path` | 必填；`/` 或小写连字符路径 | 模块规范地址，无末尾斜杠；禁止动作路径和重复地址 |
| `view` | 必填；`home`、`columns`、`archive`、`tags`、`post`、`page`、`dynamic` | 指定渲染器，见下表 |
| `shell` | 必填；`shell` 或 `shell-detail` | 所有标准页用 720px 的 `shell`，仅 `view: post` 允许 1000px 的 `shell-detail` |
| `kind` | 必填；`page`、`collection`、`prefix` | 单页、带详情的集合、仅前缀；见下表 |
| `nav` | 必填；对象或 `null` | 导航元信息；无入口明确写 `null`。当前校验要求无入口非前缀项还需 `alias` |
| `nav.label` | 非空文本 | 主导航可见名称 |
| `nav.group` | 可选分组标识，如 `about`、`collections` | 同组进入同一下拉菜单；不填则独立导航项 |
| `nav.target` | 默认使用本项 `path` | `file:posts/page.md` 渲染单篇 Markdown，`dir:posts/notes` 展示目录文章，或模块规范路由。请写在 `nav` 内，顶层同名字段当前不参与导航派生 |
| `title` | 可选文本 | 模块名称、集合页面标题的来源 |
| `headerTitle` | 可选文本，回退到 `title` | 使用标题助手的页面可显示更具体的大标题，例如 Tags |
| `description` | 可选文本 | Archive、Tags、集合列表等页面的说明 |
| `detail` | 集合必填；以本模块路径加 `/:参数名` 开头 | 声明资源层级，例如 `/books/:slug`；当前运行时集合详情由已有集合渲染逻辑处理，不是自动注册任意新业务视图的开关 |
| `alias` | 已存在模块的 `name` | 前缀命中裸地址时收敛到对应模块，例如 `posts → archive`；不可指向自身 |
| `page` | 可选 Markdown 路径 | 文档渲染的回退目标，建议与 `nav.target` 一致 |
| `contentType` | 可选文档类型，如 `books` | `columns` 渲染器按组内所有文章的类型选择所属集合模块；Books 使用 `books`，未匹配的组回到 Columns |
| `collectionLabel` | 可选元信息文本，如 `BOOK` | 集合列表的类型徽标；未填时回退为 `SERIES` |
| `note` | 可选文本 | 给维护者看的原因说明，不显示为正文 |

### `view` 与 `kind` 不要混淆

| `view` | 渲染内容 |
| --- | --- |
| `home` | 首页文章／书籍入口与分页 |
| `columns` | 专栏或书籍集合及详情 |
| `archive` | 按年份排列的归档 |
| `tags` | 标签与组合筛选 |
| `post` | 普通文章／书籍章节的正文阅读视图 |
| `page` | 结构化独立页，目标 Markdown 写 `type: post` |
| `dynamic` | 通用文章列表；`nav.target` 为目录时读取该目录，为文件时路由会选择文档视图 |

| `kind` | 必要搭配 |
| --- | --- |
| `page` | 单页；不声明 `detail` |
| `collection` | 集合；路径用复数名词，必须声明 `detail`，并复用或实现对应集合渲染 |
| `prefix` | 不渲染独立列表；必须声明 `alias`，例如 `/posts` 的兼容入口 |

### 新增独立页的完整例子

先从模板创建 `posts/publications.md`，填写 `type: post`，再将以下行加入路由表：

```javascript
{
  name: 'publications',
  path: '/publications',
  view: 'page',
  shell: 'shell',
  kind: 'page',
  title: 'Publications',
  page: 'posts/publications.md',
  nav: { label: 'Publications', group: 'about', target: 'file:posts/publications.md' },
  note: '研究成果单页，归入 About 折叠组。',
}
```

单纯新增文章、专栏或书籍章节无需加路由；它们由 Markdown 元数据自动聚合。路由改名保留兼容重定向，检查通过后再发布。

## 8. 改完如何生效

| 修改内容 | 后续操作 |
| --- | --- |
| Markdown 字段或正文 | 保存后由 `./run.sh` 自动编译；正式发布前 `./check.sh` |
| JS 配置、路由、功能开关 | 保存后重新编译应用和数据；推荐运行 `./check.sh` |
| 站点名／描述／域名／页脚 | 同步静态 `index.html`、必要时 `CNAME`；按校验提示处理 |
| 分享图文案 | `npm run build:og`，检查生成图片 |
| 主题色 | 改 `main.css` 的语义令牌，检查日夜两种模式 |

不要修改 `.cache/` 或 `_site/` 里的生成文件来配置网站：下一次构建会覆盖它们。
