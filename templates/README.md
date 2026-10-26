# 写作模板

先选模板，再复制到 `posts/`。本目录只存写作源文件，不进入文章列表，也不会发布到网站。

## 选哪个模板

| 你要写的内容 | 模板 | 复制后的类型 |
| --- | --- | --- |
| 普通技术文章 | [标准文章](template-standard-post.md) | `normal`（省略即可） |
| 连载专栏的一章 | [专栏章节](template-column-chapter.md) | `normal` + `column` |
| 一本书的一章 | [书籍章节](template-book-chapter.md) | `books` + `column` |
| 按主题整理的阅读目录 | [阅读索引](template-collection.md) | `index` |
| 关于、经历、路线规划 | [结构化独立页](template-independent-page.md) | `post` |
| 论文与研究成果列表 | [论著页](template-publications-page.md) | `post` |
| PDF 课件与演讲稿 | [演示文稿](template-slide-presentation.md) | `normal` |
| 图片、下载、Office、音视频 | [媒体附件](template-media-attachments.md) | `normal` |
| 数学与物理推导 | [公式长文](template-math-physics-paper.md) | `normal` |

`post` 在这里表示**结构化独立页**，不是普通文章；普通文章用 `normal`。新内容统一使用 `type`，不要使用旧 `layout` / `page` 写法；`category` 已停用，会导致构建报错。

## 三步开始写

以普通文章为例：

```bash
cp templates/template-standard-post.md posts/my-first-note.md
./run.sh
```

1. 修改文件开头两行 `---` 之间的 FrontMatter，至少写清 `title`、`tags` 和 `excerpt`。
2. 替换正文，删除不需要的示例。页面已经显示标题，正文从 `##` 开始；`<!-- ... -->` 是不显示的写作提示，可删可留。
3. 在浏览器打开 `http://127.0.0.1:18888/` 检查，发布前执行 `./check.sh`。

模板不固定日期和 slug：首次构建会写入发布日期；slug 默认由文件名生成。复制后改文件名即可创建自己的文章。附件模板中的示例路径默认位于注释或代码块，上传真实文件后再启用。

完整说明：[Markdown YAML 全部字段](../docs/frontmatter.md) · [config 与路由配置](../docs/configuration.md)。下表用于快速起稿。

## FrontMatter 常用字段

只保留需要的字段，布尔值写 `true` / `false`，YAML 缩进使用空格。

| 字段 | 示例 | 作用 |
| --- | --- | --- |
| `title` | `"我的第一篇笔记"` | 页面标题 |
| `tags` | `["物理", "量子计算"]` | 标签，不带 `#` |
| `excerpt` | `"说明文章的问题与结论。"` | 列表摘要 |
| `date` | `"2026-10-25"` | 可省略，首次构建写入并保持不变 |
| `updated` | `"2026-10-26 22:46"` | 北京时间，精确到分钟；首页按更新时间排序，未填用发布日期；归档仍按发布日排序 |
| `slug` | `"my-first-note"` | 可省略；显式填写可固定文章地址，支持中文 |
| `type` | `normal` / `books` / `index` / `post` | 选择内容结构 |
| `pinned` | `true` | 首页置顶 |
| `home` | `false` | 从首页隐藏，仍可在归档、标签、搜索中找到 |
| `tocLevels` | `[2, 3]` 或 `false` | 覆盖全站目录层级或关闭目录 |
| `slide` | `"attachments/slides/talk.pdf"` | 正文上方的 PDF 预览入口 |
| `attachments` | `["attachments/files/data.zip"]` | 文末附件操作区 |


### 专栏与书籍

```yaml
column: "my-series"
columnName: "专栏的显示名称"
columnDesc: "介绍这个专栏。"
order: 1
```

同一组保持 `column`、`columnName`、`columnDesc` 一致，`order` 使用正整数。下一章只修改标题、摘要、顺序和正文。`columnSlug` 可显式固定专栏地址；常规情况让它沿用英文小写连字符的 `column` 即可。

- 普通专栏自动进入 Columns，无需添加路由。
- 书籍章节再加 `type: books`，自动进入 Books；推荐目录 `posts/books/my-book/`。
- 两种章节都自动生成组内的上一篇／下一篇。

### 结构化独立页的入口

复制独立页不等于自动新增导航。把下面条目加入 `src/config/routes.js` 的 `routeTable`，不要改 Navbar 或直接拼接 `config.nav`：

```javascript
{
  name: 'publications',
  path: '/publications',
  view: 'page',
  shell: 'shell',
  kind: 'page',
  page: 'posts/publications.md',
  nav: { label: 'Publications', group: 'about', target: 'file:posts/publications.md' },
  note: '研究成果单页，归入 About 折叠组。'
}
```

文件名与目标必须一致。`view: 'page'` 是路由渲染器名称，Markdown 中仍写 `type: 'post'`。路由表负责生成站内地址和导航；执行 `./check.sh` 校验。若只是修改 About，把模板区块合并到根目录 `about.md` 即可。

## 结构化区块怎么填

| 区块／字段 | 用法 |
| --- | --- |
| `focus` / `bio` / `quote` | 当前方向、简介、引用；不需要时删除 |
| `timeline[]` | `period`、`title`、`desc` 是可见内容 |
| `focusAreas[]` | 用 `title` 和 `desc` 描述关注领域 |
| `detail` / `links` | 时间线与关注领域的折叠内容；两者均空时不显示箭头 |
| `publications[]` | `title`、`authors`、`venue`、`year`；`abstract` 作为展开摘要 |
| `publications[].links` | 可选 `pdf`、`doi`、`arxiv`、`code` 等资源 |
| `timeline[].links.paper` | 对应本页某篇论著的 `slug`，点击定位并展开 |
| `social[]` | `name` 与 `url`，显示在独立页；不进入全局页脚 |

嵌套字段按模板缩进填写：`abstract` 和 `links` 是同级，不能把摘要缩进到 `links.pdf` 下面。作者名匹配站点配置 `author.name` 时自动加粗。

## 容易出错的地方

- **文件位置**：Markdown 放 `posts/`，图片与下载材料放 `attachments/`。`posts/picture.png` 不会发布。
- **资源路径**：相对站点根填写 `attachments/images/picture.png`，不写本机绝对路径；未上传的示例路径不要直接启用。
- **文章链接**：使用 `[[slug]]`、`[[slug|显示文字]]` 或 `[文字](posts/文章.md)`，不要硬编码 Hash 路由。索引模板的示例链接也要换成自己的内容。
- **公式**：行内使用 `(E = mc^2)`，块公式用独占两行的 `$$`；不使用单美元符号。多行对齐使用 `aligned`。
- **Office 预览**：本地构建需安装 LibreOffice；PPT 会转换成静态 PDF，不保留动画与音视频。
- **主题样式**：模板不必写颜色或容器 HTML，日夜主题由全站样式自动适配。

完整开发、配置和发布说明见根目录 [README](../README.md)。
