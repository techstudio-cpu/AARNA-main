// Email via Resend HTTP API (no SMTP needed — works on Railway)
// Env vars: RESEND_API_KEY, FROM_EMAIL (optional), ADMIN_EMAIL (optional)

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'info@aarnasolars.com';
const FROM_NAME = 'Aarna Solars & Services';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || FROM_EMAIL;

async function verifyConnection() {
  if (!RESEND_API_KEY) {
    console.log('📧 Email: No RESEND_API_KEY set, email sending disabled');
    return false;
  }
  const keyPreview = RESEND_API_KEY.substring(0, 8) + '...';
  console.log(`📧 Email: Resend API key loaded (${keyPreview}...)`);
  // Skip /domains check — restricted keys only allow /emails
  console.log('📧 Email: Ready (restricted keys skip domain verification)');
  return true;
}

// ─── Email Templates ────────────────────────────────────────────

function getHeaderHTML() {
  return `
    <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0;">
      <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">Aarna Solars & Services</h1>
      <p style="margin: 6px 0 0 0; color: rgba(255,255,255,0.9); font-size: 13px;">TATA Power SOLAROOF Authorized Partner</p>
    </div>
  `;
}

function getFooterHTML() {
  return `
    <div style="background: #f8fafc; padding: 20px; text-align: center; border-radius: 0 0 12px 12px; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0 0 8px 0; color: #64748b; font-size: 13px;">Aarna Solars & Services | TATA Power SOLAROOF Partner</p>
      <p style="margin: 0 0 4px 0; color: #94a3b8; font-size: 12px;">Satna & Shahdol, Madhya Pradesh</p>
      <p style="margin: 0; color: #94a3b8; font-size: 12px;">
        <a href="https://aarnasolars.com" style="color: #f97316; text-decoration: none;">aarnasolars.com</a> |
        <a href="tel:+919993124222" style="color: #f97316; text-decoration: none;">+91 99931-24222</a>
      </p>
    </div>
  `;
}

