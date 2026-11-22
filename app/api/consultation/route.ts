import { NextResponse } from 'next/server';
import { EMAIL_RE, clean, isMailConfigured, sendMail } from '@/lib/mail';
import { rpc } from '@/lib/supabase';
import { consultationAcknowledgement, consultationNotification } from '@/lib/emails';
import { ipHash, localeFrom } from '@/lib/request';
import { sendMetaLead } from '@/lib/meta-capi';

/**
 * Free consultation call requests (components/consult). Stored in Supabase first, so nothing is
 * lost; then the studio is notified and the visitor gets a confirmation in their language.
 * This route only runs when someone sends the form: reading articles costs nothing.
 */
const TYPES = new Set(['interior', 'visualization', 'architecture', 'unsure']);

export async function POST(req: Request) {
  let data: Record<string, unknown>;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_request' }, { status: 400 });
  }

  // Honeypot: real visitors never fill this hidden field.
  if (clean(data.company, 200)) return NextResponse.json({ ok: true });

  const typeRaw = clean(data.projectType, 20);
  const fields = {
    name: clean(data.name, 120),
    email: clean(data.email, 254).toLowerCase(),
    phone: clean(data.phone, 40),
    preferredTime: clean(data.preferredTime, 200),
    timezone: clean(data.timezone, 64),
    projectType: TYPES.has(typeRaw) ? typeRaw : 'unsure',
    message: clean(data.message, 2000),
    locale: localeFrom(data.locale),
    sourceTitle: clean(data.sourceTitle, 200),
    sourcePath: clean(data.sourcePath, 300) || clean(req.headers.get('referer'), 300),
    trigger: clean(data.trigger, 30),
  };

  if (!fields.name) return NextResponse.json({ ok: false, error: 'invalid_name' }, { status: 422 });
  if (!EMAIL_RE.test(fields.email)) return NextResponse.json({ ok: false, error: 'invalid_email' }, { status: 422 });

  const stored = await rpc<string>('submit_consultation', {
    p_name: fields.name,
    p_email: fields.email,
    p_phone: fields.phone || null,
    p_preferred_time: fields.preferredTime || null,
    p_timezone: fields.timezone || null,
    p_project_type: fields.projectType,
    p_message: fields.message || null,
    p_locale: fields.locale,
    p_source_path: fields.sourcePath || null,
    p_source_title: fields.sourceTitle || null,
    p_trigger: fields.trigger || null,
    p_ip_hash: ipHash(req),
    p_user_agent: clean(req.headers.get('user-agent'), 400) || null,
  });

  if (!stored.ok && stored.code === 'rate_limited') return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });
  if (!stored.ok && stored.code === 'invalid_email') return NextResponse.json({ ok: false, error: 'invalid_email' }, { status: 422 });

  const id = stored.ok ? stored.data : undefined;
  let notified = false;
  if (isMailConfigured()) {
    const note = consultationNotification({ ...fields, id });
    notified = await sendMail({ subject: note.subject, text: note.text, replyTo: fields.email });
    if (notified && id) await rpc('mark_consultation_notified', { p_id: id });
    const ack = consultationAcknowledgement(fields);
    await sendMail({ to: fields.email, subject: ack.subject, text: ack.text, html: ack.html });
  }

  if (stored.ok || notified) {
    // Ad measurement only with the visitor's marketing consent (sent by the form).
    if (data.marketingConsent === true) {
      await sendMetaLead(req, { email: fields.email, firstName: fields.name, eventId: clean(data.eventId, 64), sourceUrl: fields.sourcePath || undefined });
    }
    return NextResponse.json({ ok: true });
  }
  // Neither the database nor email delivery is available: the form offers email instead.
  return NextResponse.json({ ok: false, fallback: 'mailto' });
}
