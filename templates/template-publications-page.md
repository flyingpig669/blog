---
title: "论著与学术产出模板"
type: "post"              # 结构化独立页：publications / timeline / focusAreas / social 等区块会被原生渲染
excerpt: "本页面展示论著列表 (Publications) 与可展开时间线 (Timeline) 的完整写法。"
tocLevels: [2, 3]

# ============================================================================
# 论著与学术产出 (Publications)
# ============================================================================
# 渲染规则：
#   1. 按 year 倒序自动分组（年份相同的归入同一组），组内保持书写顺序
#   2. 卡片默认折叠；有 abstract 或 links.pdf 时可点击展开
#   3. authors 数组里与 blog.config.js 的 author.name 同名者自动加粗；
#      也可用 "**姓名**" 显式标注，或用尾随 * 标注通讯作者
#   4. links 的值若是裸标识会自动补全协议前缀：
#        doi: "10.1103/PhysRevA.113.012345"  ->  https://doi.org/10.1103/PhysRevA.113.012345
#        arxiv: "2601.00001"                 ->  https://arxiv.org/abs/2601.00001
#      站内相对路径（attachments/...）与完整 URL 原样使用
#   5. links 可用的 key：pdf / doi / arxiv / code / slides / dataset / video / poster / site / bib
#      未登记的 key 会以大写形式直接生成徽章，可随时自造
publications:
  - title: "论文完整标题"
    slug: "paper-slug"                    # 供 timeline[].links.paper 回指；不填则可用标题回指
    authors: ["Your Name", "Co Author"]   # 数组 / "A, B" 逗号分隔字符串均可
    venue: "Journal or Conference Name"
    year: 2026
    citations: 12                          # 可选，会汇总到区块右上角的 Citations 计数
    links:
      pdf: "attachments/papers/paper.pdf"  # 有 pdf 时展开后可按需加载内嵌预览
      doi: "10.1103/PhysRevA.113.012345"
      arxiv: "2601.00001"
      code: "https://github.com/your/repo"
    abstract: "摘要正文。展开卡片后显示；留空则只保留 PDF 预览入口。"
  - title: "没有 PDF 的条目（只有徽章）"
    slug: "paper-without-pdf"
    authors: "Your Name, Co Author"
    venue: "IEEE IPDPS"
    year: 2025
    links:
      doi: "10.1109/IPDPS49936.2025.00091"

# ============================================================================
# 经历与时间线 (Timeline & Milestones)
# ============================================================================
# 条目可选 detail（展开后的补充说明）与 links（关联资源筹码）。
# 两者皆空时不渲染箭头 —— 条目退化为纯静态展示，不会出现「点了没反应」的空箭头。
timeline:
  - period: "2024 – PRESENT"
    title: "架构设计与前沿计算探索"
    desc: "始终可见的一句话概述。"
    detail: "点击标题后展开的补充说明，可以写更长。"
    links:
      paper: ["paper-slug"]               # 命中 publications 的 slug/标题 -> 点击滚动并展开该论著
      post: "my-first-post"               # 命中博文 slug -> 跳转文章详情
      slides: "attachments/slides/demo.pdf"
      tag: "distributed-systems"          # 跳转标签筛选页
      code: "https://github.com/your/repo"
  - period: "2022 – 2024"
    title: "没有任何附加内容的条目"
    desc: "只有 desc 时不会出现展开箭头。"

# 核心关注领域同样支持 detail 与 links
focusAreas:
  - title: "分布式系统与高可用架构"
    desc: "一句话概述。"
    detail: "展开后的补充说明。"
    links:
      paper: "paper-slug"

social:
  - name: "GitHub"
    url: "https://github.com/your-name"
---

本模板是 `type: post` 结构化独立页的**学术向**排版示例：论著列表按年份分组、卡片可展开摘要与 PDF 预览；经历时间线可点击展开并挂关联论文/项目筹码。

## 使用方式

把上面的 FrontMatter 复制到 `posts/` 下的任意 `.md`，或直接合并进 [`about.md`](../about.md)：

```bash
cp templates/template-publications-page.md posts/publications.md
```

随后在 `blog.config.js` 的 `nav` 里绑定即可：

```js
{ id: "publications", label: "Publications", target: "file:posts/publications.md" }
```

## 区块之间的闭环

`timeline[].links.paper` 写 `publications[].slug`（或完整标题）时，筹码会渲染成「滚动到该论著并自动展开」的页内锚点。这样「某段经历产出了哪篇论文」在页面上是一条可点的路径，而不是两个互不相干的区块。

## 撰写建议

- **摘要**写清方法与量化结果，展开阅读的读者通常是想判断相关性。
- **年份**用四位数字，不要写 `"2026 年"`；解析器只提取前四位。
- **引用数**可省略，省略时不会显示 `0 citations`。
- 论文 PDF 建议放 `attachments/papers/`，与幻灯片（`attachments/slides/`）分开放。
