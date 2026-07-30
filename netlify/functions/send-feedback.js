const { Resend } = require('resend');

const TOPICS = {
  website: 'Website & portfolio',
  work: 'Professional work & skills',
  communication: 'Communication & collaboration style',
  career: 'Career direction & choices',
  other: 'Other'
};

const ACTIONS = {
  start: 'Start doing',
  stop: 'Stop doing',
  keep: 'Keep doing',
  other: 'Other'
};

exports.handler = async (event) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const contactEmail = process.env.CONTACT_EMAIL;

  if (!resendApiKey || !contactEmail) {
    console.error('Missing env vars — RESEND_API_KEY:', !!resendApiKey, 'CONTACT_EMAIL:', !!contactEmail);
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Email service is not configured' })
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid request body' })
    };
  }

  const { topic, action, message } = body;

  if (!message || !message.trim()) {
    return {
      statusCode: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Feedback message is required' })
    };
  }

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
        message.trim()
      ].join('\n')
    });

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    console.error('Resend API error:', error);
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to send message' })
    };
  }
};
