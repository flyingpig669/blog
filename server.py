#!/usr/bin/env python3
"""
==============================================================================
Aurora Blog - 本地开发服务器 (Local Development Server)
==============================================================================
在标准库 http.server 基础上做了三处关键加固，解决并发访问时静态资源
偶发连接重置 (ECONNRESET) 进而导致页面白屏 / 脚本加载失败的问题：

1. 采用多线程 + 守护线程 (daemon_threads)，避免连接堆积。
2. 将 TCP 监听队列 (request_queue_size) 从默认的 5 提升到 256，
   防止浏览器并发请求（同源通常 6 路以上）溢出队列被内核重置。
3. 启用 HTTP/1.1 长连接 (keep-alive)，显著降低连接建立/关闭开销，
   并优雅吞掉客户端主动断开产生的 ConnectionReset / BrokenPipe 噪音。

另提供开发期的「保存即刷新」能力（默认开启，仅存在于本地开发服务器）：

4. FileWatcher 轮询项目文件的 mtime，变更后通过 SSE (/__livereload) 通知浏览器刷新。
5. 若改动的是 Markdown 或 blog.config.js，会先自动重跑 sync_posts.py 重建索引再刷新，
   因此改文章也能立刻看到结果，无需手动执行同步脚本。
6. 刷新脚本是「响应期内注入」的 —— 只在服务器返回 HTML 时加进内存，
   磁盘上的 index.html 保持原样，GitHub Pages 等生产环境完全不受影响。
"""

import argparse
import http.server
import io
import json
import os
import queue
import socketserver
import subprocess
import sys
import threading
import time

DEFAULT_PORT = int(os.environ.get("AURORA_PORT", "18888"))
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

# 实时刷新相关常量
LIVE_PATH = "/__livereload"          # SSE 端点路径
WATCH_POLL_SECONDS = 0.5             # 轮询间隔
WATCH_SETTLE_SECONDS = 0.12          # 检测到变更后再等一小会，等编辑器写完
SSE_HEARTBEAT_SECONDS = 15           # 心跳注释，防止中间层掐掉空闲连接

# 全局单例：仅在 __main__ 中开启监听后被赋值；为 None 时服务器行为与旧版完全一致。
WATCHER = None

# 注入到 HTML 末尾的实时刷新客户端（纯 ASCII，UTF-8 编码后按字节替换）。
LIVE_RELOAD_SNIPPET = """
<script data-aurora-livereload="1">
/**
 * 开发期自动刷新（仅本地服务器注入，不会出现在部署产物里）。
 * 与 /__livereload 建立 SSE 长连接，服务端文件一变就刷新当前页。
 */
(function () {
  if (window.__auroraLiveReload) { return; }
  window.__auroraLiveReload = true;

  var badgeEl = null;
  var pendingTimer = null;
  var serverVersion = null;   // 首帧只记录基线，否则连接成功即会刷新，形成无限重载

  function showBadge(text) {
    if (!badgeEl) {
      badgeEl = document.createElement('div');
      badgeEl.setAttribute('data-aurora-livereload-badge', '');
      badgeEl.style.cssText = [
        'position:fixed', 'left:50%', 'bottom:24px', 'transform:translateX(-50%)',
        'z-index:2147483647', 'padding:7px 14px', 'border-radius:999px',
        'background:#111113', 'border:1px solid rgba(255,255,255,.16)', 'color:#EDEDED',
        'font:500 12px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace',
        'box-shadow:0 8px 30px rgba(0,0,0,.6)', 'pointer-events:none', 'opacity:1',
        'transition:opacity .2s ease'
      ].join(';');
      document.body.appendChild(badgeEl);
    }
    badgeEl.textContent = text;
  }

  var source = new EventSource('/__livereload');

  source.onmessage = function (event) {
    var payload;
    try { payload = JSON.parse(event.data); } catch (err) { return; }
    var version = payload && payload.v;
    if (typeof version !== 'number') { return; }
    if (serverVersion === null) { serverVersion = version; return; }
    if (version === serverVersion) { return; }
    serverVersion = version;

    // 编辑器保存常常连续触发多次，合并成一次刷新
    clearTimeout(pendingTimer);
    pendingTimer = setTimeout(function () {
      showBadge('已更新，正在刷新…');
      setTimeout(function () { window.location.reload(); }, 160);
    }, 120);
  };

  // 断开（例如服务器重启）时 EventSource 会按 retry 自动重连，无需额外处理
  source.onerror = function () {};
})();
</script>
"""

