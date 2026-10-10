const fs = require('node:fs');
const path = require('node:path');
const entry = require.resolve('dompurify');
fs.copyFileSync(path.join(path.dirname(entry), 'purify.min.js'), 'vendor/purify.min.js');
