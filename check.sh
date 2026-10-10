#!/usr/bin/env bash

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$PROJECT_DIR"

# 先重建索引：js/posts-data.js 由 sync_posts.py 生成，
# 放在语法检查之前才能把「生成结果」也纳入校验（顺序颠倒会漏掉坏索引）。
echo "[1/4] Rebuilding the content index..."
python3 sync_posts.py

echo "[2/4] Checking JavaScript syntax..."
for file in blog.config.js js/*.js; do
  node --check "$file"
done

echo "[3/4] Checking Python syntax..."
python3 -c 'import ast, pathlib; [ast.parse(path.read_text(encoding="utf-8"), filename=str(path)) for path in map(pathlib.Path, ("server.py", "sync_posts.py"))]'

echo "[4/4] Checking shell syntax..."
bash -n run.sh deploy.sh check.sh

echo "Project checks passed."
