# Markdown YAML 字段说明

Markdown 文件顶部两行 `---` 之间是 YAML FrontMatter：它控制文章资料、分类、页面结构和附件，不是正文。普通文章放在 `posts/`，About 放在根目录 `about.md`。

```markdown
---
title: "量子计算入门"
type: "normal"
tags: ["物理", "量子计算"]
excerpt: "从量子态到最简单的量子线路。"
---

这里开始写正文。
```

本说明对应 `scripts/python/lib/frontmatter.py`、`scripts/python/sync_posts.py` 和实际 Vue 渲染逻辑。模板选择见 [模板指南](../templates/README.md)，全站设置见 [config 配置说明](configuration.md)。

## 1. YAML 写法

- 文本建议加双引号；`date` 写成 `"YYYY-MM-DD"`，`updated` 推荐 `"YYYY-MM-DD HH:mm"`，时间按北京时间（UTC+08:00）填写，也接受日期与时间之间使用 `T`。
- 布尔值使用 `true` / `false`，不要用「是／否」。序号使用正整数。
- 数组写 `["A", "B"]`，或换行后用 `-`；对象列表也用 `-` 开始。
- 缩进使用空格，建议每层 2 个，不用 Tab。冒号后保留空格，同层字段左对齐。
- 字段不要重复，包括仅大小写不同的同名键。新文档使用下表的标准拼写；结构化组件按这些字段名读取。
- `#` 开头是 YAML 注释；不需要的可选字段可以整行删除，不要写成空的对象列表。
- `bio`、`quote`、条目描述等可写多行文本或文本数组；文本数组按换行显示。结构化文本支持双链，不能当作任意 HTML／完整 Markdown 正文使用。

## 2. 普通文章的全部标准字段

除 `type: post` 的结构化扩展外，普通文章、书籍和索引共用这些字段。

| 字段 | 可选值／类型 | 省略时 | 用途与限制 |
| --- | --- | --- | --- |
| `title` | 文本，如 `"量子计算入门"` | 通常从文件名推导；无 FrontMatter 时可从首个 H1 提取 | 标题和链接文字。建议每篇显式填写；有 FrontMatter 时正文 H1 不会自动移除，避免重复大标题 |
| `type` | `normal`、`books`、`index`、`post` | `normal` | 内容结构，详见下一节 |
| `slug` | 中文、英文或数字组成的标识，使用连字符 | 从文件名生成 | 文章地址和双链标识。英文转小写，空格与符号归一为连字符；构建拒绝空或重复地址。发布后建议固定 |
| `date` | 有效日期文本 `"2026-10-25"` | 首次构建自动写入源文件 | 有 Git 历史时取首次提交日期，否则取文件创建日期（不可用时取修改日期），按上海时区计算；后续保持不变 |
| `updated` | `"2026-10-26 22:46"`，兼容纯日期 | 不显示更新日期 | 手动记录最近更新，精确到分钟，按北京时间（UTC+08:00）解释；列表、归档和详情均显示。首页置顶优先，再按更新时间倒序；没有时回退发布日期。书籍按可见章节中最近发布或更新时间排序；归档仍按发布日期。旧的纯日期按当日零点参与排序，显示保留日期；保存文件不会自动改写此字段 |
| `tags` | 文本数组，推荐 `["数学", "算法"]`；也接受单个文本 | 空数组 | 标签云、多标签交集、相关文章与搜索；不要写 `#` 前缀。支持中文与英文大写显示名，地址自动转小写；大小写不同的同名标签合并统计与筛选。`C++` / `C#` 的地址分别为 `c-plus-plus` / `c-sharp`，与 `C` 区分。`test` 标签还会标记测试文档 |
| `excerpt` | 文本 | 从正文清理部分 Markdown 标记后截取约 140 字符 | 首页与列表摘要；建议手写，避免截到公式或代码 |
| `pinned` | `true` / `false` | `false` | 首页置顶；归档仍按日期排列，不受置顶影响 |
| `home` | `true` / `false` | 显示在首页 | `false` 只隐藏首页，仍可在归档、标签、搜索和集合中找到；不等于私密或草稿 |
| `test` | `true` / `false` | `false`；标签中有 `test` 也视为测试 | 与全站 `exclude.showTest` 配合；为 `false` 的全站设置会从构建索引和正文产物排除测试文档 |
| `tocLevels` | 1～6 的标题层级数组，如 `[2, 3]`；或 `false` | 沿用 `features.tocLevels`，当前 `[2,3,4,5,6]` | 单篇目录层级；`false` / `[]` 关闭标题目录，不等于关闭系列章节导航。重复层级会去重 |
| `column` | 英文小写连字符标识，如 `"quantum-notes"` | 不属于专栏 | 把文章聚合到同一专栏／书籍；使用中文标识时必须提供英文 `columnSlug` |
| `columnSlug` | 英文小写连字符标识 | 使用 `column` | 覆盖并固定专栏 URL 标识，同时用于聚合；同组文章填写一致 |
| `columnName` | 文本，如 `"量子计算笔记"` | 从专栏标识生成显示名 | 读者看到的专栏名，可使用中文；同组保持一致 |
| `columnDesc` | 文本 | 空 | 集合页介绍；同组保持一致 |
| `order` | 正整数，如 `1`、`2` | 文件名形如 `01-intro.md` 时取数字前缀，否则 `999` | 同组章节排序、章节编号、上一章／下一章顺序；建议显式填写，避免并列 |
| `slide` | PDF 地址，如 `"attachments/slides/talk.pdf"` | 不额外挂载文首入口；正文有 `::: slide` 时也可发现 | FrontMatter 显式声明会把 PDF 入口放在正文上方；与正文同文件嵌入去重。点击才下载并初始化播放器 |
| `attachments` | 资源地址数组，如 `["attachments/files/data.zip"]`；也接受单个地址文本 | 不显示文末附件列表 | 集中展示原文件下载、类型、大小及支持的预览；本地资源必须真实存在并在 `attachments/` 中 |

