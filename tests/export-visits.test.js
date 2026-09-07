const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { state, reset, loadHandler } = require('./helpers');

const rows = (n) => Array.from({ length: n }, (_, i) => ({
  country: 'US', region: 'CT', city: 'New Haven',
  timestamp: new Date(Date.UTC(2025, 0, 1) + i * 3600000).toISOString()
}));

describe('export-visits', () => {
  let handler;
  beforeEach(() => {
    reset();
    process.env.SUPABASE_URL = 'http://supabase.test';
    process.env.SUPABASE_ANON_KEY = 'anon';
    handler = loadHandler('netlify/functions/export-visits.js');
  });

  for (const n of [10, 999, 1000, 1060, 5000, 1_000_000]) {
    test(`table of ${n}: exact total, bounded window, chronological, newest included`, async () => {
      state.rows = { visits: rows(n) };
      state.counts.visits = n;

      const r = await handler({ httpMethod: 'GET', headers: {} });
      const body = JSON.parse(r.body);

      assert.equal(r.statusCode, 200);
      assert.equal(body.total, n, 'total must come from the count query, not the window');
      assert.equal(body.returned, Math.min(n, 1000));
      assert.equal(body.visits.length, body.returned);
      assert.equal(body.windowSize, 1000);

      const chronological = body.visits.every((v, i, a) => i === 0 || a[i - 1].timestamp <= v.timestamp);
      assert.ok(chronological, 'window must be reversed back into ascending order');

      const newest = rows(n)[n - 1].timestamp;
      assert.equal(body.visits[body.visits.length - 1].timestamp, newest, 'window must track the newest rows');
    });
  }

  test('non-GET rejected', async () => {
    assert.equal((await handler({ httpMethod: 'POST', headers: {} })).statusCode, 405);
  });

  test('count error surfaces as 500 without leaking detail', async () => {
    state.countError = { message: 'boom' };
    const r = await handler({ httpMethod: 'GET', headers: {} });
    assert.equal(r.statusCode, 500);
    assert.equal(JSON.parse(r.body).error, 'Failed to export visits');
  });

  test('unconfigured Supabase is a 500, not a crash', async () => {
    delete process.env.SUPABASE_URL;
    const fresh = loadHandler('netlify/functions/export-visits.js');
    assert.equal((await fresh({ httpMethod: 'GET', headers: {} })).statusCode, 500);
  });
});
