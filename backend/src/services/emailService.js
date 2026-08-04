const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:5173';
const EMAIL_FROM = process.env.EMAIL_FROM || 'Ratemet <accounts@notify.emecworks.com>';

async function sendEmail({ to, subject, html, text }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    const error = new Error('Email delivery is not configured.');
    error.code = 'email_not_configured';
    throw error;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: EMAIL_FROM, to: [to], subject, html, text }),
  });

  if (!response.ok) {
    const error = new Error(`Email provider returned HTTP ${response.status}.`);
    error.code = 'email_delivery_failed';
    throw error;
  }
}

async function sendVerificationEmail(email, token) {
  const url = `${APP_BASE_URL}/verify-email?token=${encodeURIComponent(token)}`;
  await sendEmail({
    to: email,
    subject: 'Verify your Ratemet account',
    text: `Verify your Ratemet account: ${url}`,
    html: `<p>Welcome to Ratemet.</p><p><a href="${url}">Verify your email address</a></p><p>This link expires in 24 hours.</p>`,
  });
}

async function sendPasswordResetEmail(email, token) {
  const url = `${APP_BASE_URL}/reset-password?token=${encodeURIComponent(token)}`;
  await sendEmail({
    to: email,
    subject: 'Reset your Ratemet password',
    text: `Reset your Ratemet password: ${url}`,
    html: `<p>A password reset was requested for your Ratemet account.</p><p><a href="${url}">Reset your password</a></p><p>This link expires in one hour. Ignore this message if you did not request it.</p>`,
  });
}

module.exports = { sendPasswordResetEmail, sendVerificationEmail };
