---
title: "Hello World: Welcome to Aurora Notes"
date: "2026-10-09"
category: "general"
tags: ["Engineering", "Getting Started", "Markdown"]
pinned: true
---

Aurora Notes is a place for long-form technical writing: system architecture notes, computing
fundamentals, and the occasional detour into physics and mathematics. Everything here is
plain Markdown, compiled ahead of time into a static site with no server and no framework.

## How the writing is organised

Articles live in `posts/`. A single file is a single article — drop a `.md` file in and it
shows up in the archive the next time the site is built.

- **Standalone articles** sit directly in `posts/`, or in a category folder such as `posts/physics/`.
- **Series** live in a folder under `posts/columns/<slug>/`, numbered `01-…`, `02-…`. Files
  sharing that folder are grouped automatically into a column with previous/next navigation.

Each file opens with a small block of front matter that supplies the metadata for the page:

```yaml
---
title: "Article title"
date: "2026-10-09"
category: "physics"
tags: ["algebra", "math"]
excerpt: "One sentence shown in listings and search results."
---
```

Documents tagged `test` are treated as drafts: while the site is in production mode they are
filtered out at build time, so they never reach the archive, the search index, or the
published files.

## What the reader gets

The rendering pipeline is deliberately small, but a few things are worth knowing about.

### Mathematics

Equations are typeset with KaTeX, inline and in display blocks:

$$
\left| \psi \right\rangle = \alpha \left| 0 \right\rangle + \beta \left| 1 \right\rangle,
\quad |\alpha|^2 + |\beta|^2 = 1
$$

### Code

Fenced code blocks are highlighted and carry a one-click copy button:

```python
def fibonacci(n: int) -> int:
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a
```

### Cross-references

Articles can point at each other by name — see [[group-theory-intro]] for a worked
introduction, or [[quantum-simulator]] for an article that embeds a slide deck.

::: tip Finding things
Press `Cmd+K` (or `Ctrl+K`) anywhere to search every article, or browse the archive,
the tag index, and the column list from the top navigation.
:::

## Where to go next

- **Archive** — every article, grouped by year.
- **Tags** — combine tags to narrow the list; selections intersect.
- **Columns** — multi-part series, read in order.
- **Roadmap** — what is planned, and what is being worked on.

Thanks for reading.
