// One publication whitelist for local builds and CI. Never copy source directories.
const fs = require('node:fs');
const path = require('node:path');
const {resourcePath} = require('./generated-path');
const root = path.resolve(__dirname, '..');
const output = path.join(root, '_site');
fs.rmSync(output, {recursive:true, force:true});
fs.mkdirSync(output, {recursive:true});
for (const file of ['index.html','robots.txt','404.html','og-image.png','CNAME','sitemap.xml']) {
  const source = resourcePath(file);
  if (fs.existsSync(source)) fs.copyFileSync(source, path.join(output,file));
}
for (const directory of ['vendor','attachments']) {
  fs.cpSync(path.join(root,directory),path.join(output,directory),{recursive:true});
}
fs.mkdirSync(path.join(output,'css'),{recursive:true});
fs.copyFileSync(resourcePath('css/main.css'),path.join(output,'css/main.css'));
for (const name of ['js/posts-data.js','css/utilities.css','js/vue','data']) {
  const target = path.join(output,name); fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.cpSync(resourcePath(name),target,{recursive:true});
}
// The configured domain takes precedence; project Pages deploy below /repo/.
const cname = path.join(root,'CNAME');
const repository = process.env.GITHUB_REPOSITORY || '';
const [owner,repo] = repository.split('/');
const customDomain = fs.existsSync(cname) && fs.readFileSync(cname,'utf8').trim();
const userSite = repo && repo.toLowerCase() === `${owner}.github.io`.toLowerCase();
const base = customDomain || !repo || userSite ? '/' : `/${repo}/`;
const notFound = path.join(output,'404.html');
fs.writeFileSync(notFound,fs.readFileSync(notFound,'utf8').replaceAll('__SITE_BASE__',base));
function validate(directory) {
  for (const entry of fs.readdirSync(directory,{withFileTypes:true})) {
    const name = path.join(directory,entry.name);
    if (entry.isDirectory()) validate(name);
    else if (/\.(?:vue|md|py|sh|ya?ml)$|\.test\.js$|^package.*\.json$/i.test(entry.name)) throw new Error('Source leaked into publication: ' + name);
  }
}
validate(output);
console.log('Static publication assembled: _site/');
