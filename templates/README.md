# Aurora Notes 文档写作模板库 (Templates)

本目录收录了全站所有标准写作模板。**本目录已在全局配置文件及构建同步脚本中被排除**，放置在此处的任何文件均不会被发布到公开博客文章列表中。

---

## 模板清单

| 模板文件名 | 适用场景 | 核心特性 |
| :--- | :--- | :--- |
| **`template-standard-post.md`** | 常规技术博客 | 完整代码高亮、数学公式、Callout 提示框、标签分类 |
| **`template-column-chapter.md`** | 专栏 / 系列连载章节 | 包含 `column` 与 `order` 标识，专栏内部上下篇定向翻页，系列全景侧边栏 |
| **`template-slide-presentation.md`** | PPT / PDF 演示文稿课件 | 支持 `::: slide` 嵌入本地 PDF 课件，具备 Retina 矢量放映与真全屏演播 |
| **`template-media-attachments.md`** | 图片 / 下载 / 音视频嵌入 | 正文配图与题注、行内下载链接、FrontMatter 附件区、video/audio 标签、路径与白名单全部边界情况 |
| **`template-independent-page.md`** | 结构化独立页 (type: post) | 声明 `type: "post"`，支持时间线/关注领域/社交等区块，可被导航 `target: "file:xxx.md"` 绑定为独立页 |
| **`template-publications-page.md`** | 论著 / 学术产出页 | `publications` 按年份分组、卡片展开摘要与 PDF 预览；`timeline[].links.paper` 与论著形成可点闭环 |
| **`template-math-physics-paper.md`** | 理论数学与物理推导长文 | 严格兼容 Codex 双美元符号 KaTeX，狄拉克符号、矩阵与多行对齐方程推导 |
| **`template-collection.md`** | 文章收录 / 阅读索引页 | 用 `[[slug]]` 双链与相对 `.md` 链接把全站文章整理成可跳转索引 |

---

## 快速使用指南

当需要撰写新文章或专栏时，只需复制对应模板到 `posts/` 目录并修改 FrontMatter 即可：

```bash
# 示例 1：创建一篇新博客
cp templates/template-standard-post.md posts/my-new-article.md

# 示例 2：创建一个新专栏的第 1 章
cp templates/template-column-chapter.md posts/my-column-part-01.md

# 示例 3：创建一篇带演示文稿的文章
cp templates/template-slide-presentation.md posts/my-presentation.md

# 示例 4：创建一个文章收录 / 索引页
cp templates/template-collection.md posts/collection.md

# 示例 5：创建一个论著 / 学术产出页
cp templates/template-publications-page.md posts/publications.md
```

---

## FrontMatter 完整字段速查字典

```yaml
---
# 基础必选字段
title: "文章大标题"                    # 文章主标题 (必填)
date: "2026-10-10"                   # 发布日期 YYYY-MM-DD (选填，默认为当前日期)
slug: "my-article-slug"              # URL 标识 (选填，默认取文件名；文件名含中文时建议显式声明 ASCII slug)
category: "engineering"              # 默认主分类 (选填)
tags: ["tech", "systems"]            # 标签数组，用于 Tags 页面多选组合检索 (选填)
excerpt: "一句话文章摘要简介"           # 呈现在首页与列表中的简要导读 (选填)

# 专栏 / 系列字段 (只要填写 column 即可自动纳入专栏体系)
column: "distributed-systems"        # 专栏唯一标识 (用于把多篇文章聚合成一个专栏)
columnSlug: "distributed-systems"    # 专栏 URL 标识 (选填，默认取 column；含中文时建议显式声明 ASCII slug)
columnName: "分布式系统与高可用架构"  # 专栏对外展示的中文全名 (选填，默认同 column)
order: 1                             # 章节序号，专栏内以此顺序排定上一章/下一章 (整数)

# 页面排版模式
type: "normal"                       # "normal" (默认普通文章，进入博文流) 或 "post" (结构化独立页，类似 about)
pinned: false                        # 是否在首页置顶展示 (true / false)

# 附件与演示文稿
slide: "attachments/slides/xxx.pdf"  # 挂载的演示文稿文件路径
attachments: ["attachments/xxx.zip"] # 下载类附件

# 结构化区块（仅 type: post 生效，详见 template-independent-page.md 与 template-publications-page.md）
publications:                        # 论著列表：按 year 倒序分组、卡片可展开摘要与 PDF 预览
  - title: "..."
    slug: "paper-slug"               # 供 timeline[].links.paper 回指
    authors: ["Your Name", "Co Author"]
    venue: "..."
    year: 2026
    citations: 12
    links: { pdf: "...", doi: "...", arxiv: "...", code: "..." }
    abstract: "..."
timeline:
  - period: "..."
    title: "..."
    desc: "..."                      # 始终可见
    detail: "..."                    # 点击标题后展开
    links: { paper: "paper-slug", post: "post-slug", code: "https://..." }
focusAreas:
  - title: "..."
    desc: "..."
    detail: "..."                    # 与 timeline 同一套展开逻辑
    links: { paper: "paper-slug" }

# 大纲目录配置 (单篇覆盖)
tocLevels: [2, 3]                    # 指定 TOC 追踪的标题层级数组 (如 [2, 3]、[2, 3, 4] 或 false)
---
```
