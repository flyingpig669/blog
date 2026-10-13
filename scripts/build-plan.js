// Shared plan for CLI builds and the development watcher.
function buildPlan(changed) {
  if (!Array.isArray(changed)) return { content: true, css: true, vendor: true, validate: true };
  const full = changed.some(name => ['package.json', 'package-lock.json', 'sync_posts.py', 'lib/frontmatter.py', 'lib/office_preview.py', 'blog.config.js', 'js/lib/routes.js'].includes(name) || name.startsWith('scripts/'));
  if (full) return buildPlan();
  const content = changed.some(name => /\.(docx?|pptx?)$/i.test(name) || (/\.(md|markdown)$/.test(name) && !name.startsWith('templates/') && !['README.md', 'AGENTS.md'].includes(name)));
  const css = changed.some(name => /\.(js|html|css|md|markdown)$/.test(name));
  return { content, css, vendor: false, validate: content || css };
}
module.exports = { buildPlan };
