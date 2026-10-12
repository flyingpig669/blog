const fs = require('node:fs');
const path = require('node:path');
const entry = require.resolve('dompurify');
const { resourcePath } = require('./generated-path');
const target = resourcePath('vendor/purify.min.js');
fs.mkdirSync(path.dirname(target), { recursive: true });
const content = fs.readFileSync(path.join(path.dirname(entry), 'purify.min.js'));
if (!fs.existsSync(target) || !fs.readFileSync(target).equals(content)) fs.writeFileSync(target, content);
