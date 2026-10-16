import fs from 'node:fs';
import { createRequire } from 'node:module';
import { store } from '../src/lib/store.js';
const require=createRequire(import.meta.url), {resourcePath}=require('./generated-path');
const {outgoingLinks}=require('./backlinks');
store.init(JSON.parse(fs.readFileSync(resourcePath('data/index.json'),'utf8')));
const incoming={};
for (const doc of Object.values(store.documents)) {
  const body=JSON.parse(fs.readFileSync(resourcePath(doc.bodyUrl),'utf8'));
  for (const target of outgoingLinks(body.content || '',doc.sourcePath,store.resolveLink.bind(store))) {
    if(target!==doc.slug) (incoming[target] ||= []).push(doc.slug);
  }
}
const output=resourcePath('data/relations.json'), text=JSON.stringify(incoming)+'\n';
if (!fs.existsSync(output) || fs.readFileSync(output,'utf8')!==text) fs.writeFileSync(output,text);
console.log('Article backlinks compiled.');
