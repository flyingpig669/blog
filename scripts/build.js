const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const python = process.env.AURORA_PYTHON || (fs.existsSync(path.join(root, '.venv/bin/python')) ? path.join(root, '.venv/bin/python') : 'python3');
for (const [command, args] of [[python, ['sync_posts.py']], [process.execPath, ['scripts/build-vendor.js']], ['npm', ['run', 'build:css']], [process.execPath, ['scripts/validate-content.js']]]) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
