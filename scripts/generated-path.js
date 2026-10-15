const path = require('node:path');
const root = path.resolve(__dirname, '..');
const generatedFiles = new Set(['js/posts-data.js', 'css/utilities.css', 'vendor/purify.min.js', 'sitemap.xml']);
function resourcePath(name) {
  const generated = generatedFiles.has(name) || name.startsWith('data/') || name === 'js/vue' || name.startsWith('js/vue/');
  return path.join(generated && process.env.AURORA_OUTPUT_DIR ? path.resolve(process.env.AURORA_OUTPUT_DIR) : root, name);
}
module.exports = { resourcePath };
