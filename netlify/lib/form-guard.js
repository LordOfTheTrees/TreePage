// Shared request handling and abuse guards for the two email-sending functions.
// Lives outside netlify/functions/ so the bundler treats it as a dependency,
// never as a function of its own.

const { createClient } = require('@supabase/supabase-js');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const JSON_HEADERS = { ...CORS_HEADERS, 'Content-Type': 'application/json' };

// Reject oversized payloads before spending anything on parsing them. Nothing
// upstream enforces a size; Resend accepts far larger bodies and the only other
// ceiling is Netlify's ~6MB request limit.
const MAX_BODY_BYTES = 64 * 1024;

// A field hidden from humans that automated form fillers populate. The name
// must match the input in the page templates and the payload key in main.js.
const HONEYPOT_FIELD = 'website';

// Global send budget, shared by everyone, per endpoint. Deliberately NOT
// per-visitor: a per-IP limit would require storing an identifier, which the
// site's privacy position rules out (docs/analytics.md). Counting total sends
// needs no identifier at all.
//
// Both endpoints together stay under Resend's free-tier daily allowance, so a
// flood exhausts this budget, which costs nothing and recovers on its own,
// rather than the upstream quota, which would silently break sending for the
// rest of the day. Tune freely.
const MAX_SENDS_PER_HOUR = 10;
const MAX_SENDS_PER_DAY = 40;
const SEND_LOG_RETENTION_DAYS = 7;

const jsonResponse = (statusCode, payload, extraHeaders = {}) => ({
  statusCode,
  headers: { ...JSON_HEADERS, ...extraHeaders },
  body: JSON.stringify(payload)
});

const fail = (statusCode, error) => jsonResponse(statusCode, { error });

// One client per warm container rather than one per request.
let supabase = null;
function getSupabase() {
  if (supabase) return supabase;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  supabase = createClient(url, key);
  return supabase;
}

// Handles everything before the body matters: preflight, method, size.
// Returns a response to send immediately, or null to continue.
function rejectEarly(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return fail(405, 'Method not allowed');
  }
  if (event.body && Buffer.byteLength(event.body, 'utf8') > MAX_BODY_BYTES) {
    return fail(413, 'Request body is too large');
  }
  return null;
}

function getResendConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const contactEmail = process.env.CONTACT_EMAIL;
  if (!apiKey || !contactEmail) {
    console.error('Missing env vars - RESEND_API_KEY:', !!apiKey, 'CONTACT_EMAIL:', !!contactEmail);
    return null;
  }
  return { apiKey, contactEmail };
}

// Parses the JSON body. Returns { body } or { response } to send instead.
function parseBody(event) {
  try {
    return { body: JSON.parse(event.body) };
  } catch {
    return { response: fail(400, 'Invalid request body') };
  }
}

function isHoneypotTripped(body) {
  const value = body[HONEYPOT_FIELD];
  return typeof value === 'string' && value.trim() !== '';
}

// A filled honeypot gets a normal success response so the caller learns
// nothing it could adapt to. No email is sent.
function honeypotResponse(endpoint) {
  console.warn(`Honeypot triggered on ${endpoint}; discarding submission.`);
  return jsonResponse(200, { success: true });
}

// Coerces any incoming value to a trimmed string, so a non-string is a clean
// validation failure rather than a type error.
const asText = (value) => (typeof value === 'string' ? value.trim() : '');

// fields: array of [label, value, max]. Returns a 400 response for the first
// field over its cap, or null.
function rejectTooLong(fields) {
  const over = fields.find(([, value, max]) => value.length > max);
  if (!over) return null;
  const [label, , max] = over;
  return fail(400, `${label} must be ${max} characters or fewer`);
}

// Counts sends in the trailing windows for this endpoint. Returns a 429
// response when the budget is spent, or null to proceed.
//
// Fails OPEN on any error. A rate limiter that breaks must not take the
// contact form down with it; losing the cap is a far smaller problem than
// silently rejecting real messages.
async function rejectOverBudget(endpoint) {
  const client = getSupabase();
  if (!client) {
    console.warn('Supabase not configured; send budget not enforced.');
    return null;
  }

  const now = Date.now();
  const windows = [
    { label: 'hour', ms: 60 * 60 * 1000, max: MAX_SENDS_PER_HOUR },
    { label: 'day', ms: 24 * 60 * 60 * 1000, max: MAX_SENDS_PER_DAY }
  ];

  try {
    for (const window of windows) {
      const { count, error } = await client
        .from('form_send_log')
        .select('*', { count: 'exact', head: true })
        .eq('endpoint', endpoint)
        .gte('created_at', new Date(now - window.ms).toISOString());

      if (error) {
        console.error('Send budget check failed; allowing send:', error.message);
        return null;
      }

      if ((count || 0) >= window.max) {
        console.warn(`Send budget exhausted for ${endpoint}: ${count} in the last ${window.label}.`);
        return jsonResponse(
          429,
          { error: 'This form has reached its limit for now. Please try again later.' },
          { 'Retry-After': String(window.ms / 1000) }
        );
      }
    }
  } catch (err) {
    console.error('Send budget check threw; allowing send:', err.message);
  }
  return null;
}

// Records a send against the budget and prunes old rows. Never throws: by the
// time this runs the mail has already gone, so a failed write costs a slot of
// accounting, not a delivered message.
async function recordSend(endpoint) {
  const client = getSupabase();
  if (!client) return;

  try {
    await client.from('form_send_log').insert([{ endpoint }]);
    const cutoff = new Date(Date.now() - SEND_LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000);
    await client.from('form_send_log').delete().lt('created_at', cutoff.toISOString());
  } catch (err) {
    console.error('Failed to record send against budget:', err.message);
  }
}

module.exports = {
  HONEYPOT_FIELD,
  MAX_BODY_BYTES,
  MAX_SENDS_PER_HOUR,
  MAX_SENDS_PER_DAY,
  jsonResponse,
  fail,
  rejectEarly,
  getResendConfig,
  parseBody,
  isHoneypotTripped,
  honeypotResponse,
  asText,
  rejectTooLong,
  rejectOverBudget,
  recordSend
};
