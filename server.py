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
"""

import http.server
import socketserver
import argparse
import os
import sys

DEFAULT_PORT = int(os.environ.get("AURORA_PORT", "18888"))
DIRECTORY = os.path.dirname(os.path.abspath(__file__))


def daemonize():
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


class CustomHandler(http.server.SimpleHTTPRequestHandler):
    # 启用 HTTP/1.1：支持长连接，避免每个资源都重新三次握手
    protocol_version = "HTTP/1.1"
    # 空闲长连接的超时时间（秒），超时后自动关闭，防止线程被长期占用
    timeout = 30

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        super().end_headers()

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


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run the Aurora Notes development server.")
    parser.add_argument("--port", "-p", type=int, default=DEFAULT_PORT, help="port to listen on")
    parser.add_argument("--daemon", "-d", action="store_true", help="run in the background")
    args = parser.parse_args()

    if not 1 <= args.port <= 65535:
        parser.error("port must be between 1 and 65535")

    if args.daemon:
        daemonize()
    os.chdir(DIRECTORY)
    try:
        with ThreadingHTTPServer(("", args.port), CustomHandler) as httpd:
            print(f"Aurora Blog Server listening on http://localhost:{args.port}")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
        sys.exit(0)
