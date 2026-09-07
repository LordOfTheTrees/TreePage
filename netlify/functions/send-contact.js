const { Resend } = require('resend');

// Field length caps. Resend accepts far larger payloads, so nothing upstream
// rejects an oversized submission — the ceiling is Netlify's ~6MB request body.
// These are the limits a real message plausibly needs.
const MAX_NAME = 100;
const MAX_EMAIL = 254; // RFC 5321 maximum address length
const MAX_SUBJECT = 200;
const MAX_MESSAGE = 5000;
const MAX_BODY_BYTES = 64 * 1024;

// Honeypot: a field hidden from humans that automated form fillers populate.
// Named to look worth filling in. Kept in sync with the input in pages/contact.md.
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
    console.warn('Honeypot triggered on send-contact; discarding submission.');
    return { statusCode: 200, headers: jsonHeaders, body: JSON.stringify({ success: true }) };
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';

  if (!name || !email || !message) {
    return fail(400, 'Name, email, and message are required');
  }

  const tooLong = [
    ['Name', name, MAX_NAME],
    ['Email', email, MAX_EMAIL],
    ['Subject', subject, MAX_SUBJECT],
    ['Message', message, MAX_MESSAGE]
  ].find(([, value, max]) => value.length > max);

  if (tooLong) {
    const [label, , max] = tooLong;
    return fail(400, `${label} must be ${max} characters or fewer`);
  }

  const resend = new Resend(resendApiKey);

  try {
    await resend.emails.send({
      from: 'TreePage Contact <onboarding@resend.dev>',
      to: contactEmail,
      replyTo: email,
      subject: subject ? `[TreePage] ${subject}` : `[TreePage] Message from ${name}`,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        subject ? `Subject: ${subject}` : null,
        '',
        message
      ].filter(Boolean).join('\n')
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
