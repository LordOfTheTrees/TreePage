const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { state, reset, loadHandler, post } = require('./helpers');

const configured = () => {
  process.env.RESEND_API_KEY = 'k';
  process.env.CONTACT_EMAIL = 'owner@example.com';
  process.env.SUPABASE_URL = 'http://supabase.test';
  process.env.SUPABASE_ANON_KEY = 'anon';
};

const contactMsg = { name: 'A', email: 'a@example.com', message: 'hello' };

describe('send-contact', () => {
  let handler;
  beforeEach(() => { reset(); configured(); handler = loadHandler('netlify/functions/send-contact.js'); });

  test('valid submission sends one email and records it', async () => {
    const r = await handler(post(contactMsg));
    assert.equal(r.statusCode, 200);
    assert.equal(state.sent.length, 1);
    assert.equal(state.sent[0].replyTo, 'a@example.com');
    assert.deepEqual(state.inserted.map((x) => x.endpoint), ['send-contact']);
  });

  test('honeypot filled: 200 success, no email, nothing recorded', async () => {
    const r = await handler(post({ ...contactMsg, website: 'http://spam' }));
    assert.equal(r.statusCode, 200);
    assert.equal(JSON.parse(r.body).success, true);
    assert.equal(state.sent.length, 0);
    assert.equal(state.inserted.length, 0);
  });

  test('empty or omitted honeypot passes', async () => {
    assert.equal((await handler(post({ ...contactMsg, website: '' }))).statusCode, 200);
    assert.equal((await handler(post(contactMsg))).statusCode, 200);
    assert.equal(state.sent.length, 2);
  });

  test('length caps: 5000 accepted, 5001 rejected naming field and limit', async () => {
    assert.equal((await handler(post({ ...contactMsg, message: 'x'.repeat(5000) }))).statusCode, 200);
    const r = await handler(post({ ...contactMsg, message: 'x'.repeat(5001) }));
    assert.equal(r.statusCode, 400);
    assert.match(JSON.parse(r.body).error, /Message must be 5000/);
    assert.equal((await handler(post({ ...contactMsg, name: 'x'.repeat(101) }))).statusCode, 400);
    assert.equal((await handler(post({ ...contactMsg, subject: 'x'.repeat(201) }))).statusCode, 400);
    assert.equal(state.sent.length, 1);
  });

  test('oversized raw body: 413 before parsing', async () => {
    const r = await handler({ httpMethod: 'POST', headers: {}, body: 'x'.repeat(64 * 1024 + 1) });
    assert.equal(r.statusCode, 413);
    assert.equal(state.sent.length, 0);
  });

  test('method and body handling', async () => {
    assert.equal((await handler({ httpMethod: 'OPTIONS', headers: {}, body: '' })).statusCode, 200);
    assert.equal((await handler({ httpMethod: 'GET', headers: {}, body: null })).statusCode, 405);
    assert.equal((await handler({ httpMethod: 'POST', headers: {}, body: '{oops' })).statusCode, 400);
    assert.equal((await handler(post({ name: 'A', email: 'a@x.com' }))).statusCode, 400);
    assert.equal((await handler(post({ name: 123, email: {}, message: ['x'] }))).statusCode, 400);
  });

  test('never leaks a Resend error to the client, and records nothing', async () => {
    state.resendThrows = true;
    const r = await handler(post(contactMsg));
    assert.equal(r.statusCode, 500);
    assert.equal(JSON.parse(r.body).error, 'Failed to send message');
    assert.equal(state.inserted.length, 0, 'a failed send must not count against the budget');
  });
});

describe('send-contact: send budget', () => {
  let handler;
  beforeEach(() => { reset(); configured(); handler = loadHandler('netlify/functions/send-contact.js'); });

  test('under budget proceeds', async () => {
    state.counts.form_send_log = 9;
    assert.equal((await handler(post(contactMsg))).statusCode, 200);
    assert.equal(state.sent.length, 1);
  });

  test('at hourly cap: 429 with Retry-After, no email, nothing recorded', async () => {
    state.counts.form_send_log = 10;
    const r = await handler(post(contactMsg));
    assert.equal(r.statusCode, 429);
    assert.equal(r.headers['Retry-After'], '3600');
    assert.match(JSON.parse(r.body).error, /try again later/i);
    assert.equal(state.sent.length, 0);
    assert.equal(state.inserted.length, 0);
  });

  test('budget is checked after honeypot and length caps', async () => {
    state.counts.form_send_log = 999;
    assert.equal((await handler(post({ ...contactMsg, website: 'bot' }))).statusCode, 200);
    assert.equal((await handler(post({ ...contactMsg, message: 'x'.repeat(5001) }))).statusCode, 400);
    assert.equal(state.sent.length, 0);
  });

  test('FAILS OPEN when the count query errors', async () => {
    state.counts.form_send_log = 999;
    state.countError = { message: 'db down' };
    assert.equal((await handler(post(contactMsg))).statusCode, 200);
    assert.equal(state.sent.length, 1);
  });

  test('FAILS OPEN when the client throws', async () => {
    state.throwOnQuery = true;
    assert.equal((await handler(post(contactMsg))).statusCode, 200);
    assert.equal(state.sent.length, 1);
  });

  test('FAILS OPEN when Supabase is unconfigured', async () => {
    delete process.env.SUPABASE_URL;
    const fresh = loadHandler('netlify/functions/send-contact.js');
    assert.equal((await fresh(post(contactMsg))).statusCode, 200);
    assert.equal(state.sent.length, 1);
  });

  test('a failed record write does not fail the request', async () => {
    state.throwOnInsert = true;
    assert.equal((await handler(post(contactMsg))).statusCode, 200);
    assert.equal(state.sent.length, 1);
  });
});

describe('send-feedback', () => {
  let handler;
  beforeEach(() => { reset(); configured(); handler = loadHandler('netlify/functions/send-feedback.js'); });

  test('valid submission resolves labels and records the send', async () => {
    const r = await handler(post({ topic: 'what', action: 'keep', message: 'nice' }));
    assert.equal(r.statusCode, 200);
    assert.match(state.sent[0].subject, /What I do/);
    assert.match(state.sent[0].text, /Keep doing/);
    assert.deepEqual(state.inserted.map((x) => x.endpoint), ['send-feedback']);
  });

  test('unknown topic or action falls back to a fixed label', async () => {
    await handler(post({ topic: '<script>', action: 'zzz', message: 'x' }));
    assert.match(state.sent[0].subject, /Not specified/);
    assert.match(state.sent[0].text, /Suggested action: Not specified/);
  });

  test('honeypot and length cap', async () => {
    assert.equal((await handler(post({ message: 'spam', website: 'x' }))).statusCode, 200);
    assert.equal((await handler(post({ message: 'x'.repeat(5001) }))).statusCode, 400);
    assert.equal(state.sent.length, 0);
  });

  test('missing message rejected', async () => {
    assert.equal((await handler(post({ topic: 'what' }))).statusCode, 400);
  });
});
