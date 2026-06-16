/**
 * Email utility — uses nodemailer with Gmail SMTP.
 * Falls back to console logging if SMTP is not configured.
 */
import nodemailer from 'nodemailer';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    return transporter;
  }

  return null;
}

const sendEmail = async ({ to, subject, html, text }) => {
  const transport = getTransporter();

  if (transport) {
    return transport.sendMail({
      from: process.env.SMTP_FROM || `"Kandt House Museum" <${process.env.SMTP_USER}>`,
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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Your Museum Tour is Confirmed!</h2>
        <p><strong>Reference:</strong> ${booking.referenceNumber}</p>
        <p><strong>Guide:</strong> ${guide?.name || 'TBA'}</p>
        <p><strong>Date:</strong> ${new Date(booking.date).toLocaleDateString()}</p>
        <p><strong>Time:</strong> ${booking.time}</p>
        <p><strong>Group Size:</strong> ${booking.groupSize}</p>
        <p>We look forward to welcoming you!</p>
        <hr style="border: none; border-top: 1px solid #eee;" />
        <p style="color: #888; font-size: 12px;">Best regards,<br/>Kandt House Museum Team</p>
      </div>
    `,
    text: `Booking ${booking.referenceNumber} confirmed for ${new Date(booking.date).toLocaleDateString()} at ${booking.time}`,
  });
};

export const sendMessageReplyNotification = async (originalMessage, reply) => {
  return sendEmail({
    to: originalMessage.email,
    subject: `Reply to your message — Kandt House Museum`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">You Have a Reply</h2>
        <p><strong>Your message:</strong> ${originalMessage.message.substring(0, 200)}...</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;" />
        <p><strong>${reply.responderName} (${reply.responderRole}):</strong></p>
        <p>${reply.message}</p>
        <hr style="border: none; border-top: 1px solid #eee;" />
        <p style="color: #888; font-size: 12px;">Best regards,<br/>Kandt House Museum Team</p>
      </div>
    `,
    text: `Reply from ${reply.responderName}: ${reply.message}`,
  });
};

export default sendEmail;
