const test = require('node:test');
const assert = require('node:assert/strict');
let dates;
test.before(async () => { dates = await import('../src/lib/dates.js'); });

test('minute timestamps use UTC+08:00 regardless of browser timezone or separator', () => {
  const expected = Date.parse('2026-10-26T01:30:00Z');
  assert.equal(dates.contentTimestamp('2026-10-26 09:30'), expected);
  assert.equal(dates.contentTimestamp('2026-10-26T09:30'), expected);
  assert.equal(dates.contentTimestamp('2026-10-26'), Date.parse('2026-10-25T16:00:00Z'));
  assert.equal(dates.contentTimestamp('bad'), null);
  assert.equal(dates.contentTimestamp('2026-10-26 24:00'), null);
});

test('display and machine-readable dates preserve minute precision and legacy dates', () => {
  assert.equal(dates.updatedText('2026-10-26T09:30'), '2026-10-26 09:30');
  assert.equal(dates.updatedDateTime('2026-10-26 09:30'), '2026-10-26T09:30:00+08:00');
  assert.equal(dates.updatedText('2026-10-26'), '2026-10-26');
  assert.equal(dates.updatedDateTime('2026-10-26'), '2026-10-26');
});
