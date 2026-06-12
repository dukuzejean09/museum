/**
 * Email service placeholder.
 *
 * For production, integrate with SendGrid, Mailgun, or AWS SES.
 * For now, logs to console and can be swapped with minimal changes.
 */

const sendEmail = async ({ to, subject, html, text }) => {
  // If a real SMTP is configured, use nodemailer
  if (process.env.SMTP_HOST) {
    // Lazy import nodemailer only when needed
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.default.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    return transporter.sendMail({
      from: process.env.SMTP_FROM || '"Ngoma Museum" <noreply@museum.rw>',
      to,
      subject,
      html,
      text,
    });
  }

  // Development fallback — just log
  console.log(`[EMAIL] To: ${to} | Subject: ${subject}`);
  if (text) console.log(`[EMAIL] Body: ${text.substring(0, 200)}...`);
  return { messageId: `dev-${Date.now()}` };
};

export const sendBookingConfirmation = async (booking, guide) => {
  return sendEmail({
    to: booking.visitorEmail,
    subject: `Booking Confirmed — ${booking.referenceNumber}`,
    html: `
      <h2>Your museum tour is confirmed!</h2>
      <p><strong>Reference:</strong> ${booking.referenceNumber}</p>
      <p><strong>Guide:</strong> ${guide?.name || 'TBA'}</p>
      <p><strong>Date:</strong> ${new Date(booking.date).toLocaleDateString()}</p>
      <p><strong>Time:</strong> ${booking.time}</p>
      <p><strong>Group Size:</strong> ${booking.groupSize}</p>
      <p>We look forward to welcoming you!</p>
    `,
    text: `Booking ${booking.referenceNumber} confirmed for ${new Date(booking.date).toLocaleDateString()} at ${booking.time}`,
  });
};

export const sendMessageReplyNotification = async (originalMessage, reply) => {
  return sendEmail({
    to: originalMessage.email,
    subject: `Reply to your message — Ngoma Museum`,
    html: `
      <h2>You have a reply from our team</h2>
      <p><strong>Your message:</strong> ${originalMessage.message.substring(0, 200)}...</p>
      <hr/>
      <p><strong>${reply.responderName} (${reply.responderRole}):</strong></p>
      <p>${reply.message}</p>
    `,
    text: `Reply from ${reply.responderName}: ${reply.message}`,
  });
};

export default sendEmail;
