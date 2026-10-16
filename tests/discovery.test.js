const test=require('node:test'),assert=require('node:assert/strict');
const {outgoingLinks}=require('../scripts/backlinks');
test('backlinks resolve wiki and relative Markdown references but exclude examples',()=>{
  const refs={'target':{slug:'target'},'posts/other.md':{slug:'other'}};
  assert.deepEqual(outgoingLinks('[[target|标题]] [[target#section]]\n[other](../other.md)\n`[[fake]]`\n```md\n[[fake]]\n```','posts/group/current.md',key=>refs[key]),['target','other']);
});
test('relative references use the source directory even if a global basename matches',()=>{
  const refs={'other.md':{slug:'wrong'},'posts/group/other.md':{slug:'correct'}};
  assert.deepEqual(outgoingLinks('[other](./other.md)','posts/group/current.md',key=>refs[key]),['correct']);
});
test('related articles rank shared topics and avoid duplicating chapter navigation',async()=>{
  const {relatedPosts}=await import('../src/lib/related.js');
  const post={slug:'a',column:'book',tags:['Git','工具']};
  const candidates=[post,{slug:'b',column:'book',tags:['Git','工具']},{slug:'c',tags:['Git'],date:'2026-01-02'},{slug:'d',tags:['Git','工具'],date:'2026-01-01'},{slug:'e',tags:['其他']}];
  assert.deepEqual(relatedPosts(post,candidates).map(p=>p.slug),['d','c']);
});
test('subscription output and backlink graph are included in the static publication',()=>{
  const fs=require('node:fs');
  assert.match(fs.readFileSync('_site/feed.xml','utf8'),/<rss version="2.0">/);
  assert.equal(typeof JSON.parse(fs.readFileSync('_site/data/relations.json','utf8')),'object');
});
