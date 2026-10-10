import threading
import unittest
import urllib.request
from unittest.mock import patch

import server


class WatcherTests(unittest.TestCase):
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