function wrapTemplate(bodyHTML) {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin: 0; padding: 20px; background: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.07);">
        ${getHeaderHTML()}
        <div style="padding: 30px 24px;">
          ${bodyHTML}
        </div>
        ${getFooterHTML()}
      </div>
    </body>
    </html>
  `;
}

// ─── Send Functions ─────────────────────────────────────────────

/**
 * Send admin notification when a new contact form is submitted
 */
async function notifyAdminNewContact(leadData) {
  const html = wrapTemplate(`
    <h2 style="margin: 0 0 16px 0; color: #1e293b; font-size: 20px;">🔔 New Contact Form Submission</h2>
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px; width: 120px;">Name</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-size: 14px; font-weight: 600;">${leadData.name || 'N/A'}</td>
      </tr>
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px;">Phone</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-size: 14px;">
          <a href="tel:${leadData.phone}" style="color: #f97316; text-decoration: none;">${leadData.phone || 'N/A'}</a>
        </td>
      </tr>
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px;">Email</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-size: 14px;">${leadData.email || 'N/A'}</td>
      </tr>
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px;">Location</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-size: 14px;">${leadData.location || 'N/A'}</td>
      </tr>
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px;">Service</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-size: 14px;">${leadData.serviceType || 'N/A'}</td>
      </tr>
      ${leadData.message ? `
      <tr>
        <td style="padding: 10px 12px; color: #64748b; font-size: 13px; vertical-align: top;">Message</td>
        <td style="padding: 10px 12px; color: #1e293b; font-size: 14px;">${leadData.message}</td>
      </tr>
      ` : ''}
    </table>
    <div style="margin-top: 24px; text-align: center;">
      <a href="https://aarnasolars.com/admin/leads" style="display: inline-block; background: #f97316; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">View in Admin Panel</a>
    </div>
  `);

  return sendMail({
    to: ADMIN_EMAIL,
    subject: `🔔 New Lead: ${leadData.name || 'Unknown'} — ${leadData.serviceType || 'General Inquiry'}`,
    html
  });
}

/**
 * Send admin notification when a callback request is submitted
 */
async function notifyAdminNewCallback(phone) {
  const html = wrapTemplate(`
    <h2 style="margin: 0 0 16px 0; color: #1e293b; font-size: 20px;">📞 New Callback Request</h2>
    <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 20px; text-align: center;">
      <p style="margin: 0 0 4px 0; color: #9a3412; font-size: 13px; font-weight: 600;">PHONE NUMBER</p>
      <p style="margin: 0; color: #c2410c; font-size: 24px; font-weight: 700;">
        <a href="tel:${phone}" style="color: #c2410c; text-decoration: none;">${phone}</a>
      </p>
    </div>
    <p style="margin: 16px 0 0 0; color: #64748b; font-size: 13px; text-align: center;">
      This customer requested an immediate callback. Please call them as soon as possible.
    </p>
    <div style="margin-top: 20px; text-align: center;">
      <a href="https://aarnasolars.com/admin/leads" style="display: inline-block; background: #f97316; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">View in Admin Panel</a>
    </div>
  `);

  return sendMail({
    to: ADMIN_EMAIL,
    subject: `📞 Callback Request: ${phone}`,
    html
  });
}

/**
 * Send confirmation email to customer after contact form submission
 */
async function sendCustomerConfirmation(leadData) {
  if (!leadData.email) return null; // No email provided

  const html = wrapTemplate(`
    <h2 style="margin: 0 0 8px 0; color: #1e293b; font-size: 20px;">Thank You, ${leadData.name || 'Valued Customer'}! 🙏</h2>
    <p style="margin: 0 0 20px 0; color: #64748b; font-size: 15px; line-height: 1.6;">
      We've received your inquiry and our team will get back to you shortly. Here's a summary of your request:
    </p>
    <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
      ${leadData.serviceType ? `<p style="margin: 0 0 8px 0; color: #475569; font-size: 14px;"><strong>Service:</strong> ${leadData.serviceType}</p>` : ''}
      ${leadData.location ? `<p style="margin: 0 0 8px 0; color: #475569; font-size: 14px;"><strong>Location:</strong> ${leadData.location}</p>` : ''}
      ${leadData.message ? `<p style="margin: 0; color: #475569; font-size: 14px;"><strong>Message:</strong> ${leadData.message}</p>` : ''}
    </div>
    <div style="background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%); border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px;">
      <p style="margin: 0 0 4px 0; color: #166534; font-size: 14px; font-weight: 600;">What happens next?</p>
      <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #15803d; font-size: 14px; line-height: 1.8;">
        <li>Our solar expert will review your requirements</li>
        <li>We'll contact you within 24 hours</li>
        <li>A customized solar solution will be prepared for you</li>
      </ul>
    </div>
    <p style="margin: 20px 0 0 0; color: #64748b; font-size: 14px; line-height: 1.6;">
      Need immediate assistance? Call us at <a href="tel:+919993124222" style="color: #f97316; text-decoration: none; font-weight: 600;">+91 99931-24222</a>
    </p>
  `);

  return sendMail({
    to: leadData.email,
    subject: `Thank you for contacting Aarna Solars! ☀️`,
    html
  });
}

/**
 * Core mail sender via Resend HTTP API (non-blocking)
 */
async function sendMail({ to, subject, html }) {
  try {
    if (!RESEND_API_KEY) {
      console.log(`📧 Email disabled (no API key). Would send to: ${to} | Subject: ${subject}`);
      return null;
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: [to],
        subject,
        html
      })
    });

    const data = await res.json();

    if (res.ok) {
      console.log(`📧 Email sent: ${to} | ${subject} | ID: ${data.id}`);
      return data;
    } else {
      console.error(`📧 Email failed: ${to} | ${subject} | ${data.message || JSON.stringify(data)}`);
      return null;
    }
  } catch (error) {
    console.error(`📧 Email error: ${to} | ${subject} | ${error.message}`);
    return null;
  }
}

module.exports = {
  verifyConnection,
  notifyAdminNewContact,
  notifyAdminNewCallback,
  sendCustomerConfirmation,
  sendMail
};
