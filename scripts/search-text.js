// Read a document map on stdin; emit searchable text without Markdown scaffolding.
const marked = require('../vendor/marked.min.js');
let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { input += chunk; });
function text(tokens) {
  return tokens.map(token => {
    if (token.type === 'html') return '';
    if (token.type === 'table') return [...token.header, ...token.rows.flat()].map(cell => text(cell.tokens || [])).join(' ');
    if (token.items) return token.items.map(item => text(item.tokens || [])).join(' ');
    if (token.tokens) return text(token.tokens);
    if (token.type === 'code' || token.type === 'codespan') return token.text || '';
    return (token.text || '').replace(/^:::\s*(?:(?:slide|pdf|deck)\s+[^\n]*|(?:tip|warning|note|danger)[^\n]*)?(?:\n|$)/gm, '');
  }).join(' ');
}
process.stdin.on('end', () => {
  const documents = JSON.parse(input);
  for (const slug of Object.keys(documents)) {
    documents[slug] = text(marked.lexer(documents[slug]))
      .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, key, label) => label || key)
      .replace(/\$\$|\\\(|\\\)/g, '')
      .replace(/\s+/g, ' ').trim();
  }
  process.stdout.write(JSON.stringify(documents));
});
