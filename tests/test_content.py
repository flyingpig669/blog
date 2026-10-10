import contextlib
import io
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import sync_posts


class ContentTests(unittest.TestCase):
    def test_non_ascii_post_slug_requires_explicit_slug(self):
        with tempfile.TemporaryDirectory() as directory:
            file = Path(directory) / "中文标题.md"
            file.write_text("# 中文标题\n", encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "英文小写 slug"):
                sync_posts.parse_md_file(str(file))

    def test_duplicate_slugs_fail_before_writing_index(self):
        with tempfile.TemporaryDirectory() as directory:
            posts = Path(directory) / "posts"
            posts.mkdir()
            for name in ("one", "two"):
                (posts / (name + ".md")).write_text('---\nslug: "same-slug"\n---\nBody\n', encoding="utf-8")
            index = os.path.join(directory, "js", "posts-data.js")
            with patch.object(sync_posts, "BASE_DIR", directory), patch.object(sync_posts, "POSTS_DIR", str(posts)), patch.object(sync_posts, "POSTS_DATA_FILE", index), contextlib.redirect_stdout(io.StringIO()):
                with self.assertRaisesRegex(ValueError, "重复 slug"):
                    sync_posts.sync()
            self.assertFalse(os.path.exists(index))


if __name__ == "__main__":
    unittest.main()
