# Phase Space Notes 使用说明

这是一个面向计算机、物理、数学研究笔记的静态博客。它适合写计算物理、数值分析、PDE、科学计算工程、论文阅读和实验日志。

## 功能总览

- Markdown 文章：每篇文章用一个 `index.md` 编写。
- 独立附件文件夹：每篇文章有自己的 `attachments/`，方便放图片、PDF、数据和实验输出。
- 自动内容管理：运行 `node scripts/generate-manifest.mjs` 自动扫描文章并生成 `content/manifest.json`。
- 数学公式：支持行内公式 `\( ... \)` 和块级公式 `$$ ... $$`。
- 图片显示：支持 Markdown 图片语法，推荐引用本篇 `attachments/` 里的图片。
- 代码块：支持 fenced code block，并接入 Prism 语法高亮。
- 表格：支持基础 Markdown 表格。
- 链接：支持 Markdown 链接。
- 脚注：支持 `[^id]` 和 `[^id]: 内容`。
- 任务列表：支持 `- [ ]` 和 `- [x]`。
- 分类：支持单分类 `category` 和多分类 `categories`。
- 标签：支持 `tags`。
- 专栏/系列：支持 `series` 和 `seriesOrder`。
- 独立文章：不写 `series` 就是独立文章。
- 全文搜索：搜索标题、摘要、分类、专栏、标签和正文内容。
- 文章目录：文章详情页会根据 `##`、`###` 自动生成目录。
- 附件列表：文章详情页会列出该文章文件夹下的附件。
- 研究字段：支持 `paper`、`repo`、`dataset`、`status`。
- 专栏页面：同一 `series` 的文章会组成专栏页。
- 本地导入预览：支持临时导入本地 Markdown 或笔记文件夹，但公开站点默认隐藏这个工具。
- Git 回滚：项目已经初始化 Git，方便回到历史版本。

## 顶部导航

- `文章`：回到首页文章列表。
- `专栏`：进入全部专栏页面，列出所有 `series`。
- `关于`：显示研究方向和站点简介。
- `说明`：显示站内使用说明。
- `联系`：显示站内联系页面。页面中的邮箱、GitHub 等信息可以在 `scripts.js` 的 `renderContact()` 里替换。

## 运行

在项目目录运行：

```bash
python3 -m http.server 4173
```

浏览器打开：

```text
http://localhost:4173
```

如果你的机器有 `npm`，也可以用：

```bash
npm run serve
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
      paper.pdf
```

`index.md` 写文章正文，`attachments/` 放这篇文章自己的图片、实验输出、PDF、数据文件等附件。

## 新增文章

1. 新建文件夹：

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

4. 自动生成 manifest：

```bash
node scripts/generate-manifest.mjs
```

生成器会自动扫描所有 `content/*/index.md`，并把每篇文章的附件写入 `content/manifest.json`。以后不需要手动编辑 manifest。

## 日常写作流程

推荐以后按这个顺序维护博客：

```bash
# 1. 新建文章文件夹和附件
mkdir -p content/new-note/attachments

# 2. 编写正文
$EDITOR content/new-note/index.md

# 3. 自动更新文章索引
node scripts/generate-manifest.mjs

# 4. 本地预览
python3 -m http.server 4173

# 5. 保存到 Git
git add .
git commit -m "Add new note"
```

浏览器打开：

