const { Resend } = require('resend');
const guard = require('../lib/form-guard');

const ENDPOINT = 'send-contact';

// Lengths a real message plausibly needs.
const MAX_NAME = 100;
const MAX_EMAIL = 254; // RFC 5321 maximum address length
const MAX_SUBJECT = 200;
const MAX_MESSAGE = 5000;

exports.handler = async (event) => {
  const early = guard.rejectEarly(event);
  if (early) return early;

  const resendConfig = guard.getResendConfig();
  if (!resendConfig) return guard.fail(500, 'Email service is not configured');

  const { body, response: badBody } = guard.parseBody(event);
  if (badBody) return badBody;

  if (guard.isHoneypotTripped(body)) return guard.honeypotResponse(ENDPOINT);

  const name = guard.asText(body.name);
  const email = guard.asText(body.email);
  const subject = guard.asText(body.subject);
  const message = guard.asText(body.message);

  if (!name || !email || !message) {
    return guard.fail(400, 'Name, email, and message are required');
  }

  const tooLong = guard.rejectTooLong([
    ['Name', name, MAX_NAME],
    ['Email', email, MAX_EMAIL],
    ['Subject', subject, MAX_SUBJECT],
    ['Message', message, MAX_MESSAGE]
  ]);
  if (tooLong) return tooLong;

  const overBudget = await guard.rejectOverBudget(ENDPOINT);
  if (overBudget) return overBudget;

  try {
    const resend = new Resend(resendConfig.apiKey);
    await resend.emails.send({
      from: 'TreePage Contact <onboarding@resend.dev>',
      to: resendConfig.contactEmail,
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

    await guard.recordSend(ENDPOINT);
    return guard.jsonResponse(200, { success: true });
  } catch (error) {
    console.error('Resend API error:', error);
    return guard.fail(500, 'Failed to send message');
  }
};
