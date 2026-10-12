---
title: "Doing a mixed reset"
slug: "git-bottom-up-doing-a-mixed-reset"
date: "2026-10-12"
category: "books"
tags: ["Git", "Books"]
column: "git-from-the-bottom-up"
columnName: "Git from the Bottom Up"
columnDesc: "John Wiegley · A guide to Git repositories, the index, reset, and reflog, from the bottom up."
order: 13
---

If you use the `--mixed` option (or no option at all, as this is the default), reset will revert parts of your index along with your HEAD reference to match the given commit. The main difference from `--soft` is that `--soft` only changes the meaning of HEAD and doesn’t touch the index.

```bash
$ git add foo.c  # add changes to the index as a new blob
$ git reset HEAD  # delete any changes staged in the index
$ git add foo.c  # made a mistake, add it back
```

---

By **John Wiegley** · [Original website](https://jwiegley.github.io/git-from-the-bottom-up/) · [Source Markdown](https://github.com/jwiegley/git-from-the-bottom-up) · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) · [License](attachments/books/git-from-the-bottom-up/LICENSE.txt)

Imported on 2026-10-12. The English text is preserved; image paths are adjusted for this site.
