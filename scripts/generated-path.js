const path = require('node:path');
const root = path.resolve(__dirname, '..');
const generatedFiles = new Set(['js/posts-data.js', 'css/utilities.css', 'sitemap.xml']);
function resourcePath(name) {
  const generated = generatedFiles.has(name) || name === 'data' || name.startsWith('data/') || name === 'js/vue' || name.startsWith('js/vue/');
  const output = path.resolve(process.env.AURORA_OUTPUT_DIR || path.join(root, '.cache/build'));
  return path.join(generated ? output : root, name);
}
module.exports = { resourcePath };
