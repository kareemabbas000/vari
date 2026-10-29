import { NextResponse } from 'next/server';
import { EMAIL_RE, clean, sendMail } from '@/lib/mail';

export async function POST(req: Request) {
  const data = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const email = clean(data.email, 250);
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: 'Please enter a valid email address.' }, { status: 422 });
  }
  try {
    const sent = await sendMail({ subject: 'Newsletter sign-up', replyTo: email, text: `New newsletter subscriber: ${email}` });
    if (!sent) return NextResponse.json({ ok: false, fallback: 'mailto' }, { status: 503 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, fallback: 'mailto' }, { status: 502 });
  }
}
