import { NextResponse } from 'next/server';
import { EMAIL_RE, clean, sendMail } from '@/lib/mail';

export async function POST(req: Request) {
  let data: Record<string, unknown>;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 });
  }

  // Honeypot: real visitors never fill this hidden field.
  if (clean(data.company, 200)) return NextResponse.json({ ok: true });

  const firstName = clean(data.firstName, 100);
  const lastName = clean(data.lastName, 100);
  const email = clean(data.email, 250);
  const message = clean(data.message, 5000);
  const intent = ['design', 'visualize'].includes(clean(data.intent, 20)) ? clean(data.intent, 20) : '';

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: 'Please enter a valid email address.' }, { status: 422 });
  }

  try {
    const sent = await sendMail({
      subject: `New ${intent ? `${intent} ` : ''}enquiry from ${[firstName, lastName].filter(Boolean).join(' ') || email}`,
      replyTo: email,
      text: [`Name: ${firstName} ${lastName}`.trim(), `Email: ${email}`, '', message || '(no message)'].join('\n'),
    });
    if (!sent) return NextResponse.json({ ok: false, fallback: 'mailto' }, { status: 200 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, fallback: 'mailto' }, { status: 502 });
  }
}
