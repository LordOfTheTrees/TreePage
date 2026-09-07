const { Resend } = require('resend');
const { createClient } = require('@supabase/supabase-js');

const TOPICS = {
  what: 'What I do',
  how: 'How I do it',
  seem: 'How I seem',
  other: 'Other'
};

const ACTIONS = {
  start: 'Start doing',
  stop: 'Stop doing',
  keep: 'Keep doing',
  other: 'Other'
};

// Field length caps. Resend accepts far larger payloads, so nothing upstream
// rejects an oversized submission — the ceiling is Netlify's ~6MB request body.
const MAX_MESSAGE = 5000;
const MAX_BODY_BYTES = 64 * 1024;

// Honeypot: a field hidden from humans that automated form fillers populate.
// Kept in sync with the input in pages/feedback.md.
const HONEYPOT_FIELD = 'website';

// Global send budget, shared by everyone. Deliberately NOT per-visitor: a
// per-IP limit would require storing an identifier, which the site's privacy
// position rules out (see docs/analytics.md). This caps total sends instead.
//
// Both endpoints together stay under Resend's free-tier daily allowance, so a
// flood exhausts this budget - which costs nothing and recovers on its own -
// rather than the upstream quota, which would silently break sending for the
// rest of the day. Tune freely; these are not load-bearing.
const MAX_SENDS_PER_HOUR = 10;
const MAX_SENDS_PER_DAY = 40;

// Counts sends in the trailing window for this endpoint. Returns null when the
// send is allowed, or a retry hint when it is not.
//
// Fails OPEN on any error. A rate limiter that breaks must not take the
// contact form down with it; losing the cap is a far smaller problem than
// silently rejecting real messages.
async function checkSendBudget(endpoint) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase not configured; send budget not enforced.');
    return null;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const now = Date.now();

    const windows = [
      { label: 'hour', since: new Date(now - 60 * 60 * 1000), max: MAX_SENDS_PER_HOUR, retryAfter: 3600 },
      { label: 'day', since: new Date(now - 24 * 60 * 60 * 1000), max: MAX_SENDS_PER_DAY, retryAfter: 86400 }
    ];

    for (const window of windows) {
      const { count, error } = await supabase
        .from('form_send_log')
        .select('*', { count: 'exact', head: true })
        .eq('endpoint', endpoint)
        .gte('created_at', window.since.toISOString());

      if (error) {
        console.error('Send budget check failed; allowing send:', error.message);
        return null;
      }

      if ((count || 0) >= window.max) {
        console.warn(`Send budget exhausted for ${endpoint}: ${count} in the last ${window.label}.`);
        return { retryAfter: window.retryAfter };
      }
    }

    return null;
  } catch (err) {
    console.error('Send budget check threw; allowing send:', err.message);
    return null;
  }
}

// Records a send against the budget. Never throws: a failed write costs a slot
// of accounting, not a delivered message.
async function recordSend(endpoint) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return;

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    await supabase.from('form_send_log').insert([{ endpoint }]);
    // Opportunistic prune so the table stays small. Failure is harmless.
    await supabase
      .from('form_send_log')
      .delete()
      .lt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
  } catch (err) {
    console.error('Failed to record send against budget:', err.message);
  }
}


exports.handler = async (event) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };
  const fail = (statusCode, error) => ({
    statusCode,
    headers: jsonHeaders,
    body: JSON.stringify({ error })
  });

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return fail(405, 'Method not allowed');
  }

  // Reject oversized payloads before spending anything on parsing them.
  if (event.body && Buffer.byteLength(event.body, 'utf8') > MAX_BODY_BYTES) {
    return fail(413, 'Request body is too large');
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const contactEmail = process.env.CONTACT_EMAIL;

  if (!resendApiKey || !contactEmail) {
    console.error('Missing env vars — RESEND_API_KEY:', !!resendApiKey, 'CONTACT_EMAIL:', !!contactEmail);
    return fail(500, 'Email service is not configured');
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return fail(400, 'Invalid request body');
  }

  // A filled honeypot means an automated submission. Report success so the
  // caller learns nothing, and send no email.
  if (typeof body[HONEYPOT_FIELD] === 'string' && body[HONEYPOT_FIELD].trim() !== '') {
    console.warn('Honeypot triggered on send-feedback; discarding submission.');
    return { statusCode: 200, headers: jsonHeaders, body: JSON.stringify({ success: true }) };
  }

  const { topic, action } = body;
  const message = typeof body.message === 'string' ? body.message.trim() : '';

  if (!message) {
    return fail(400, 'Feedback message is required');
  }

  if (message.length > MAX_MESSAGE) {
    return fail(400, `Feedback must be ${MAX_MESSAGE} characters or fewer`);
  }

  // topic and action are never interpolated raw — unknown values fall back to
  // a fixed label, so no length cap is needed on them.
  const topicLabel = TOPICS[topic] || 'Not specified';
  const actionLabel = ACTIONS[action] || 'Not specified';

  const overBudget = await checkSendBudget('send-feedback');
  if (overBudget) {
    return {
      statusCode: 429,
      headers: { ...jsonHeaders, 'Retry-After': String(overBudget.retryAfter) },
      body: JSON.stringify({
        error: 'This form has reached its limit for now. Please try again later.'
      })
    };
  }

  const resend = new Resend(resendApiKey);

  try {
    await resend.emails.send({
      from: 'TreePage Feedback <onboarding@resend.dev>',
      to: contactEmail,
      subject: `[TreePage] Anonymous feedback: ${topicLabel}`,
      text: [
        `Topic: ${topicLabel}`,
        `Suggested action: ${actionLabel}`,
        '',
        message
      ].join('\n')
    });

    await recordSend('send-feedback');

    return {
      statusCode: 200,
      headers: jsonHeaders,
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    console.error('Resend API error:', error);
    return fail(500, 'Failed to send message');
  }
};
