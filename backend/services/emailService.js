// ============================================================
//  Email Service  —  Modular provider-based email delivery
// ============================================================
//
//  Supported providers (set via EMAIL_PROVIDER env var):
//    - "console"   : logs emails to the console  (default, active)
//
//  Future providers (not yet implemented):
//    - "smtp"      : nodemailer with an SMTP relay
//    - "sendgrid"  : SendGrid Web API (requires SENDGRID_API_KEY)
//    - "ses"       : AWS SES SDK v3 (requires AWS credentials)
//
//  To add a new provider:
//    1. Create a class that implements  send({ to, subject, body })
//    2. Register it in the `providers` map below.
//    3. Set EMAIL_PROVIDER=<name> in your .env
// ============================================================

// --------------- Providers -----------------------------------

/**
 * ConsoleEmailProvider  — prints formatted emails to stdout.
 * Useful for development and testing without real mail delivery.
 */
class ConsoleEmailProvider {
  async send({ to, subject, body }) {
    console.log('\n' + '='.repeat(60));
    console.log('  EMAIL (ConsoleEmailProvider)');
    console.log('='.repeat(60));
    console.log(`  To:      ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log('-'.repeat(60));
    console.log(body);
    console.log('='.repeat(60) + '\n');

    return { success: true, provider: 'console' };
  }
}

// Future: class SmtpEmailProvider    { async send({ to, subject, body }) { ... } }
// Future: class SendGridEmailProvider { async send({ to, subject, body }) { ... } }
// Future: class SesEmailProvider      { async send({ to, subject, body }) { ... } }

// --------------- Provider registry ---------------------------

const providers = {
  console: new ConsoleEmailProvider(),
  // smtp:     new SmtpEmailProvider(),
  // sendgrid: new SendGridEmailProvider(),
  // ses:      new SesEmailProvider(),
};

function getProvider() {
  const name = process.env.EMAIL_PROVIDER || 'console';
  const provider = providers[name];
  if (!provider) {
    throw new Error(`Unknown email provider: "${name}". Available: ${Object.keys(providers).join(', ')}`);
  }
  return provider;
}

// --------------- Public API ----------------------------------

/**
 * Send a generic email.
 */
export async function sendEmail(to, subject, body) {
  return getProvider().send({ to, subject, body });
}

/**
 * Send an account-verification email with a numeric/alphanumeric code.
 */
export async function sendVerificationEmail(to, code) {
  const subject = 'Verify your account — Kandt House Museum';
  const body = [
    'Hello,',
    '',
    'Thank you for registering with the Kandt House Museum platform.',
    '',
    `Your verification code is:  ${code}`,
    '',
    'If you did not create an account, you can safely ignore this email.',
    '',
    'Best regards,',
    'Kandt House Museum Team',
  ].join('\n');

  return getProvider().send({ to, subject, body });
}

/**
 * Send a password-reset email containing a one-time reset link.
 */
export async function sendPasswordResetEmail(to, resetLink) {
  const subject = 'Password Reset — Kandt House Museum';
  const body = [
    'Hello,',
    '',
    'We received a request to reset your password.',
    '',
    'Click the link below to choose a new password:',
    resetLink,
    '',
    'This link will expire in 1 hour. If you did not request a reset,',
    'please ignore this email.',
    '',
    'Best regards,',
    'Kandt House Museum Team',
  ].join('\n');

  return getProvider().send({ to, subject, body });
}

/**
 * Send a booking confirmation email for a guided-tour reservation.
 *
 * @param {string} to
 * @param {object} bookingDetails - Expected shape:
 *   { tourName, date, time, guests, bookingRef }
 */
export async function sendBookingConfirmationEmail(to, bookingDetails) {
  const { tourName, date, time, guests, bookingRef } = bookingDetails;

  const subject = 'Booking Confirmation — Kandt House Museum';
  const body = [
    'Hello,',
    '',
    'Your tour booking has been confirmed!',
    '',
    `  Tour:          ${tourName ?? 'N/A'}`,
    `  Date:          ${date ?? 'N/A'}`,
    `  Time:          ${time ?? 'N/A'}`,
    `  Guests:        ${guests ?? 'N/A'}`,
    `  Booking Ref:   ${bookingRef ?? 'N/A'}`,
    '',
    'Please arrive 10 minutes before your scheduled time.',
    '',
    'Best regards,',
    'Kandt House Museum Team',
  ].join('\n');

  return getProvider().send({ to, subject, body });
}

/**
 * Send a general notification email.
 */
export async function sendNotificationEmail(to, subject, message) {
  const body = [
    'Hello,',
    '',
    message,
    '',
    'Best regards,',
    'Kandt House Museum Team',
  ].join('\n');

  return getProvider().send({ to, subject, body });
}
