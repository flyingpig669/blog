#!/usr/bin/env sh
set -eu

run_with_node() {
  node_bin="$1"
  "$node_bin" scripts/generate-manifest.mjs
  exec "$node_bin" server.mjs
}

if [ -n "${NODE:-}" ] && [ -x "$NODE" ]; then
  run_with_node "$NODE"
fi

if command -v node >/dev/null 2>&1; then
  run_with_node "$(command -v node)"
fi

for candidate in \
  "/Applications/Codex.app/Contents/Resources/node" \
  "/opt/homebrew/bin/node" \
  "/usr/local/bin/node"
do
  if [ -x "$candidate" ]; then
    run_with_node "$candidate"
  fi
done

echo "Node.js not found. Install Node.js, or set NODE=/path/to/node and rerun." >&2
exit 1
