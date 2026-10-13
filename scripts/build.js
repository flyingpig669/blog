const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
if (process.argv.includes('--preview')) process.env.AURORA_OUTPUT_DIR = path.join(root, '.cache/preview');
const { resourcePath } = require('./generated-path');
const { buildPlan } = require('./build-plan');
const changedIndex = process.argv.indexOf('--changed');
let plan = buildPlan(changedIndex === -1 ? undefined : JSON.parse(process.argv[changedIndex + 1]));
if (['js/posts-data.js', 'css/utilities.css', 'vendor/purify.min.js'].some(name => !fs.existsSync(resourcePath(name)))) plan = buildPlan();
fs.mkdirSync(path.dirname(resourcePath('css/utilities.css')), { recursive: true });
const python = process.env.AURORA_PYTHON || (fs.existsSync(path.join(root, '.venv/bin/python')) ? path.join(root, '.venv/bin/python') : 'python3');
const tasks = [];
if (plan.content) tasks.push([python, ['sync_posts.py']]);
if (plan.vendor) tasks.push([process.execPath, ['scripts/build-vendor.js']]);
if (plan.css) tasks.push(['npm', ['exec', '--', 'tailwindcss', '-i', 'styles/utilities.css', '-o', resourcePath('css/utilities.css'), '--minify']]);
if (plan.validate) tasks.push([process.execPath, ['scripts/validate-content.js']]);
console.log('Build steps: ' + Object.keys(plan).filter(name => plan[name]).join(', '));
for (const [command, args] of tasks) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
