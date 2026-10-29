/**
 * Server-side mail delivery via the Resend HTTP API (no SDK dependency).
 * Returns false when no API key is configured so callers can fall back gracefully.
 */
export async function sendMail({ subject, text, replyTo }: { subject: string; text: string; replyTo?: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.CONTACT_FROM_EMAIL || 'VARI Studio <onboarding@resend.dev>',
      to: [process.env.CONTACT_TO_EMAIL || 'info@vari-studio.com'],
      subject,
      text,
      reply_to: replyTo,
    }),
  });
  if (!res.ok) throw new Error(`Mail provider responded ${res.status}`);
  return true;
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,63}$/;

export function clean(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}