**不要手写构建字段**：`id`、`relPath`、`sourcePath`、`readTime`、`words`、`isTest`、`slideExplicit`、`bodyUrl`、`attachmentInfo`、`attachmentPreviews` 由构建生成；它们不是可配置开关。

## 3. `type` 的四种值

| 值 | 页面行为 | 进入首页／归档／搜索 | 还要填什么 |
| --- | --- | --- | --- |
| `normal` | 普通文章阅读视图 | 是；首页可用 `home: false` 单独隐藏 | 标题、摘要和标签；专栏文章再填 `column` / `order` |
| `books` | 书籍章节；Books 聚合目录，正文仍走文章视图 | 是；首页每本书聚合为一个入口 | 同书一致的 `column`、`columnName`、`columnDesc`，每章独立的 `order` |
| `index` | 分组跳转、分组和链接计数、编号阅读入口 | 是 | 正文用二级标题分组，列表中写双链或相对 `.md` 链接 |
| `post` | About 式结构化独立页，单栏、不显示普通博文的相邻文章导航 | 否 | 按需填下述区块；新增独立导航要登记路由表 |

`type: post` 不表示普通博文。不要用 `category` 分类：该字段与误拼 `categroy` 都会报错，主题写进 `tags`。

## 4. 结构化独立页和 About

以下字段用于 `type: post` 和 `about.md`。无内容的区块省略或写 `[]`，不会显示空模块。

