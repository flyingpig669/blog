# Phase Space Notes 使用说明

这是一个面向计算机、物理、数学研究笔记的静态博客。它支持 Markdown 文章、数学公式、图片、代码块、分类、专栏，以及每篇文章独立附件文件夹。

## 运行

在项目目录运行：

```bash
python3 -m http.server 4173
```

浏览器打开：

```text
http://localhost:4173
```

## 内容结构

每篇笔记一个独立文件夹：

```text
content/
  manifest.json
  my-note-slug/
    index.md
    attachments/
      cover.png
      figure-01.png
      result.csv
```

`index.md` 写文章正文，`attachments/` 放这篇文章自己的图片、实验输出、PDF、数据文件等附件。

## 新增文章

1. 新建文件夹，例如：

```text
content/symplectic-integrator-notes/
```

2. 放入 Markdown：

```text
content/symplectic-integrator-notes/index.md
```

3. 放入附件：

```text
content/symplectic-integrator-notes/attachments/cover.png
content/symplectic-integrator-notes/attachments/phase-plot.png
```

4. 在 `content/manifest.json` 里登记：

```json
{
  "slug": "symplectic-integrator-notes",
  "path": "content/symplectic-integrator-notes/index.md"
}
```

## Markdown 头信息

每篇文章开头需要 front matter：

```md
---
title: 辛积分方法笔记
date: 2026-06-08
readTime: 8 分钟
categories: [计算物理, 数值方法]
series: 结构保持算法
seriesOrder: 2
tags: [计算物理, Hamiltonian, 数值方法]
cover: attachments/cover.png
excerpt: 这是一篇关于辛积分的研究笔记。
---
```

字段说明：

- `title`：文章标题。
- `date`：发布日期。
- `readTime`：阅读时长。
- `category`：单个分类，适合只归属一个主题的文章。
- `categories`：多个分类，适合跨主题文章，例如 `[计算物理, 数值方法]`。如果同时写了 `categories` 和 `category`，网站优先使用 `categories`。
- `series`：专栏/系列，可选，同一个名字会自动聚合。
- `seriesOrder`：专栏内排序，可选。
- `tags`：标签，可写成 `[数学, PDE]`。
- `cover`：封面图路径，建议放在本篇的 `attachments/` 里。
- `excerpt`：首页摘要。

## 支持的正文格式

行内公式：

```md
能量函数记作 \(H(q,p)\)。
```

块级公式：

```md
$$
\dot q = \frac{\partial H}{\partial p}
$$
```

图片：

```md
![相图](attachments/phase-plot.png)
```

代码块：

````md
```python
x = x + alpha * p
```
````

## 分类和专栏

分类用于主题归属，例如：

```md
category: 计算物理
```

多分类文章可以写：

```md
categories: [计算物理, 数值方法]
```

专栏用于系列化内容，例如：

```md
series: 结构保持算法
seriesOrder: 2
```

首页会提供分类筛选，也会显示专栏列表。打开文章详情时，同专栏文章会自动出现在侧边信息里，方便连续阅读。

## 本地 Markdown 导入

网页上有“导入本地笔记”区域，可以选择单个 `.md` 文件，也可以选择一个包含 `index.md` 和 `attachments/` 的文件夹。导入只用于当前浏览器预览，不会自动写入磁盘。

想让文章长期保留在网站里，请按“新增文章”的方式放进 `content/` 并更新 `manifest.json`。
