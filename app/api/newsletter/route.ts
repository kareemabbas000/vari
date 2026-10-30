import { NextResponse } from 'next/server';
import { EMAIL_RE, clean, isMailConfigured, sendMail } from '@/lib/mail';
import { rpc } from '@/lib/supabase';
import { newsletterConfirmation } from '@/lib/emails';
import { ipHash, localeFrom, originOf } from '@/lib/request';

type Sub = { status: string; confirm_token: string | null; unsubscribe_token: string | null; created: boolean }[];

/**
 * Newsletter sign-up with double opt-in: the address is stored as "pending" and a
 * confirmation link is emailed; it becomes "confirmed" only when that link is opened.
 * Tokens never reach the browser.
 */
export async function POST(req: Request) {
  const data = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const email = clean(data.email, 254).toLowerCase();
  const locale = localeFrom(data.locale);
  if (!EMAIL_RE.test(email)) return NextResponse.json({ ok: false, error: 'invalid_email' }, { status: 422 });

  const res = await rpc<Sub>('subscribe_newsletter', { p_email: email, p_locale: locale, p_ip_hash: ipHash(req) });

  if (!res.ok) {
    if (res.code === 'rate_limited') return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });
    if (res.code === 'invalid_email') return NextResponse.json({ ok: false, error: 'invalid_email' }, { status: 422 });
    // Storage unavailable: hand the sign-up to the visitor's mail app instead.
    return NextResponse.json({ ok: false, fallback: 'mailto' });
  }

  const row = res.data[0];
  if (!row || row.status === 'confirmed') return NextResponse.json({ ok: true, status: 'already' });

  if (row.confirm_token && row.unsubscribe_token && isMailConfigured()) {
    const origin = originOf(req);
    const confirmUrl = `${origin}/api/newsletter/confirm?token=${row.confirm_token}`;
    const unsubscribeUrl = `${origin}/api/newsletter/unsubscribe?token=${row.unsubscribe_token}`;
    const mail = newsletterConfirmation(locale, confirmUrl, unsubscribeUrl);
    const sent = await sendMail({
      to: email,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
      headers: { 'List-Unsubscribe': `<${unsubscribeUrl}>` },
    });
    if (sent) return NextResponse.json({ ok: true, status: 'check_inbox' });
  }

  // Stored as pending; the confirmation email could not be sent yet.
  return NextResponse.json({ ok: true, status: 'pending' });
}
