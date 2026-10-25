const path = require('node:path');
const root = path.resolve(__dirname, '..');
const generatedFiles = new Set(['data/index.json', 'css/utilities.css', 'sitemap.xml']);
function resourcePath(name) {
  if (name === 'css/main.css') return path.join(root, 'src/styles/main.css');
  const generated = generatedFiles.has(name) || name === 'data' || name.startsWith('data/') || name === 'js/vue' || name.startsWith('js/vue/');
  const output = path.resolve(process.env.AURORA_OUTPUT_DIR || path.join(root, '.cache/build'));
  return path.join(generated ? output : root, name);
}
module.exports = { resourcePath };
