const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { resourcePath } = require('./generated-path');
const output = resourcePath('css/utilities.css');
fs.mkdirSync(path.dirname(output), { recursive: true });
const result = spawnSync('npm', ['exec', '--', 'tailwindcss', '-i', 'src/styles/utilities.css', '-o', output, '--minify'], { stdio: 'inherit' });
if (result.error) throw result.error;
process.exit(result.status || 0);
