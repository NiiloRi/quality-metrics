import { Resend } from 'resend';

// Lazy-initialize Resend client only when API key is available
let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

// Your email to receive notifications
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const FROM_EMAIL = process.env.FROM_EMAIL || 'Quality Metrics <onboarding@resend.dev>';

interface NewUserData {
  email: string;
  name: string | null;
  subscriptionTier: string;
  trialEndsAt: string;
}

export async function notifyNewUser(user: NewUserData) {
  const resend = getResendClient();
  if (!resend) {
    console.log('[Notification] New user registered:', user.email);
    return;
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `🎉 New User: ${user.email}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f59e0b;">New User Registered!</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Email:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${user.email}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Name:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${user.name || 'Not provided'}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Subscription:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${user.subscriptionTier}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Trial Ends:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${new Date(user.trialEndsAt).toLocaleDateString('fi-FI')}</td>
            </tr>
          </table>
          <p style="color: #666; margin-top: 20px; font-size: 12px;">
            Quality Metrics - Stock Analysis Platform
          </p>
        </div>
      `,
    });
    console.log('[Notification] Email sent for new user:', user.email);
  } catch (error) {
    console.error('[Notification] Failed to send email:', error);
  }
}

export async function notifyTrialExpiring(user: { email: string; name: string | null; daysLeft: number }) {
  const resend = getResendClient();
  if (!resend) {
    console.log('[Notification] Trial expiring for:', user.email, `(${user.daysLeft} days left)`);
    return;
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: user.email,
      subject: `⏰ Your Quality Metrics trial ends in ${user.daysLeft} days`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f59e0b;">Your Trial is Ending Soon!</h2>
          <p>Hi ${user.name || 'there'},</p>
          <p>Your Quality Metrics trial will expire in <strong>${user.daysLeft} days</strong>.</p>
          <p>Upgrade now to keep access to:</p>
          <ul>
            <li>👑 Crown Jewels - Elite stock picks</li>
            <li>📊 Detailed QM Score analysis</li>
            <li>💎 Hidden Gems filter</li>
            <li>📈 Valuation insights</li>
          </ul>
          <p>
            <a href="https://qualitymetrics.app/pricing"
               style="display: inline-block; padding: 12px 24px; background: linear-gradient(to right, #f59e0b, #eab308); color: white; text-decoration: none; border-radius: 25px; font-weight: bold;">
              Upgrade Now
            </a>
          </p>
          <p style="color: #666; margin-top: 20px; font-size: 12px;">
            Quality Metrics - Stock Analysis Platform
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error('[Notification] Failed to send trial expiring email:', error);
  }
}
