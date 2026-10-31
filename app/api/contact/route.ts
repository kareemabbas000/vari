import { NextResponse } from 'next/server';
import { EMAIL_RE, clean, isMailConfigured, sendMail } from '@/lib/mail';
import { rpc } from '@/lib/supabase';
import { contactAcknowledgement, studioNotification } from '@/lib/emails';
import { ipHash, localeFrom } from '@/lib/request';
import { sendMetaLead } from '@/lib/meta-capi';

/**
 * Contact enquiries: stored in Supabase first (nothing is ever lost), then the studio
 * is notified and the visitor receives an acknowledgement in their language.
 * If neither storage nor email is available, the client falls back to a mailto hand-off.
 */
export async function POST(req: Request) {
  let data: Record<string, unknown>;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_request' }, { status: 400 });
  }

  // Honeypot: real visitors never fill this hidden field.
  if (clean(data.company, 200)) return NextResponse.json({ ok: true });

  const firstName = clean(data.firstName, 100);
  const lastName = clean(data.lastName, 100);
  const email = clean(data.email, 254).toLowerCase();
  const message = clean(data.message, 5000);
  const intentRaw = clean(data.intent, 20);
  const intent = intentRaw === 'design' || intentRaw === 'visualize' ? intentRaw : '';
  const locale = localeFrom(data.locale);

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: 'invalid_email' }, { status: 422 });
  }

  const stored = await rpc<string>('submit_contact', {
    p_email: email,
    p_first_name: firstName || null,
    p_last_name: lastName || null,
    p_message: message || null,
    p_intent: intent || null,
    p_locale: locale,
    p_source_path: clean(req.headers.get('referer'), 300) || null,
    p_ip_hash: ipHash(req),
    p_user_agent: clean(req.headers.get('user-agent'), 400) || null,
  });

  if (!stored.ok && stored.code === 'rate_limited') {
    return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });
  }
  if (!stored.ok && stored.code === 'invalid_email') {
    return NextResponse.json({ ok: false, error: 'invalid_email' }, { status: 422 });
  }

  const id = stored.ok ? stored.data : undefined;
  let notified = false;
  if (isMailConfigured()) {
    const note = studioNotification({ firstName, lastName, email, message, intent, locale, id });
    notified = await sendMail({ subject: note.subject, text: note.text, replyTo: email });
    if (notified && id) await rpc('mark_contact_notified', { p_id: id });
    const ack = contactAcknowledgement(locale, firstName, message);
    await sendMail({ to: email, subject: ack.subject, text: ack.text, html: ack.html });
  }

  if (stored.ok || notified) {
    // Ad measurement only with the visitor's marketing consent (sent by the form).
    if (data.marketingConsent === true) {
      await sendMetaLead(req, { email, firstName, lastName, eventId: clean(data.eventId, 64), sourceUrl: clean(req.headers.get('referer'), 300) || undefined });
    }
    return NextResponse.json({ ok: true });
  }
  // Neither the database nor email delivery is available: let the visitor send it themselves.
  return NextResponse.json({ ok: false, fallback: 'mailto' });
}
