// ============================================================
//  Email Service  —  Modular provider-based email delivery
// ============================================================

import nodemailer from 'nodemailer';

// --------------- Providers -----------------------------------

class ConsoleEmailProvider {
  async send({ to, subject, body, html }) {
    console.log('\n' + '='.repeat(60));
    console.log('  EMAIL (ConsoleEmailProvider)');
    console.log('='.repeat(60));
    console.log(`  To:      ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log('-'.repeat(60));
    console.log(body || html);
    console.log('='.repeat(60) + '\n');
    return { success: true, provider: 'console' };
  }
}

class SmtpEmailProvider {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async send({ to, subject, body, html }) {
    const info = await this.transporter.sendMail({
      from: process.env.SMTP_FROM || `"Kandt House Museum" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text: body,
      html: html || body,
    });
    return { success: true, provider: 'smtp', messageId: info.messageId };
  }
}

// --------------- Provider registry ---------------------------

const providers = {
  console: new ConsoleEmailProvider(),
};

// Only create SMTP provider if credentials are configured
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  providers.smtp = new SmtpEmailProvider();
}

function getProvider() {
  const name = process.env.EMAIL_PROVIDER || 'console';
  const provider = providers[name];
  if (!provider) {
    console.warn(`Email provider "${name}" not available, falling back to console`);
    return providers.console;
  }
  return provider;
}

// --------------- Public API ----------------------------------

export async function sendEmail(to, subject, body) {
  return getProvider().send({ to, subject, body });
}

export async function sendVerificationEmail(to, code) {
  const subject = 'Verify your account — Kandt House Museum';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4F46E5;">Kandt House Museum</h2>
      <p>Hello,</p>
      <p>Thank you for registering with the Kandt House Museum platform.</p>
      <p style="font-size: 18px;">Your verification code is: <strong style="color: #4F46E5; font-size: 24px;">${code}</strong></p>
      <p>If you did not create an account, you can safely ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #eee;" />
      <p style="color: #888; font-size: 12px;">Best regards,<br/>Kandt House Museum Team</p>
    </div>
  `;
  const body = `Your verification code is: ${code}`;
  return getProvider().send({ to, subject, body, html });
}

export async function sendPasswordResetEmail(to, resetLink) {
  const subject = 'Password Reset — Kandt House Museum';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4F46E5;">Kandt House Museum</h2>
      <p>Hello,</p>
      <p>We received a request to reset your password.</p>
      <p><a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 6px;">Reset Password</a></p>
      <p style="font-size: 12px; color: #888;">Or copy this link: ${resetLink}</p>
      <p>This link will expire in 1 hour.</p>
      <hr style="border: none; border-top: 1px solid #eee;" />
      <p style="color: #888; font-size: 12px;">Best regards,<br/>Kandt House Museum Team</p>
    </div>
  `;
  const body = `Reset your password: ${resetLink}`;
  return getProvider().send({ to, subject, body, html });
}

export async function sendBookingConfirmationEmail(to, bookingDetails) {
  const { tourName, date, time, guests, bookingRef } = bookingDetails;
  const subject = 'Booking Confirmation — Kandt House Museum';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4F46E5;">Your Tour is Confirmed!</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px; font-weight: bold;">Tour:</td><td style="padding: 8px;">${tourName ?? 'N/A'}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">Date:</td><td style="padding: 8px;">${date ?? 'N/A'}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">Time:</td><td style="padding: 8px;">${time ?? 'N/A'}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">Guests:</td><td style="padding: 8px;">${guests ?? 'N/A'}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">Reference:</td><td style="padding: 8px;">${bookingRef ?? 'N/A'}</td></tr>
      </table>
      <p>Please arrive 10 minutes before your scheduled time.</p>
      <hr style="border: none; border-top: 1px solid #eee;" />
      <p style="color: #888; font-size: 12px;">Best regards,<br/>Kandt House Museum Team</p>
    </div>
  `;
  const body = `Booking confirmed: ${tourName} on ${date} at ${time}. Ref: ${bookingRef}`;
  return getProvider().send({ to, subject, body, html });
}

export async function sendNotificationEmail(to, subject, message) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4F46E5;">Kandt House Museum</h2>
      <p>${message}</p>
      <hr style="border: none; border-top: 1px solid #eee;" />
      <p style="color: #888; font-size: 12px;">Best regards,<br/>Kandt House Museum Team</p>
    </div>
  `;
  return getProvider().send({ to, subject, body: message, html });
}