LIVE_RELOAD_BYTES = LIVE_RELOAD_SNIPPET.encode("utf-8")


def daemonize():
    """脱离终端在后台运行（当前终端关闭后依然存活）。"""
    if os.fork() > 0:
        sys.exit(0)
    os.setsid()
    if os.fork() > 0:
        sys.exit(0)
    sys.stdout.flush()
    sys.stderr.flush()
    si = open(os.devnull, "r")
    so = open(os.path.join(DIRECTORY, "server.log"), "a+")
    os.dup2(si.fileno(), sys.stdin.fileno())
    os.dup2(so.fileno(), sys.stdout.fileno())
    os.dup2(so.fileno(), sys.stderr.fileno())


def enable_line_buffering():
    """把 stdout 切成行缓冲。

    重定向到文件或管道时 Python 默认是块缓冲（约 8KB），日志会「卡住不显示」——
    实时刷新的提示、以及 --daemon 写入 server.log 的内容都需要即时可见。
    """
    try:
        sys.stdout.reconfigure(line_buffering=True)
    except (AttributeError, ValueError):
        pass


# 监听排除项。
# server.log 必须排除：--daemon 模式下服务器把日志写进这个文件，而每个 HTTP 请求
# 都会追加一行 —— 一旦把它纳入快照，就会形成「请求 -> 日志 mtime 变化 -> 广播刷新
# -> 浏览器重新请求 -> 日志再变化」的无限重载循环。任何运行期产物都不该参与监听。
WATCH_IGNORED_DIRS = {"__pycache__", "node_modules"}
WATCH_IGNORED_FILES = {"server.log"}
WATCH_IGNORED_SUFFIXES = (".log", ".pyc", ".pyo", ".swp", ".swo")


def scan_tree(root):
    """快照整棵项目树的 {相对路径: mtime}，用于比对变更。"""
    snapshot = {}
    for dirpath, dirnames, filenames in os.walk(root):
        # 跳过版本库、缓存与不参与预览的目录（同时避免 walk 进 .git 这种大目录）
        dirnames[:] = [
            d for d in dirnames
            if d not in WATCH_IGNORED_DIRS and not d.startswith(".")
        ]
        for name in filenames:
            if name.startswith(".") or name in WATCH_IGNORED_FILES:
                continue
            if name.endswith(WATCH_IGNORED_SUFFIXES):
                continue
            full = os.path.join(dirpath, name)
            try:
                snapshot[os.path.relpath(full, root)] = os.stat(full).st_mtime
            except OSError:
                continue
    return snapshot


