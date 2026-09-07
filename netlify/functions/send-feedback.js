const { Resend } = require('resend');
const guard = require('../lib/form-guard');

const ENDPOINT = 'send-feedback';
const MAX_MESSAGE = 5000;

// topic and action are never interpolated raw: unknown values fall back to a
// fixed label, so they need no length cap.
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

exports.handler = async (event) => {
  const early = guard.rejectEarly(event);
  if (early) return early;

  const resendConfig = guard.getResendConfig();
  if (!resendConfig) return guard.fail(500, 'Email service is not configured');

  const { body, response: badBody } = guard.parseBody(event);
  if (badBody) return badBody;

  if (guard.isHoneypotTripped(body)) return guard.honeypotResponse(ENDPOINT);

  const message = guard.asText(body.message);
  if (!message) return guard.fail(400, 'Feedback message is required');

  const tooLong = guard.rejectTooLong([['Feedback', message, MAX_MESSAGE]]);
  if (tooLong) return tooLong;

  const overBudget = await guard.rejectOverBudget(ENDPOINT);
  if (overBudget) return overBudget;

  const topicLabel = TOPICS[body.topic] || 'Not specified';
  const actionLabel = ACTIONS[body.action] || 'Not specified';

  try {
    const resend = new Resend(resendConfig.apiKey);
    await resend.emails.send({
      from: 'TreePage Feedback <onboarding@resend.dev>',
      to: resendConfig.contactEmail,
      subject: `[TreePage] Anonymous feedback: ${topicLabel}`,
      text: [
        `Topic: ${topicLabel}`,
        `Suggested action: ${actionLabel}`,
        '',
        message
      ].join('\n')
    });

    await guard.recordSend(ENDPOINT);
    return guard.jsonResponse(200, { success: true });
  } catch (error) {
    console.error('Resend API error:', error);
    return guard.fail(500, 'Failed to send message');
  }
};
