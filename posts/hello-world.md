---
title: "Hello World: Welcome to Your Aurora Blog"
date: "2026-10-09"
category: "general"
tags: ["Engineering", "Getting Started", "Markdown"]
pinned: true
---

Welcome to your new personal blog, designed with Linear and Vercel-inspired dark minimalism.

## Getting Started

Writing a new article is as simple as placing a Markdown file in the `posts/` directory.

### Folder Structure

- **Regular Articles**: Save any `.md` file directly in `posts/` or under category folders like `posts/tech/my-article.md`.
- **Series / Columns**: Create a subdirectory inside `posts/columns/`, for example `posts/columns/system-design/01-introduction.md`.

## Features Showcase

Here is a quick demonstration of built-in capabilities:

### 1. Mathematical Formulas (KaTeX)

Inline formulas like $$E = mc^2$$ or $$\left| \psi \right\rangle = \alpha \left| 0 \right\rangle + \beta \left| 1 \right\rangle$$, and block equations:

$$
\mathcal{L} = \mathbb{E}_{x \sim p_{\text{data}}} \left[ \log D(x) \right] + \mathbb{E}_{z \sim p_z} \left[ \log (1 - D(G(z))) \right]
$$

### 2. Code Highlighting & One-Click Copy

```python
def fibonacci(n: int) -> int:
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a

print([fibonacci(i) for i in range(10)])
```

### 3. Callout Boxes

::: tip Quick Publishing
Run `./deploy.sh` to compile Markdown articles and push changes to GitHub Pages automatically.
:::

Enjoy crafting your writings!
