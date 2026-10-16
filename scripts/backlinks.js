const path=require('node:path');
const marked=require('../vendor/marked.min.js');
function outgoingLinks(content, sourcePath, resolveLink) {
  const targets=new Set();
  function resolve(key,relative=false) {
    key=key.split('|')[0].trim();
    if (key.startsWith('#') || /^(?:https?:|mailto:|tel:)/i.test(key)) return;
    key=key.split('#')[0];
    const target=relative && !/^\/?posts\//i.test(key) && !key.startsWith('/')
      ? path.posix.normalize(path.posix.join(path.posix.dirname(sourcePath),key)) : key;
    const hit=resolveLink(target);
    if (hit?.slug) targets.add(hit.slug);
  }
  function walk(tokens) {
    for (const token of tokens || []) {
      if (['code','codespan','html'].includes(token.type)) continue;
      if (token.type==='link' && /\.(?:md|markdown)(?:#|$)/i.test(token.href)) resolve(token.href,true);
      if (token.type==='text') for (const match of (token.text || '').matchAll(/\[\[([^\]]+)\]\]/g)) resolve(match[1]);
      if (token.tokens) walk(token.tokens);
      for (const item of token.items || []) walk(item.tokens);
      if (token.type==='table') for (const cell of [...token.header,...token.rows.flat()]) walk(cell.tokens);
    }
  }
  walk(marked.lexer(content));
  return [...targets];
}
module.exports={outgoingLinks};