class FileWatcher(threading.Thread):
    """轮询文件 mtime，变更后广播给所有 SSE 订阅者。

    每次变化递增版本号，删除文件或恢复旧时间戳也能触发刷新。
    """

    # sync_posts.py 的输出：它们是同步动作的结果，不应再单独触发一次刷新
    GENERATED = {"js/posts-data.js", "sitemap.xml"}
    # 改动这些扩展名/文件后，需要先重建索引再刷新
    SYNC_TRIGGERS = (".md", ".markdown")
    SYNC_FILES = {"blog.config.js"}

    def __init__(self, root, auto_sync=True, log=None):
        super().__init__(name="aurora-file-watcher")
        self.daemon = True
        self.root = root
        self.auto_sync = auto_sync
        self.log = log or (lambda message: None)
        self._snapshot = scan_tree(root)
        self._version = int(time.time() * 1000)
        self._subscribers = set()
        self._lock = threading.Lock()
        self._stopped = threading.Event()

    # ---- 对外接口 ----
    def version_ms(self):
        with self._lock:
            return self._version

    def subscribe(self):
        channel = queue.Queue()
        with self._lock:
            self._subscribers.add(channel)
        return channel

    def unsubscribe(self, channel):
        with self._lock:
            self._subscribers.discard(channel)

    def stop(self):
        self._stopped.set()
        with self._lock:
            channels = list(self._subscribers)
        for channel in channels:
            try:
                channel.put_nowait(None)
            except Exception:
                pass

    # ---- 线程主体 ----
    def run(self):
        while not self._stopped.is_set():
            self._stopped.wait(WATCH_POLL_SECONDS)
            if self._stopped.is_set():
                break
            try:
                self._tick()
            except Exception as exc:  # 监听线程绝不能因单次异常而退出
                self.log(f"⚠️  文件监听出错（已忽略）: {exc}")

    def _tick(self):
        latest = scan_tree(self.root)
        previous = self._snapshot
        changed = sorted(
            [path for path, mtime in latest.items() if previous.get(path) != mtime]
            + [path for path in previous if path not in latest]
        )
        if not changed:
            return

        # 等文件写完：编辑器可能有多次落盘 / 一次保存多个文件
        self._stopped.wait(WATCH_SETTLE_SECONDS)
        settled = scan_tree(self.root)
        changed = sorted(
            [path for path, mtime in settled.items() if previous.get(path) != mtime]
            + [path for path in previous if path not in settled]
        )
        if not changed:
            return

        sources = [path for path in changed if path not in self.GENERATED]
        needs_sync = self.auto_sync and any(
            path.endswith(self.SYNC_TRIGGERS) or path in self.SYNC_FILES
            for path in sources
        )
        if needs_sync:
            self._run_sync()
            # sync 会重写 js/posts-data.js，一并吞进新基线，避免紧接着再刷一次
            # 只吞掉生成文件；编译期间的新源文件改动留给下一轮检测。
            after_sync = scan_tree(self.root)
            for path in self.GENERATED:
                if path in after_sync:
                    settled[path] = after_sync[path]
                else:
                    settled.pop(path, None)

        with self._lock:
            self._snapshot = settled
            self._version = max(self._version + 1, int(time.time() * 1000))

        preview = "、".join(sources[:3]) + ("…" if len(sources) > 3 else "")
        self.log(f"🔄 检测到改动：{preview or '生成产物'} → 通知浏览器刷新")
        self._broadcast()

    def _run_sync(self):
        script = os.path.join(self.root, "sync_posts.py")
        if not os.path.exists(script):
            return
        try:
            result = subprocess.run(
                [sys.executable, script],
                cwd=self.root,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                timeout=30,
            )
        except subprocess.TimeoutExpired:
            self.log("⚠️  sync_posts.py 执行超时（>30s），已跳过本次索引重建")
            return
        except Exception as exc:
            self.log(f"⚠️  sync_posts.py 无法执行: {exc}")
            return

        if result.returncode != 0:
            tail = result.stdout.decode("utf-8", "replace").strip().splitlines()[-3:]
            self.log("⚠️  sync_posts.py 失败: " + " / ".join(tail))
        else:
            self.log("📦 已重建 js/posts-data.js")

    def _broadcast(self):
        payload = {"v": self.version_ms()}
        with self._lock:
            channels = list(self._subscribers)
        for channel in channels:
            try:
                channel.put_nowait(payload)
            except Exception:
                pass


