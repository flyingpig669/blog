import contextlib
import io
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import sync_posts


class ContentTests(unittest.TestCase):
    def test_preview_outputs_and_cleanup_leave_production_files_untouched(self):
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / 'source'
            preview = Path(directory) / 'preview'
            posts = source / 'posts'
            posts.mkdir(parents=True)
            article = posts / 'sample.md'
            article.write_text('---\ndate: "2026-10-12"\n---\nFirst body\n', encoding='utf-8')
            production = source / 'js/posts-data.js'
            production.parent.mkdir()
            production.write_text('production sentinel', encoding='utf-8')
            stale = source / 'data/documents/sample.0000000000000000.json'
            stale.parent.mkdir(parents=True)
            stale.write_text('production body', encoding='utf-8')
            with patch.object(sync_posts, 'BASE_DIR', str(source)), patch.object(sync_posts, 'POSTS_DIR', str(posts)), patch.dict(os.environ, AURORA_OUTPUT_DIR=str(preview)), contextlib.redirect_stdout(io.StringIO()):
                sync_posts.sync()
                old_bodies = list((preview / 'data/documents').glob('*.json'))
                unchanged_mtime = old_bodies[0].stat().st_mtime_ns
                sync_posts.sync()
                self.assertEqual(old_bodies[0].stat().st_mtime_ns, unchanged_mtime)
                article.write_text('---\ndate: "2026-10-12"\n---\nUpdated body\n', encoding='utf-8')
                sync_posts.sync()
            self.assertEqual(production.read_text(), 'production sentinel')
            self.assertEqual(stale.read_text(), 'production body')
            self.assertFalse(old_bodies[0].exists())
            self.assertEqual(len(list((preview / 'data/documents').glob('*.json'))), 1)
            self.assertIn('sample', (preview / 'js/posts-data.js').read_text())

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

    def test_chinese_post_slug_defaults_to_filename_and_supports_override(self):
        with tempfile.TemporaryDirectory() as directory:
            file = Path(directory) / "中文标题.md"
            file.write_text("# 中文标题\n", encoding="utf-8")
            self.assertEqual(sync_posts.parse_md_file(str(file))['slug'], "中文标题")
            file.write_text('---\nslug: "量子力学-作业"\ntags: ["量子力学"]\n---\n正文\n', encoding="utf-8")
            post = sync_posts.parse_md_file(str(file))
            self.assertEqual(post['slug'], "量子力学-作业")
            self.assertEqual(post['tags'], ["量子力学"])
            self.assertFalse(sync_posts.valid_resource_slug("../作业"))

    def test_category_only_marks_structure_without_implicit_topic_tags(self):
        with tempfile.TemporaryDirectory() as directory:
            file = Path(directory) / "sample.md"
            file.write_text("# Sample\n", encoding="utf-8")
            post = sync_posts.parse_md_file(str(file))
            self.assertEqual(post['category'], "")
            self.assertEqual(post['tags'], [])
            file.write_text('---\ncategory: books\n---\nBody\n', encoding="utf-8")
            self.assertEqual(sync_posts.parse_md_file(str(file))['category'], "books")
            file.write_text('---\ncategory: index\n---\nBody\n', encoding="utf-8")
            self.assertEqual(sync_posts.parse_md_file(str(file))['category'], "index")
            file.write_text('---\ncategory: physics\n---\nBody\n', encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "主题分类请使用 tags"):
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
