import contextlib
import io
import json
import os
import tempfile
import subprocess
import unittest
from pathlib import Path
from unittest.mock import patch

from scripts.python import sync_posts


class ContentTests(unittest.TestCase):
    def test_writing_templates_parse_without_activating_example_resources(self):
        templates = Path(__file__).resolve().parents[1] / 'templates'
        for template in templates.glob('template-*.md'):
            with self.subTest(template=template.name):
                document = sync_posts.parse_md_file(str(template))
                self.assertTrue(document['title'])
                self.assertEqual(document['slide'], '')
                self.assertEqual(document['attachments'], [])

    def test_slide_discovery_ignores_literal_examples_and_comments(self):
        with tempfile.TemporaryDirectory() as directory:
            article = Path(directory) / 'sample.md'
            examples = '''<!-- ::: slide attachments/missing-comment.pdf -->
````text
::: slide attachments/missing-code.pdf
:::
`````
`::: slide attachments/missing-inline.pdf`
    ::: slide attachments/missing-indented.pdf
'''
            article.write_text(examples)
            self.assertEqual(sync_posts.parse_md_file(str(article))['slide'], '')
            article.write_text(examples + '\n::: slide attachments/real.pdf\n:::\n')
            self.assertEqual(sync_posts.parse_md_file(str(article))['slide'], 'attachments/real.pdf')

    def test_automatic_publication_date_uses_first_commit_and_remains_fixed(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            def git(*args):
                return subprocess.run(['git', *args], cwd=root, check=True, capture_output=True)
            git('init')
            article = root / 'article.md'
            article.write_text('---\ntitle: Article\n---\nOriginal body\n')
            git('add', 'article.md')
            git('-c', 'user.name=Test', '-c', 'user.email=test@example.com', '-c', 'commit.gpgsign=false', 'commit', '--date=2026-01-02T12:00:00+08:00', '-m', 'first')
            article.write_text('---\ntitle: Article\n---\nUpdated body\n')
            git('add', 'article.md')
            git('-c', 'user.name=Test', '-c', 'user.email=test@example.com', '-c', 'commit.gpgsign=false', 'commit', '--date=2026-02-03T12:00:00+08:00', '-m', 'second')
            with patch.object(sync_posts, 'BASE_DIR', directory):
                sync_posts.ensure_publication_date(str(article))
                self.assertIn('date: "2026-01-02"', article.read_text())
                first = article.read_text()
                os.utime(article, (2000000000, 2000000000))
                sync_posts.ensure_publication_date(str(article))
                self.assertEqual(article.read_text(), first)

    def test_new_article_date_is_materialized_once_and_updated_is_independent(self):
        with tempfile.TemporaryDirectory() as directory:
            article = Path(directory) / 'article.md'
            article.write_text('# Article\n')
            with patch.object(sync_posts, 'BASE_DIR', directory):
                sync_posts.ensure_publication_date(str(article))
                date = sync_posts.parse_md_file(str(article))['date']
                article.write_text(article.read_text() + '\nEdited body\n')
                sync_posts.ensure_publication_date(str(article))
                self.assertEqual(sync_posts.parse_md_file(str(article))['date'], date)
            article.write_text('---\ndate: "2026-01-02"\nupdated: "2026-02-03"\n---\nBody\n')
            post = sync_posts.parse_md_file(str(article))
            self.assertEqual(post['date'], '2026-01-02')
            self.assertEqual(post['updated'], '2026-02-03')

    def test_compiled_types_keep_books_and_indexes_searchable_and_pages_separate(self):
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / 'source'
            posts = source / 'posts'
            posts.mkdir(parents=True)
            for kind in ['normal', 'books', 'index', 'page']:
                (posts / (kind + '.md')).write_text(f'---\ntype: {kind}\nhome: false\ndate: "2026-10-12"\n---\nSearchable {kind} body\n', encoding='utf-8')
            output = Path(directory) / 'output'
            with patch.object(sync_posts, 'BASE_DIR', str(source)), patch.object(sync_posts, 'POSTS_DIR', str(posts)), patch.dict(os.environ, AURORA_OUTPUT_DIR=str(output)), contextlib.redirect_stdout(io.StringIO()):
                sync_posts.sync()
            text = (output / 'data/index.json').read_text()
            index = json.loads(text)
            search = json.loads((output / index['searchUrl']).read_text())
            self.assertEqual(set(search), {'normal', 'books', 'index'})
            self.assertEqual(index['documents']['page']['type'], 'post')
            for kind in ['normal', 'books', 'index', 'page']:
                doc = index['documents'][kind]
                self.assertNotIn('category', doc)
                body = json.loads((output / doc['bodyUrl']).read_text())
                self.assertNotIn('category', body)
                self.assertEqual(body['type'], doc['type'])
                self.assertIs(doc['home'], False)
                self.assertIs(body['home'], False)

    def test_home_flag_defaults_to_visible_and_rejects_invalid_values(self):
        with tempfile.TemporaryDirectory() as directory:
            file = Path(directory) / 'article.md'
            file.write_text('# Article\n', encoding='utf-8')
            self.assertNotIn('home', sync_posts.parse_md_file(str(file)))
            for value in ['true', 'false']:
                file.write_text(f'---\nhome: {value}\n---\nBody\n', encoding='utf-8')
                self.assertIs(sync_posts.parse_md_file(str(file))['home'], value == 'true')
            file.write_text('---\nhome: no\n---\nBody\n', encoding='utf-8')
            with self.assertRaisesRegex(ValueError, 'home 必须是 true 或 false'):
                sync_posts.parse_md_file(str(file))

    def test_preview_outputs_and_cleanup_leave_production_files_untouched(self):
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / 'source'
            preview = Path(directory) / 'preview'
            posts = source / 'posts'
            posts.mkdir(parents=True)
            article = posts / 'sample.md'
            article.write_text('---\ndate: "2026-10-12"\n---\nFirst body\n', encoding='utf-8')
            production = source / 'data/index.json'
            production.parent.mkdir()
            production.write_text('production sentinel', encoding='utf-8')
            stale = source / 'data/documents/sample.0000000000000000.json'
            stale.parent.mkdir(parents=True, exist_ok=True)
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
            self.assertIn('sample', (preview / 'data/index.json').read_text())

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
        from scripts.python.lib.frontmatter import parse_frontmatter
        data, _ = parse_frontmatter("---\ntags: [\"A \\\"quote\\\", # literal\", 'it''s fine']\n---\nBody")
        self.assertEqual(data['tags'], ['A "quote", # literal', "it's fine"])
        with self.assertRaises(ValueError):
            parse_frontmatter('---\ntags: ["unclosed"\n---\nBody')

    def test_invalid_metadata_and_duplicates(self):
        from scripts.python.lib.frontmatter import parse_frontmatter
        for metadata in ['date: 2026-02-30', 'title: A\ntitle: B', 'pinned: []', 'publications: invalid', 'chapter: -1']:
            with self.assertRaises(ValueError):
                parse_frontmatter('---\n' + metadata + '\n---\nBody', 'sample.md')

    def test_yaml_multiline_and_nested_links(self):
        from scripts.python.lib.frontmatter import parse_frontmatter
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

    def test_type_controls_structure_without_implicit_topic_tags(self):
        with tempfile.TemporaryDirectory() as directory:
            file = Path(directory) / "sample.md"
            file.write_text("# Sample\n", encoding="utf-8")
            post = sync_posts.parse_md_file(str(file))
            self.assertEqual(post['type'], "normal")
            self.assertNotIn('category', post)
            self.assertEqual(post['tags'], [])
            file.write_text('---\ntype: books\n---\nBody\n', encoding="utf-8")
            self.assertEqual(sync_posts.parse_md_file(str(file))['type'], "books")
            file.write_text('---\ntype: index\n---\nBody\n', encoding="utf-8")
            self.assertEqual(sync_posts.parse_md_file(str(file))['type'], "index")
            file.write_text('---\ntype: physics\n---\nBody\n', encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "type 仅支持"):
                sync_posts.parse_md_file(str(file))
            file.write_text('---\ncategory: physics\n---\nBody\n', encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "category 已合并到 type"):
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
            index = os.path.join(directory, "data", "index.json")
            with patch.object(sync_posts, "BASE_DIR", directory), patch.object(sync_posts, "POSTS_DIR", str(posts)), patch.dict(os.environ, AURORA_OUTPUT_DIR=directory), contextlib.redirect_stdout(io.StringIO()):
                with self.assertRaisesRegex(ValueError, "重复 slug"):
                    sync_posts.sync()
            self.assertFalse(os.path.exists(index))


if __name__ == "__main__":
    unittest.main()
