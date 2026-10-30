import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendAccessLink } from '@/lib/panel-auth';
import { EMAIL_RE, clean } from '@/lib/mail';
import { originOf } from '@/lib/request';

export const dynamic = 'force-dynamic';

const recent = new Map<string, number>();

/** Password reset for team members. Always answers "ok" so it can't reveal who has an account. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const email = clean(body.email, 254).toLowerCase();
  const ok = NextResponse.json({ ok: true });
  if (!EMAIL_RE.test(email)) return ok;

  // One email per address per minute (per server instance).
  const last = recent.get(email) ?? 0;
  if (Date.now() - last < 60_000) return ok;
  recent.set(email, Date.now());

  const admin = supabaseAdmin();
  if (!admin) return ok;
  const { data: member } = await admin.from('profiles').select('id').eq('email', email).maybeSingle();
  if (!member) return ok;

  const res = await sendAccessLink(admin, email, 'recovery', originOf(req));
  if ('error' in res) console.error('[password-reset] failed', res.error);
  return ok;
}
