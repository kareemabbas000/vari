/**
 * Server-side mail delivery via the Resend HTTP API (no SDK dependency).
 *
 *   RESEND_API_KEY        enables sending (without it every send returns false)
 *   CONTACT_FROM_EMAIL    sender, on a domain verified in Resend (e.g. website@vari-studio.com)
 *   CONTACT_TO_EMAIL      where studio notifications go (default info@vari-studio.com)
 *
 * Never throws: returns true when the provider accepted the message.
 */
export function isMailConfigured() {
  return !!process.env.RESEND_API_KEY;
}

export const STUDIO_INBOX = () => process.env.CONTACT_TO_EMAIL || 'info@vari-studio.com';

export async function sendMail({
  to = STUDIO_INBOX(),
  subject,
  text,
  html,
  replyTo,
  headers,
}: {
  to?: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
  headers?: Record<string, string>;
}) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM_EMAIL || 'VARI Studio <onboarding@resend.dev>',
        to: [to],
        subject,
        text,
        html,
        reply_to: replyTo,
        headers,
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      console.error('[mail] provider responded', res.status, await res.text().catch(() => ''));
      return false;
    }
    return true;
  } catch (err) {
    console.error('[mail] send failed', err);
    return false;
  }
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,63}$/;

export function clean(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}
