const test = require('node:test');
const assert = require('node:assert/strict');
const { buildPlan } = require('../scripts/build-plan');
test('attachment updates regenerate file metadata and references',()=>{
  assert.deepEqual(buildPlan(['attachments/files/讲义.pdf']),{content:true,css:false,app:false,validate:true});
});
test('preview rebuilds only the required stages', () => {
  assert.deepEqual(buildPlan(['posts/article.md']), {content: true, css: true, app: false, validate: true});
  assert.deepEqual(buildPlan(['src/components/PostItem.vue']), {content: false, css: true, app: true, validate: true});
  assert.deepEqual(buildPlan(['src/styles/main.css']), {content: false, css: true, app: false, validate: true});
  assert.deepEqual(buildPlan(['attachments/demo.pdf']), {content: true, css: false, app: false, validate: true});
  assert.deepEqual(buildPlan(['src/config/blog.config.js']), buildPlan());
  assert.deepEqual(buildPlan(['scripts/python/lib/frontmatter.py']), buildPlan());
  assert.deepEqual(buildPlan(['attachments/课件.PPTX']), {content: true, css: false, app: false, validate: true});
  assert.deepEqual(buildPlan(['attachments/讲义.doc']), {content: true, css: false, app: false, validate: true});
  assert.deepEqual(buildPlan(['scripts/python/lib/office_preview.py']), buildPlan());
});
