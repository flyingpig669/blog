---
title: "本地提交 Markdown 文章示例：自动化同步机制"
date: 2026-10-06
category: backend
tags: [Markdown, 自动化, 脚本工具]
pinned: false
coverGradient: "from-pink-600 to-rose-500"
excerpt: "概述  这是一篇通过本地 Markdown 文件手动提交（Commit）至博客系统的示例文章。  你可以在 outputs/blog/posts/ 目录中随时添加任意 .md 格式的文档，系统支持以下两种方式引入：  1. Web 界面拖拽与导入：在博客顶部的“写文章”页面中，..."
---

## 概述

这是一篇通过本地 Markdown 文件手动提交（Commit）至博客系统的示例文章。

你可以在 outputs/blog/posts/ 目录中随时添加任意 .md 格式的文档，系统支持以下两种方式引入：

1. **Web 界面拖拽与导入**：在博客顶部的“写文章”页面中，直接将本地 .md 文件拖拽至编辑区，或者点击“导入 MD 文档”按钮一键载入。
2. **终端脚本一键同步**：直接将 Markdown 文件保存在 outputs/blog/posts/ 目录下，运行 python3 sync_posts.py 即可全自动同步至全站索引。

::: tip 格式说明
支持标准的 YAML Frontmatter 元信息头部（包含 title, date, category, tags），若无 Frontmatter，系统将自动从一级标题（# Title）与正文中提取元信息。
:::

### 代码语法与公式示例

```python
def hello_blog():
    print("Welcome to Aurora Blog with automated markdown commit!")
```

$$
E = mc^2
$$
