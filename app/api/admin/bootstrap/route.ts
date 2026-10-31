import { NextResponse } from 'next/server';
import { OWNER_EMAIL, serverKeyProblem, supabaseAdmin } from '@/lib/supabase/admin';
import { maskEmail, sendAccessLink } from '@/lib/panel-auth';
import { originOf } from '@/lib/request';

export const dynamic = 'force-dynamic';

/** true / false, or the reason the server key cannot be used. */
async function ownerExists(): Promise<boolean | string> {
  const problem = serverKeyProblem();
  const admin = supabaseAdmin();
  if (problem || !admin) return problem || 'missing';
  const { count, error, status } = await admin.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'owner');
  if (error) return status === 401 || status === 403 ? 'rejected' : 'unreachable';
  return (count ?? 0) > 0;
}

/** Whether the one-time owner setup is still open (no owner account exists yet). */
export async function GET() {
  const exists = await ownerExists();
  const problem = typeof exists === 'string' ? exists : null;
  return NextResponse.json({ needsSetup: exists !== true, configured: !problem, problem, ownerHint: maskEmail(OWNER_EMAIL) });
}

/**
 * One-time owner setup: invites the configured owner email (ADMIN_OWNER_EMAIL). Only works
 * while no owner exists, and only ever emails that one address — so pressing the button
 * can never hand control to anyone else.
 */
export async function POST(req: Request) {
  const admin = supabaseAdmin();
  const exists = await ownerExists();
  if (!admin || typeof exists === 'string') return NextResponse.json({ ok: false, error: typeof exists === 'string' ? exists : 'missing' }, { status: 503 });
  if (exists) return NextResponse.json({ ok: false, error: 'already_set_up' }, { status: 409 });

  const res = await sendAccessLink(admin, OWNER_EMAIL, 'invite', originOf(req));
  if ('error' in res) {
    console.error('[bootstrap] invitation failed', res.error);
    return NextResponse.json({ ok: false, error: 'invite_failed', detail: res.error }, { status: 502 });
  }
  const { error } = await admin.from('profiles').upsert({ id: res.userId, email: OWNER_EMAIL, role: 'owner' }, { onConflict: 'id' });
  if (error) {
    console.error('[bootstrap] profile failed', error.message);
    return NextResponse.json({ ok: false, error: 'profile_failed' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
