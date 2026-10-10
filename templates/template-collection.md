---
title: "文章收录 · 阅读索引"
date: "2026-10-10"
category: "index"
tags: ["index", "collection"]
excerpt: "本站全部文章的整理索引，按主题分组，支持站内双链跳转。"
---

# 文章收录

本页用于把散落在各处的文章整理成一份可跳转的索引。

> 复制本模板到 `posts/` 目录（如 `posts/collection.md`）即可使用。
> 链接写法见文末「写作说明」。

---

## 一、入门与基础

- [[hello-world]] —— 博客的基本用法与目录结构
- [[group-theory-intro]] —— 抽象代数与群论导引 第 01 章
- [[group-theory-basics]] —— 抽象代数与群论导引 第 02 章

## 二、项目与实践

- [[quantum-simulator]] —— 量子态矢量模拟引擎设计（附幻灯片）
- [相对链接写法示例](posts/quantum-simulator.md) —— 直接写文件路径也会被自动解析

## 三、按专栏 / 标签聚合

- 专栏：[[group-theory]] —— 抽象代数与群论导引（全部章节）
- 标签：[[algebra]] —— 所有标记 `algebra` 的文章

## 四、其他页面

- [[about.md]] —— 关于作者
- [[roadmap]] —— 个人发展路线图（结构化独立页）

---

## 写作说明

### 1. 双链语法（推荐）

| 写法 | 效果 |
| :--- | :--- |
| `[[hello-world]]` | 自动取该文章标题作为链接文字 |
| `[[hello-world\|自定义文字]]` | 用自定义文字显示，仍指向该文章 |

`[[...]]` 内可填：

- 文章 **slug**（如 `hello-world`）
- 文章 **文件名或路径**（如 `群论/01-简介.md`、`posts/roadmap.md`）
- 文章 **标题**（如 `[[量子态矢量模拟引擎设计]]`）
- **专栏** 的 id 或名称（如 `group-theory`）
- **标签** 名（如 `algebra`）
- **关于页**（`about.md`）

未找到对应内容时会渲染为灰色虚线的「缺失」标记，方便你发现写错的链接。

### 2. 相对 Markdown 链接

标准 Markdown 链接里只要指向 `.md` 文件，就会自动转换为站内路由：

```markdown
[看这篇](hello-world.md)
[看这篇](./hello-world.md)
[看这篇](posts/hello-world.md)
[看这篇](群论/01-简介.md)
```

### 3. 不会被改写的链接

- 外部链接：`https://example.com`、`mailto:...`
- Hash 路由锚点：`#/tags`
- 附件资源：`attachments/slides/xxx.pdf`
- 行内代码 `` `[[hello-world]]` `` 与代码块内的内容
