import threading
import unittest
import urllib.request
import tempfile
import os
from pathlib import Path
from unittest.mock import patch

import server


class WatcherTests(unittest.TestCase):
    def test_generated_files_and_dependencies_are_not_watched(self):
        with tempfile.TemporaryDirectory() as root:
            for name in ['server.log', 'css/utilities.css', 'data/documents/demo.json', 'node_modules/test.js', 'js/vue/app.js', 'src/App.vue']:
                file = Path(root) / name
                file.parent.mkdir(parents=True, exist_ok=True)
                file.write_text('test', encoding='utf-8')
            self.assertEqual(set(server.scan_tree(root)), {'src/App.vue'})

    def make_watcher(self):
        with patch.object(server, "scan_tree", return_value={"latest.css": 200, "old.css": 100}):
            watcher = server.FileWatcher("/unused", auto_sync=False)
        watcher._stopped.wait = lambda timeout: False
        return watcher

    def test_deleting_an_older_file_changes_revision(self):
        watcher = self.make_watcher()
        channel = watcher.subscribe()
        previous = watcher.version_ms()
        with patch.object(server, "scan_tree", return_value={"latest.css": 200}):
            watcher._tick()
        self.assertGreater(channel.get_nowait()["v"], previous)

    def test_restoring_an_older_timestamp_changes_revision(self):
        watcher = self.make_watcher()
        channel = watcher.subscribe()
        previous = watcher.version_ms()
        with patch.object(server, "scan_tree", return_value={"latest.css": 200, "old.css": 90}):
            watcher._tick()
        self.assertGreater(channel.get_nowait()["v"], previous)

    def test_markdown_saved_during_settle_is_not_lost(self):
        watcher = self.make_watcher()
        watcher.auto_sync = True
        before_settle = {"latest.css": 201, "old.css": 100}
        after_settle = dict(before_settle, **{"posts/article.md": 202})
        with patch.object(server, "scan_tree", side_effect=[before_settle, after_settle, after_settle]), patch.object(watcher, "_run_sync") as sync:
            watcher._tick()
        sync.assert_called_once()

    def test_vue_component_change_triggers_one_rebuild(self):
        watcher = self.make_watcher()
        watcher.auto_sync = True
        changed = {'latest.css': 200, 'old.css': 100, 'src/App.vue': 202}
        with patch.object(server, 'scan_tree', side_effect=[changed, changed, changed]), patch.object(watcher, '_run_sync') as sync:
            watcher._tick()
        sync.assert_called_once_with(['src/App.vue'])



class RedirectTests(unittest.TestCase):
    def test_preview_serves_generated_overlay_and_sources_without_stale_fallback(self):
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / 'source'
            preview = Path(directory) / 'preview'
            for base, name, content in [
                (source, 'js/posts-data.js', 'production'),
                (preview, 'js/posts-data.js', 'preview'),
                (source, 'src/App.vue', 'live source'),
                (source, 'js/vue/app.js', 'production app'),
                (preview, 'js/vue/app.js', 'preview app'),
                (source, 'data/stale.json', 'stale production'),
                (preview, 'data/documents/中文.json', 'new body'),
            ]:
                target = base / name
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_text(content, encoding='utf-8')
            handler = object.__new__(server.CustomHandler)
            handler.directory = str(source)
            with patch.dict(os.environ, AURORA_OUTPUT_DIR=str(preview)):
                self.assertEqual(Path(handler.translate_path('/js/posts-data.js?v=1')).read_text(), 'preview')
                self.assertEqual(Path(handler.translate_path('/src/App.vue')).read_text(), 'live source')
                self.assertEqual(Path(handler.translate_path('/js/vue/app.js')).read_text(), 'preview app')
                self.assertEqual(Path(handler.translate_path('/data/documents/%E4%B8%AD%E6%96%87.json')).read_text(), 'new body')
                self.assertFalse(Path(handler.translate_path('/data/stale.json')).exists())

    def test_legacy_blog_path_redirects_to_root(self):
        class QuietHandler(server.CustomHandler):
            def log_message(self, *_args):
                pass

        class NoRedirectHandler(urllib.request.HTTPRedirectHandler):
            def http_error_302(self, req, fp, code, msg, headers):
                return fp

        opener = urllib.request.build_opener(NoRedirectHandler)
        httpd = server.ThreadingHTTPServer(("127.0.0.1", 0), QuietHandler)
        thread = threading.Thread(target=httpd.serve_forever, daemon=True)
        thread.start()
        try:
            base = f"http://127.0.0.1:{httpd.server_port}"
            for path, expected_loc in [
                ("/blog", "/"),
                ("/blog/", "/"),
                ("/blog/archive", "/archive"),
                ("/blog?k=v", "/?k=v"),
            ]:
                req = urllib.request.Request(base + path)
                resp = opener.open(req, timeout=5)
                self.assertEqual(resp.headers.get("Location"), expected_loc)
        finally:
            httpd.shutdown()
            httpd.server_close()
            thread.join()

class HtmlInjectionTests(unittest.TestCase):
    def test_root_and_explicit_index_both_include_live_reload(self):
        class QuietHandler(server.CustomHandler):
            def log_message(self, *_args):
                pass

        with patch.object(server, "WATCHER", object()):
            httpd = server.ThreadingHTTPServer(("127.0.0.1", 0), QuietHandler)
            thread = threading.Thread(target=httpd.serve_forever, daemon=True)
            thread.start()
            try:
                base = f"http://127.0.0.1:{httpd.server_port}"
                for route in ("/", "/index.html"):
                    with urllib.request.urlopen(base + route, timeout=5) as response:
                        self.assertIn(b'data-aurora-livereload="1"', response.read())
            finally:
                httpd.shutdown()
                httpd.server_close()
                thread.join()


if __name__ == "__main__":
    unittest.main()