```text
http://localhost:4173
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
status: experiment
paper: arXiv:xxxx.xxxxx
repo: https://github.com/your/name
dataset: attachments/result.csv
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
- `status`：研究状态，例如 `reading`、`experiment`、`finished`。
- `paper`：论文编号或链接。
- `repo`：代码仓库链接。
- `dataset`：数据文件路径，推荐放在 `attachments/`。
- `cover`：封面图路径，建议放在本篇 `attachments/` 里。
- `excerpt`：首页摘要。

## 独立文章

如果文章不属于任何专栏，直接不要写 `series` 和 `seriesOrder`。

```md
---
title: 一个独立的误差分析笔记
date: 2026-06-08
readTime: 5 分钟
categories: [数学札记, 数值方法]
tags: [误差分析, PDE]
cover: attachments/cover.png
excerpt: 这篇文章不属于任何专栏，只是一篇独立笔记。
---
```

独立文章会正常出现在首页、分类筛选和标签筛选里。文章详情里的“专栏”会显示 `无`，也不会出现在任何专栏列表中。

## 专栏文章

专栏用于系列化内容。多篇文章写同一个 `series` 名字，就会自动归到同一个专栏。

```md
---
title: 辛积分方法笔记
date: 2026-06-08
readTime: 8 分钟
categories: [计算物理, 数值方法]
series: 结构保持算法
seriesOrder: 2
tags: [Hamiltonian, 辛积分]
cover: attachments/cover.png
excerpt: 这是一篇属于“结构保持算法”专栏的文章。
---
```

`seriesOrder` 控制专栏内部的阅读顺序。比如同一个专栏可以有：

```md
series: 结构保持算法
seriesOrder: 1
```

```md
series: 结构保持算法
seriesOrder: 2
```

首页右侧会显示专栏列表，顶部筛选区也能按专栏筛选。打开文章详情时，同专栏文章会显示在右侧“同专栏”区域。

## Markdown 正文格式

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

表格：

```md
| 方法 | 阶数 | 结构保持 |
| --- | --- | --- |
| Euler | 1 | 否 |
| Verlet | 2 | 是 |
```

链接：

```md
[项目仓库](https://github.com/your/name)
```

脚注：

```md
这是一个脚注引用[^note]。

[^note]: 这里是脚注内容。
```

任务列表：

```md
- [x] 跑通基准实验
- [ ] 补充误差图
```

## 分类、标签和搜索

单分类：

```md
category: 计算物理
```

多分类：

```md
categories: [计算物理, 数值方法]
```

标签：

```md
tags: [Hamiltonian, PDE, 稀疏矩阵]
```

首页可以按分类、专栏和标签筛选。搜索框会搜索标题、摘要、分类、专栏、标签、研究字段和正文内容。

## 附件管理

每篇文章的附件建议放在自己的 `attachments/` 目录：

```text
content/my-note/attachments/
  cover.png
  phase-plot.png
  result.csv
  derivation.pdf
```

运行：

```bash
node scripts/generate-manifest.mjs
```

文章详情页右侧会自动显示“本文附件”。图片可以直接在 Markdown 中引用：

```md
![相图](attachments/phase-plot.png)
```

数据或 PDF 可以通过研究字段引用：

```md
dataset: attachments/result.csv
paper: attachments/derivation.pdf
```

## 本地导入工具

站点里有本地导入预览功能，但默认关闭：

```js
const SHOW_LOCAL_IMPORT_TOOLS = false;
```

这个工具只适合作者在本机临时预览 Markdown。开启后，页面会出现“选择 Markdown”和“选择笔记文件夹”按钮。

重要说明：

- 这不是上传功能。
- 选择的文件不会发送到服务器。
- 选择的文件不会写入项目目录。
- 导入内容只存在于当前访问者自己的浏览器会话里。
- 公开部署时建议保持 `SHOW_LOCAL_IMPORT_TOOLS = false`。

如果公开站点上开启这个功能，任何访问者都可以在自己的浏览器里选择本地文件预览，但他们不能修改你的博客，也不能把文件上传到你的服务器。为了避免误解，正式发布时默认隐藏这个工具。

## 发布

这是一个静态站点，可以发布到 GitHub Pages、Cloudflare Pages、Netlify 或任意静态文件服务器。

发布前建议：

```bash
node scripts/generate-manifest.mjs
git status --short
```

确认 `content/manifest.json` 已更新，并且公开站点保持：

```js
const SHOW_LOCAL_IMPORT_TOOLS = false;
```

## 推送到 GitHub

当前目标仓库：

```text
git@github.com:flyingpig669/blog.git
```

第一次连接远程仓库：

```bash
git remote add origin git@github.com:flyingpig669/blog.git
```

后续推送当前分支：

```bash
git push -u origin main
```

如果推送失败，通常是 SSH key 没有配置到 GitHub。可以先检查：

```bash
ssh -T git@github.com
```

## Git 回滚

查看历史：

```bash
git log --oneline
```

回到某个版本：

```bash
git checkout <commit-hash>
```

当前项目已经有一次初始提交，可以作为稳定回滚点。
