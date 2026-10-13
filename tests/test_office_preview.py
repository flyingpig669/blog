import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from lib.office_preview import attachment_sources, build_previews


class OfficePreviewTests(unittest.TestCase):
    def test_sources_include_downloads_and_markdown_but_ignore_code(self):
        sources = attachment_sources({'attachments': ['attachments/讲义.docx'], 'content': '''
[Slides](attachments/课件.pptx)
[Notes](<attachments/notes one.docx> "title")
`[Example](attachments/example.doc)`
```md
[Example](attachments/example.ppt)
```
'''})
        self.assertEqual(sources, ['attachments/notes one.docx', 'attachments/讲义.docx', 'attachments/课件.pptx'])

    def test_conversion_is_cached_and_invalidated_by_content(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            source = root / 'attachments/讲义.docx'
            source.parent.mkdir()
            source.write_bytes(b'first')
            output = root / 'preview'
            def convert(args, **kwargs):
                Path(args[-1]).with_suffix('.pdf').write_bytes(b'%PDF-1.7\npreview')
                return type('Result', (), {'returncode': 0, 'stdout': '', 'stderr': ''})()
            doc = {'attachments': ['attachments/讲义.docx']}
            with patch('lib.office_preview.shutil.which', return_value='soffice'), patch('lib.office_preview.subprocess.run', side_effect=convert) as run:
                first = build_previews(doc, root, output)
                self.assertEqual(build_previews(doc, root, output), first)
                self.assertEqual(run.call_count, 1)
                source.write_bytes(b'second')
                second = build_previews(doc, root, output)
                self.assertNotEqual(first, second)
                self.assertEqual(run.call_count, 2)
                self.assertTrue((output / second['attachments/讲义.docx']).is_file())

    def test_external_links_are_skipped_and_local_path_escape_rejected(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            (root / 'private.docx').write_bytes(b'private')
            self.assertEqual(build_previews({'attachments': ['https://example.com/file.pptx']}, root, root), {})
            with self.assertRaisesRegex(ValueError, 'attachments/'):
                build_previews({'attachments': ['attachments/../private.docx']}, root, root)

    def test_converter_success_without_pdf_is_an_error(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            source = root / 'attachments/broken.ppt'
            source.parent.mkdir()
            source.write_bytes(b'broken')
            result = type('Result', (), {'returncode': 0, 'stdout': 'no output', 'stderr': ''})()
            with patch('lib.office_preview.shutil.which', return_value='soffice'), patch('lib.office_preview.subprocess.run', return_value=result):
                with self.assertRaisesRegex(ValueError, '转换失败'):
                    build_previews({'attachments': ['attachments/broken.ppt']}, root, root)