| 字段 | 值／默认 | 用途 |
| --- | --- | --- |
| `title` | 文本，默认文件名 | 普通独立页大标题；About 头像旁优先显示作者名 |
| `name` | 文本，可省略 | 作者显示名的第一优先级，同时用于匹配论著中本人的署名 |
| `author` | 推荐文本，可省略 | 作者显示名的第二优先级；再回退到 `config.author.name`。也用于本人署名匹配 |
| `authors` | 文本或文本数组，可省略 | 额外的本人署名匹配名称；不直接生成作者资料列表 |
| `avatar` | 图片地址，可省略 | About 头像覆盖，省略时使用 `config.author.avatar`；其他独立页不显示 About 头像块 |
| `focus` | 文本，可省略 | 当前关注方向／状态标签 |
| `bio` | 文本或文本数组，可省略 | 页面简介；没有时回退到 `excerpt`，不会自动取 `config.author.bio` |
| `excerpt` | 文本，可省略 | `bio` 的简介回退 |
| `quote` | 文本或文本数组，可省略 | 引用／座右铭区块 |
| `timeline` | 对象列表，默认 `[]` | 经历时间线，按书写顺序显示，最新经历建议放第一项 |
| `focusAreas` | 对象列表，默认 `[]` | 关注领域列表，按书写顺序显示 |
| `publications` | 对象列表，默认 `[]` | 论著列表，按年份倒序分组，同年保留书写顺序 |
| `social` | 对象列表，默认 `[]` | 页面内的社交链接；优先于 `contacts` 和 `links`，三者不合并 |
| `contacts` | 对象列表，默认 `[]` | `social` 为空时的联系方式回退 |
| `links` | 对象列表，默认 `[]` | `social` 和 `contacts` 均空时的回退。注意：此处是列表，条目里的 `links` 才是映射 |

About 头像下的职务与位置来自 `config.author.title`、`config.author.location`。YAML 中没有对应的页面覆盖开关。正文放在结尾 `---` 后，渲染于结构化区块之后。

### 时间线 `timeline[]` 与关注领域 `focusAreas[]`

| 条目字段 | 值／默认 | 用途 |
| --- | --- | --- |
| `period` | 文本，可省略 | 仅时间线使用，如 `"2024 – PRESENT"`；不自动解析为日期或排序 |
| `title` | 文本或文本数组 | 条目标题，建议填写 |
| `desc` | 文本或文本数组，可省略 | 默认可见的概述 |
| `detail` | 文本或文本数组，可省略 | 展开后显示的补充说明 |
| `links` | `资源类型: 目标` 映射，可省略 | 展开后的资源按钮；每种目标可以是文本或文本数组 |

`detail` 或 `links` 有内容才显示展开箭头。`detail` 的旧别名 `details`、`more` 仍可读取，新内容统一写 `detail`。

```yaml
timeline:
  - period: "2026 – PRESENT"
    title: "量子线路研究"
    desc: "默认可见的介绍。"
    detail: ["展开后的第一行。", "展开后的第二行。"]
    links:
      paper: ["my-paper"]
      post: "quantum-simulator"
      tag: "quantum"
      code: "https://github.com/your-name/project"
focusAreas:
  - title: "量子信息"
    desc: "研究兴趣与方向。"
```

这些 `links` 键的含义：

| 键 | 目标写什么 | 点击结果 |
| --- | --- | --- |
| `paper` | 本页 `publications[].slug` 或完整标题 | 滚动并展开对应论著，不能当作外部 PDF URL |
| `post` | 已存在的文章 slug、标题或文件路径 | 解析为站内文章；兼容键 `article`、`blog`、`note`、`doc` |
| `tag` | 已存在的标签名 | 跳转标签筛选 |
| `doi` / `arxiv` | 裸标识或完整 URL | 自动补全 DOI／arXiv 地址 |
| `pdf`、`slides`、`code`、`dataset`、`video`、`poster`、`site`、`bib` | 真实资源路径或 URL | 打开相应资源链接 |
| 自定义键，如 `link` | 安全 URL 或资源路径 | 键名转为大写作为按钮文字，不会自动理解自定义标识 |

### 论著 `publications[]`

