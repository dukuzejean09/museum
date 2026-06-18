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

/**
 * Send booking confirmation with access code details.
 * Called when admin confirms a booking — includes the access code and gateway link.
 */
export const sendBookingConfirmationWithCode = async (booking, guide, accessInfo) => {
  const formatDuration = (hours) => {
    if (!hours) return '3 hours';
    if (hours < 1) return `${Math.round(hours * 60)} minutes`;
    if (hours === 1) return '1 hour';
    if (hours < 24) return `${hours} hours`;
    const days = Math.round(hours / 24);
    return days === 1 ? '1 day' : `${days} days`;
  };

  const accessSection = accessInfo?.code ? `
    <div style="background: #FFF7ED; border: 2px solid #F59E0B; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
      <h3 style="color: #D97706; margin: 0 0 8px 0; font-size: 16px;">🔑 Your Access Code</h3>
      <div style="background: white; border-radius: 8px; padding: 12px; margin: 12px 0;">
        <code style="font-size: 24px; font-weight: bold; color: #D97706; letter-spacing: 3px;">${accessInfo.code}</code>
      </div>
      <p style="color: #92400E; font-size: 13px; margin: 8px 0 0;">
        Use this code at <a href="${accessInfo.gatewayUrl}" style="color: #D97706; font-weight: bold;">${accessInfo.gatewayUrl}</a>
      </p>
      <div style="margin-top: 12px; font-size: 12px; color: #78716C;">
        <p style="margin: 4px 0;">⏱ Access duration: <strong>${formatDuration(accessInfo.duration)}</strong> per session</p>
        ${accessInfo.expiresAt ? `<p style="margin: 4px 0;">📅 Code valid until: <strong>${new Date(accessInfo.expiresAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong></p>` : ''}
      </div>
    </div>
  ` : '';

  const isPhysical = booking.visitType === 'physical';

  return sendEmail({
    to: booking.visitorEmail,
    subject: `✅ Booking Confirmed — ${booking.referenceNumber}`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #FAFAF9; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%); padding: 32px; text-align: center;">
          <h1 style="color: #F59E0B; margin: 0; font-size: 24px;">🏛 Kandt House Museum</h1>
          <p style="color: #94A3B8; margin: 8px 0 0; font-size: 14px;">Your visit has been confirmed!</p>
        </div>
        <div style="padding: 24px;">
          <p style="color: #1E293B; font-size: 15px;">Dear <strong>${booking.visitorName}</strong>,</p>
          <p style="color: #57534E; font-size: 14px; line-height: 1.6;">
            Great news! Your ${isPhysical ? 'museum tour' : 'online access'} booking has been confirmed. Here are the details:
          </p>

          <div style="background: white; border: 1px solid #E7E5E4; border-radius: 12px; padding: 16px; margin: 16px 0;">
            <table style="width: 100%; font-size: 14px; color: #44403C;">
              <tr><td style="padding: 6px 0; color: #78716C;">Reference</td><td style="padding: 6px 0; font-weight: bold;">${booking.referenceNumber}</td></tr>
              <tr><td style="padding: 6px 0; color: #78716C;">Visit Type</td><td style="padding: 6px 0;">${isPhysical ? '🚶 In-Person Tour' : '💻 Online Access'}</td></tr>
              <tr><td style="padding: 6px 0; color: #78716C;">Date</td><td style="padding: 6px 0;">${new Date(booking.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
              ${isPhysical && booking.time ? `<tr><td style="padding: 6px 0; color: #78716C;">Time</td><td style="padding: 6px 0;">${booking.time}</td></tr>` : ''}
              ${guide ? `<tr><td style="padding: 6px 0; color: #78716C;">Guide</td><td style="padding: 6px 0;">${guide.name}</td></tr>` : ''}
              <tr><td style="padding: 6px 0; color: #78716C;">Group Size</td><td style="padding: 6px 0;">${booking.groupSize} ${booking.groupSize === 1 ? 'person' : 'people'}</td></tr>
            </table>
          </div>

          ${accessSection}

          <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; padding: 12px; margin: 16px 0; font-size: 13px; color: #166534;">
            <strong>📌 Important:</strong>
            <ul style="margin: 8px 0 0; padding-left: 20px; line-height: 1.8;">
              <li>Your access code will only work within the valid period shown above</li>
              <li>Each code can be used by up to ${booking.groupSize} ${booking.groupSize === 1 ? 'person' : 'people'}</li>
              ${isPhysical ? '<li>Please arrive 10 minutes before your scheduled time</li>' : '<li>You can access the museum content from any device with a browser</li>'}
            </ul>
          </div>

          <p style="color: #78716C; font-size: 13px; text-align: center; margin-top: 24px;">
            Need to cancel? Use reference <strong>${booking.referenceNumber}</strong> and your email address.
          </p>
        </div>
        <div style="background: #1E293B; padding: 16px; text-align: center;">
          <p style="color: #64748B; font-size: 12px; margin: 0;">Kandt House Museum — Kigali, Rwanda</p>
        </div>
      </div>
    `,
    text: `Booking ${booking.referenceNumber} confirmed for ${new Date(booking.date).toLocaleDateString()}${booking.time ? ' at ' + booking.time : ''}. ${accessInfo?.code ? 'Your access code: ' + accessInfo.code + '. Use it at: ' + accessInfo.gatewayUrl : ''}`,
  });
};

/**
 * Send account credentials to a newly created admin or guide.
 */
export const sendCredentialsEmail = async ({ name, email, username, password, role, loginUrl }) => {
  const roleLabel = role === 'admin' ? 'Administrator' : 'Tour Guide';
  const url = loginUrl || process.env.FRONTEND_URL || 'http://localhost:5173';

  return sendEmail({
    to: email,
    subject: `Your ${roleLabel} Account — Kandt House Museum`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #FAFAF9; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%); padding: 32px; text-align: center;">
          <h1 style="color: #F59E0B; margin: 0; font-size: 24px;">🏛 Kandt House Museum</h1>
          <p style="color: #94A3B8; margin: 8px 0 0; font-size: 14px;">Staff Account Created</p>
        </div>
        <div style="padding: 24px;">
          <p style="color: #1E293B; font-size: 15px;">Dear <strong>${name || username}</strong>,</p>
          <p style="color: #57534E; font-size: 14px; line-height: 1.6;">
            A <strong>${roleLabel}</strong> account has been created for you at Kandt House Museum. Below are your login credentials:
          </p>

          <div style="background: #FFF7ED; border: 2px solid #F59E0B; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #D97706; margin: 0 0 12px 0; font-size: 16px;">🔐 Your Login Credentials</h3>
            <table style="width: 100%; font-size: 14px; color: #44403C;">
              <tr><td style="padding: 6px 0; color: #78716C; width: 100px;">Email</td><td style="padding: 6px 0; font-weight: bold;">${email}</td></tr>
              <tr><td style="padding: 6px 0; color: #78716C;">Username</td><td style="padding: 6px 0; font-weight: bold;">${username}</td></tr>
              <tr><td style="padding: 6px 0; color: #78716C;">Password</td><td style="padding: 6px 0;"><code style="background: white; padding: 4px 10px; border-radius: 6px; font-size: 15px; font-weight: bold; color: #D97706; letter-spacing: 1px;">${password}</code></td></tr>
              <tr><td style="padding: 6px 0; color: #78716C;">Role</td><td style="padding: 6px 0;">${roleLabel}</td></tr>
            </table>
          </div>

          <div style="background: #FEF2F2; border: 1px solid #FECACA; border-radius: 8px; padding: 12px; margin: 16px 0; font-size: 13px; color: #991B1B;">
            <strong>⚠️ Important:</strong>
            <ul style="margin: 8px 0 0; padding-left: 20px; line-height: 1.8;">
              <li>Please change your password after your first login</li>
              <li>Do not share your credentials with anyone</li>
              <li>If you did not expect this email, please ignore it</li>
            </ul>
          </div>

          <div style="text-align: center; margin-top: 24px;">
            <a href="${url}/enter" style="display: inline-block; background: #D97706; color: white; padding: 12px 32px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 14px;">Login to Your Account</a>
          </div>
        </div>
        <div style="background: #1E293B; padding: 16px; text-align: center;">
          <p style="color: #64748B; font-size: 12px; margin: 0;">Kandt House Museum — Kigali, Rwanda</p>
        </div>
      </div>
    `,
    text: `Your ${roleLabel} account at Kandt House Museum has been created.\nEmail: ${email}\nUsername: ${username}\nPassword: ${password}\nPlease change your password after first login.\nLogin at: ${url}/enter`,
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
