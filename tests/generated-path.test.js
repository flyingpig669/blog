const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const {resourcePath} = require('../scripts/generated-path');
const root = path.resolve(__dirname,'..');

test('generated files stay in build cache while source paths stay in src', () => {
  const previous = process.env.AURORA_OUTPUT_DIR;
  delete process.env.AURORA_OUTPUT_DIR;
  try {
    for (const name of ['data/index.json','js/vue/app.js','data','data/documents/article.json','css/utilities.css','sitemap.xml']) {
      assert.equal(resourcePath(name),path.join(root,'.cache/build',name));
    }
    assert.equal(resourcePath('src/config/routes.js'),path.join(root,'src/config/routes.js'));
    assert.equal(resourcePath('css/main.css'),path.join(root,'src/styles/main.css'));
  } finally { if (previous === undefined) delete process.env.AURORA_OUTPUT_DIR; else process.env.AURORA_OUTPUT_DIR = previous; }
});

test('assembled site includes runtime bundles and excludes front-end source and obsolete copies', () => {
  const site = path.join(root,'_site');
  assert.ok(fs.existsSync(path.join(site,'js/vue/app.js')));
  assert.ok(fs.existsSync(path.join(site,'data/index.json')));
  assert.equal(JSON.parse(fs.readFileSync(path.join(site,'data/index.json'),'utf8')).schemaVersion,2);
  assert.equal(fs.existsSync(path.join(site,'js/posts-data.js')),false);
  assert.doesNotMatch(fs.readFileSync(path.join(site,'index.html'),'utf8'),/posts-data\.js/);
  for (const name of ['src','js/lib','js/store.js','src/config/blog.config.js','vendor/purify.min.js']) assert.equal(fs.existsSync(path.join(site,name)),false,name);
  assert.equal(fs.existsSync(path.join(root,'js')),false);
  assert.equal(fs.existsSync(path.join(root,'data')),false);
  assert.doesNotMatch(fs.readFileSync(path.join(site,'404.html'),'utf8'),/__SITE_BASE__/);
});