| 条目字段 | 可选值／默认 | 用途 |
| --- | --- | --- |
| `title` | 非空文本，必填 | 论文名称；缺失会构建报错 |
| `slug` | 文本，可省略 | 本页论著定位标识，不是独立路由；时间线可用它回指，省略时可用标题 |
| `authors` | 文本数组，或英文逗号分隔文本；省略则不显示署名 | 按顺序列作者；匹配本人名称时加粗，也支持 `"**姓名**"` 或姓名尾随 `*` 标记 |
| `venue` | 文本，可省略 | 期刊／会议名称 |
| `year` | 四位年份，如 `2026`，可省略 | 年份分组；未提供可从旧 `date` 字段提取四位年份，否则进入 `UNYEARED`。不能写 `"2026 年"` |
| `citations` | 非负整数，如 `12`，可省略 | 显示引用数并参与汇总；省略不会显示零引用 |
| `abstract` | 文本或文本数组，可省略 | 展开后的摘要 |
| `links` | 类型与链接的映射，可省略 | 资源徽章；这里每个值必须是文本，不能像时间线一样用数组 |

`links` 支持 `pdf`、`doi`、`arxiv`、`code`、`slides`、`dataset`、`poster`、`video`、`site`、`bib` 与自定义资源键。`pdf` 提供点击加载的内嵌预览；展开摘要本身不会下载 PDF。`doi`、`arxiv` 可填裸标识，其余填写路径或完整 URL。

```yaml
publications:
  - title: "论文标题"
    slug: "my-paper"
    authors: ["CCC", "Co Author"]
    venue: "期刊名称"
    year: 2026
    citations: 12
    links:
      doi: "10.1234/请替换为真实标识"
      # pdf: "attachments/papers/my-paper.pdf"
    abstract: "这里写摘要。"
```

示例 DOI 和文件路径需替换再启用。`links` 与 `abstract` 同级。兼容旧字段 `date`（年份）、`cited`（引用数）和条目顶层的 `pdf` / `doi` 等资源键，新内容统一用 `year`、`citations` 与 `links`。

### 社交链接 `social[]` / `contacts[]` / 顶层 `links[]`

| 条目字段 | 值／默认 | 用途 |
| --- | --- | --- |
| `name` | 文本，建议填写 | 显示名称；兼容 `title`、`label` 作为回退 |
| `url` | `https://...`、`mailto:...`、`tel:...` 或安全站内地址 | 跳转目标；兼容 `href` 作为回退 |
| `icon` | 当前不读取 | 不会生成社交图标，页面使用文字链接 |

```yaml
social:
  - name: "GitHub"
    url: "https://github.com/your-name"
  - name: "Email"
    url: "mailto:you@example.com"
```

这些链接只出现在页面内，不会自动加入导航或页脚。

## 5. 旧字段与兼容值

为旧内容保留以下兼容读取，新内容只用左侧标准字段：

| 标准写法 | 兼容旧写法 |
| --- | --- |
| `type` | `layout`；同时填写且含义冲突会报错 |
| `type: post` | `page`、`page-mode`、`standalone`、`single`、`page_mode` 都归一为 `post` |
| `column` | `series` |
| `columnName` | `column_name`、`columnTitle`、`column_title` |
| `columnSlug` | `column_slug`、`serieslug`、`series_slug`（注意代码中是单个 s 的 `serieslug`） |
| `columnDesc` | `column_desc`、`columnDescription`、`column_description` |
| `order` | `chapter` |
| `slide` | `slides`、`pdf`、`deck` |
| `attachments` | `attachment` |
| `tocLevels` | `toc_levels`、`toc`；关闭值兼容 `off`、`none`、`0` |

旧别名不建议与标准字段同时填写，避免后读字段覆盖前者。未知 YAML 字段不保证报错，也不保证生效；不要把「构建通过」理解为字段已被使用。RSS 已移除，`rss` 不再是受支持的配置项。

## 6. 一次完整的写作流程

1. 从 [模板](../templates/README.md) 复制对应文件到 `posts/`，修改标题、标签与摘要。
2. 需要专栏时填写 `column` 和 `order`；需要书籍时加 `type: books`。
3. 上传附件后再启用资源路径；所有本地材料统一放 `attachments/`。
4. 新独立页在 `src/config/routes.js` 登记入口；普通文章、专栏章节不需要新增导航。
5. 用 `./run.sh` 预览两种主题，发布前运行 `./check.sh`。
