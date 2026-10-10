#!/usr/bin/env bash

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$PROJECT_DIR"
PYTHON="${AURORA_PYTHON:-python3}"
if [ -x "$PROJECT_DIR/.venv/bin/python" ]; then PYTHON="$PROJECT_DIR/.venv/bin/python"; fi

# 先重建索引：js/posts-data.js 由 sync_posts.py 生成，
# 放在语法检查之前才能把「生成结果」也纳入校验（顺序颠倒会漏掉坏索引）。
echo "[1/6] Rebuilding the content index..."
AURORA_PYTHON="$PYTHON" npm run build

echo "[2/6] Checking JavaScript syntax..."
for file in blog.config.js tailwind.config.js scripts/*.js js/*.js js/components/*.js js/lib/*.js; do
  node --check "$file"
done

echo "[3/6] Checking Python syntax..."
"$PYTHON" -c 'import ast, pathlib; [ast.parse(path.read_text(encoding="utf-8"), filename=str(path)) for path in pathlib.Path(".").rglob("*.py") if not any(part.startswith(".") or part == "node_modules" for part in path.parts)]'

echo "[4/6] Checking shell syntax..."
bash -n run.sh deploy.sh check.sh

echo "[5/6] Running JavaScript tests..."
node --test tests/*.test.js

echo "[6/6] Running Python tests..."
"$PYTHON" -m unittest discover -s tests -p 'test_*.py'

echo "Project checks passed."
