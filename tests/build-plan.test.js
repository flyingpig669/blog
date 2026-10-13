const test = require('node:test');
const assert = require('node:assert/strict');
const { buildPlan } = require('../scripts/build-plan');
test('preview rebuilds only the required stages', () => {
  assert.deepEqual(buildPlan(['posts/article.md']), {content: true, css: true, vendor: false, validate: true});
  assert.deepEqual(buildPlan(['js/components/post-item.js']), {content: false, css: true, vendor: false, validate: true});
  assert.deepEqual(buildPlan(['css/main.css']), {content: false, css: true, vendor: false, validate: true});
  assert.deepEqual(buildPlan(['attachments/demo.pdf']), {content: false, css: false, vendor: false, validate: false});
  assert.deepEqual(buildPlan(['blog.config.js']), buildPlan());
  assert.deepEqual(buildPlan(['lib/frontmatter.py']), buildPlan());
  assert.deepEqual(buildPlan(['attachments/课件.PPTX']), {content: true, css: false, vendor: false, validate: true});
  assert.deepEqual(buildPlan(['attachments/讲义.doc']), {content: true, css: false, vendor: false, validate: true});
  assert.deepEqual(buildPlan(['lib/office_preview.py']), buildPlan());
});
