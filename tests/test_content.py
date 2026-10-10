import contextlib
import io
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import sync_posts


class ContentTests(unittest.TestCase):
    def test_shared_frontmatter_strings_and_lists(self):
        with tempfile.TemporaryDirectory() as directory:
            file = Path(directory) / "sample.md"
            file.write_text('---\ntitle: "Foo # bar" # outside\ntags: ["Raft, Paxos", "math"]\nattachments:\n  - "file, one.pdf"\ntocLevels: []\n---\nBody\n', encoding="utf-8")
            post = sync_posts.parse_md_file(str(file))
            page = sync_posts.parse_structured_page_file(str(file))
            self.assertEqual(post['title'], 'Foo # bar')
            self.assertEqual(post['tags'], ['Raft, Paxos', 'math'])
            self.assertEqual(post['attachments'], ['file, one.pdf'])
            self.assertEqual(post['tocLevels'], [])
            self.assertEqual(page['tocLevels'], [])
            self.assertEqual(page['title'], post['title'])
            self.assertEqual(page['tags'], post['tags'])

    def test_missing_toc_keeps_default(self):
        with tempfile.TemporaryDirectory() as directory:
            file = Path(directory) / "sample.md"
            file.write_text('---\ntitle: "Sample"\n---\nBody\n', encoding="utf-8")
            self.assertIsNone(sync_posts.parse_structured_page_file(str(file))['tocLevels'])

    def test_escaped_quotes_and_invalid_arrays(self):
        from lib.frontmatter import parse_frontmatter
        data, _ = parse_frontmatter("---\ntags: [\"A \\\"quote\\\", # literal\", 'it''s fine']\n---\nBody")
        self.assertEqual(data['tags'], ['A "quote", # literal', "it's fine"])
        with self.assertRaises(ValueError):
            parse_frontmatter('---\ntags: ["unclosed"\n---\nBody')

    def test_invalid_metadata_and_duplicates(self):
        from lib.frontmatter import parse_frontmatter
        for metadata in ['date: 2026-02-30', 'title: A\ntitle: B', 'pinned: []', 'publications: invalid', 'chapter: -1']:
            with self.assertRaises(ValueError):
                parse_frontmatter('---\n' + metadata + '\n---\nBody', 'sample.md')

    def test_yaml_multiline_and_nested_links(self):
        from lib.frontmatter import parse_frontmatter
        data, body = parse_frontmatter('---\ntitle: Example\nbio: |\n  First\n  Second\npublications:\n  - title: Paper\n    links: {doi: "10.1234/test"}\n---\nBody')
        self.assertEqual(data['bio'], 'First\nSecond\n')
        self.assertEqual(data['publications'][0]['links']['doi'], '10.1234/test')
        self.assertEqual(body, 'Body')

    def test_non_ascii_post_slug_requires_explicit_slug(self):
        with tempfile.TemporaryDirectory() as directory:
            file = Path(directory) / "中文标题.md"
            file.write_text("# 中文标题\n", encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "英文小写 slug"):
                sync_posts.parse_md_file(str(file))

    def test_toc_levels_validate_and_deduplicate(self):
        self.assertEqual(sync_posts.normalize_toc_levels(['2', '3', '2']), [2, 3])
        self.assertEqual(sync_posts.normalize_toc_levels('false'), [])
        for value in [['7'], ['bad']]:
            with self.assertRaisesRegex(ValueError, 'tocLevels'):
                sync_posts.normalize_toc_levels(value)

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
