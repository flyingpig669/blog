#!/usr/bin/env bash
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$DIR"
echo "========================================="
echo "  Aurora Blog (极光随笔) 启动中..."
echo "  访问地址: http://localhost:8900"
echo "========================================="
python3 server.py "$@"