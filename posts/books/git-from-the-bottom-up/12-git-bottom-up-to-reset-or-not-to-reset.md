---
title: "To reset, or not to reset"
slug: "git-bottom-up-to-reset-or-not-to-reset"
date: "2026-10-12"
category: "books"
tags: ["Git", "Books"]
column: "git-from-the-bottom-up"
columnName: "Git from the Bottom Up"
columnDesc: "John Wiegley · A guide to Git repositories, the index, reset, and reflog, from the bottom up."
order: 12
---

One of the more difficult commands to master in Git is `reset`, which seems to bite people more often than other commands. Which is understandable, given that it has the potential to change both your working tree and your current HEAD reference. So I thought a quick review of this command would be useful.

Basically, `reset` is a reference editor, an index editor, and a working tree editor. This is partly what makes it so confusing, because it’s capable of doing so many jobs. Let’s examine the difference between these three modes, and how they fit into the Git commit model.

---

By **John Wiegley** · [Original website](https://jwiegley.github.io/git-from-the-bottom-up/) · [Source Markdown](https://github.com/jwiegley/git-from-the-bottom-up) · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) · [License](attachments/books/git-from-the-bottom-up/LICENSE.txt)

Imported on 2026-10-12. The English text is preserved; image paths are adjusted for this site.