class CustomHandler(http.server.SimpleHTTPRequestHandler):
    # 启用 HTTP/1.1：支持长连接，避免每个资源都重新三次握手
    protocol_version = "HTTP/1.1"
    # 空闲长连接的超时时间（秒），超时后自动关闭，防止线程被长期占用
    timeout = 30

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    # ---- 缓存策略 ----
    # 源码类资源必须每次回源，否则「保存即刷新」会刷出旧内容；
    # 但 vendor/ 是体积大且很少改动的第三方库（PDF.js 单文件 1.3MB），
    # 每次刷新都重新下载会明显拖慢开发反馈，故单独放行一段缓存。
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        if self.path.startswith("/vendor/"):
            self.send_header("Cache-Control", "public, max-age=3600")
        else:
            self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        super().end_headers()

    # ---- 实时刷新：SSE 端点 ----
    def do_GET(self):
        if WATCHER is not None and self.path.split("?", 1)[0] == LIVE_PATH:
            self._serve_event_stream()
            return
        super().do_GET()

    def _serve_event_stream(self):
        watcher = WATCHER
        channel = watcher.subscribe()
        try:
            self.send_response(200)
            self.send_header("Content-Type", "text/event-stream; charset=utf-8")
            self.send_header("X-Accel-Buffering", "no")
            self.end_headers()
            # 断开后由浏览器按 retry 间隔自动重连
            self.wfile.write(b"retry: 1000\n\n")
            self.wfile.write(self._sse_frame({"v": watcher.version_ms()}))
            self.wfile.flush()

            while True:
                try:
                    item = channel.get(timeout=SSE_HEARTBEAT_SECONDS)
                except queue.Empty:
                    self.wfile.write(b": keep-alive\n\n")
                    self.wfile.flush()
                    continue
                if item is None:
                    break
                self.wfile.write(self._sse_frame(item))
                self.wfile.flush()
        except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError, OSError):
            pass  # 标签页关闭 / 网络中断，属正常现象
        finally:
            watcher.unsubscribe(channel)
            self.close_connection = True

    @staticmethod
    def _sse_frame(payload):
        return ("data: " + json.dumps(payload) + "\n\n").encode("utf-8")

    # ---- 实时刷新：把客户端脚本注入 HTML 响应 ----
    def send_head(self):
        if WATCHER is not None:
            translated = self.translate_path(self.path)
            if os.path.isdir(translated):
                translated = os.path.join(translated, "index.html")
            if translated.lower().endswith(".html") and os.path.isfile(translated):
                injected = self._injected_html_response(translated)
                if injected is not None:
                    return injected
        return super().send_head()

    def _injected_html_response(self, path):
        """读取 HTML，在 </body> 前插入实时刷新脚本后直接返回（不落盘）。"""
        try:
            with open(path, "rb") as handle:
                body = handle.read()
        except OSError:
            return None

        if b"data-aurora-livereload" not in body:
            if b"</body>" in body:
                body = body.replace(b"</body>", LIVE_RELOAD_BYTES + b"</body>", 1)
            else:
                body += LIVE_RELOAD_BYTES

        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        return io.BytesIO(body)

    def log_message(self, format, *args):
        # SSE 长连接只在建立/断开时各打一行，避免刷屏
        if self.path.split("?", 1)[0] == LIVE_PATH:
            return
        super().log_message(format, *args)

    def handle_one_request(self):
        # 客户端（浏览器）主动断开时会抛出连接异常，属正常现象，静默关闭即可
        try:
            super().handle_one_request()
        except (ConnectionResetError, BrokenPipeError, ConnectionAbortedError):
            self.close_connection = True

    def copyfile(self, source, outputfile):
        # 大文件传输途中客户端取消请求时，避免抛出异常污染日志
        try:
            super().copyfile(source, outputfile)
        except (ConnectionResetError, BrokenPipeError):
            pass


class ThreadingHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True
    # 关键：默认监听队列仅 5，浏览器并发请求极易溢出被内核 RST
    request_queue_size = 256


def parse_args():
    parser = argparse.ArgumentParser(description="Run the Aurora Notes development server.")
    parser.add_argument("--port", "-p", type=int, default=DEFAULT_PORT, help="port to listen on")
    parser.add_argument("--daemon", "-d", action="store_true", help="run in the background")
    parser.add_argument(
        "--watch", dest="watch", action="store_true", default=True,
        help="watch project files and auto-reload the browser (default)",
    )
    parser.add_argument(
        "--no-watch", dest="watch", action="store_false",
        help="disable file watching (plain static server, no script injection)",
    )
    parser.add_argument(
        "--no-sync", dest="sync", action="store_false", default=True,
        help="do not rebuild js/posts-data.js when Markdown changes",
    )
    return parser.parse_args()


if __name__ == "__main__":
    enable_line_buffering()
    args = parse_args()

    if not 1 <= args.port <= 65535:
        sys.stderr.write("error: port must be between 1 and 65535\n")
        sys.exit(2)

    if args.daemon:
        daemonize()

    os.chdir(DIRECTORY)

    if args.watch:
        WATCHER = FileWatcher(
            DIRECTORY,
            auto_sync=args.sync,
            log=lambda message: print(message, flush=True),
        )
        WATCHER.start()

    try:
        with ThreadingHTTPServer(("", args.port), CustomHandler) as httpd:
            print(f"Aurora Blog Server listening on http://localhost:{args.port}")
            if args.watch:
                print("🔁 已开启实时刷新：保存 css/ js/ posts/ 下任意文件，浏览器会自动刷新")
                if args.sync:
                    print("   改动 Markdown 或 blog.config.js 时会先重建 js/posts-data.js")
                print("   （脚本只注入到本地响应，磁盘上的 index.html 不会被改动）")
            else:
                print("⏸  未开启实时刷新（--no-watch）")
            print("   Ctrl+C 停止")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
    finally:
        if WATCHER is not None:
            WATCHER.stop()
        sys.exit(0)
