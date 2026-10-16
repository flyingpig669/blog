// Shared plan for CLI builds and the development watcher.
function buildPlan(changed) {
  if (!Array.isArray(changed)) return { content: true, css: true, app: true, validate: true };
  const full = changed.some(name => ['package.json', 'package-lock.json', 'sync_posts.py', 'lib/frontmatter.py', 'lib/office_preview.py', 'blog.config.js', 'src/lib/routes.js'].includes(name) || name.startsWith('scripts/'));
  if (full) return buildPlan();
  const content = changed.some(name => /\.(docx?|pptx?)$/i.test(name) || (/\.(md|markdown)$/.test(name) && !name.startsWith('templates/') && !['README.md', 'AGENTS.md'].includes(name)));
  const css = changed.some(name => /\.(js|vue|html|css|md|markdown)$/.test(name));
  const app = changed.some(name => name.startsWith('src/') && /\.(js|vue)$/.test(name));
  return { content, css, app, validate: content || css || app };
}
module.exports = { buildPlan };
