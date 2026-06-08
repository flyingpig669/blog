#!/usr/bin/env sh
set -eu

if [ -n "${NODE:-}" ] && [ -x "$NODE" ]; then
  exec "$NODE" server.mjs
fi

if command -v node >/dev/null 2>&1; then
  exec node server.mjs
fi

for candidate in \
  "/Applications/Codex.app/Contents/Resources/node" \
  "/opt/homebrew/bin/node" \
  "/usr/local/bin/node"
do
  if [ -x "$candidate" ]; then
    exec "$candidate" server.mjs
  fi
done

echo "Node.js not found. Install Node.js, or set NODE=/path/to/node and rerun." >&2
exit 1
