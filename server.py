#!/usr/bin/env python3
import http.server
import socketserver
import os
import sys

PORT = 18888
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
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        super().end_headers()


if __name__ == "__main__":
    if "--daemon" in sys.argv or "-d" in sys.argv:
        daemonize()
    os.chdir(DIRECTORY)
    socketserver.TCPServer.allow_reuse_address = True
    print(f"Aurora Blog Server listening on http://localhost:{PORT}")
    try:
        with socketserver.TCPServer(("", PORT), CustomHandler) as httpd:
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
        sys.exit(0)
