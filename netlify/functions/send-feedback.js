const { Resend } = require('resend');

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
