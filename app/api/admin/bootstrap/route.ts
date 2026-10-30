import { NextResponse } from 'next/server';
import { OWNER_EMAIL, supabaseAdmin } from '@/lib/supabase/admin';
import { maskEmail, sendAccessLink } from '@/lib/panel-auth';
import { originOf } from '@/lib/request';

export const dynamic = 'force-dynamic';

async function ownerExists() {
  const admin = supabaseAdmin();
  if (!admin) return null;
  const { count } = await admin.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'owner');
  return (count ?? 0) > 0;
}

/** Whether the one-time owner setup is still open (no owner account exists yet). */
export async function GET() {
  const exists = await ownerExists();
  return NextResponse.json({ needsSetup: exists !== true, configured: exists !== null, ownerHint: maskEmail(OWNER_EMAIL) });
}

/**
 * One-time owner setup: invites the configured owner email (ADMIN_OWNER_EMAIL). Only works
 * while no owner exists, and only ever emails that one address — so pressing the button
 * can never hand control to anyone else.
 */
export async function POST(req: Request) {
  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ ok: false, error: 'not_configured' }, { status: 503 });
  if (await ownerExists()) return NextResponse.json({ ok: false, error: 'already_set_up' }, { status: 409 });

  const res = await sendAccessLink(admin, OWNER_EMAIL, 'invite', originOf(req));
  if ('error' in res) {
    console.error('[bootstrap] invitation failed', res.error);
    return NextResponse.json({ ok: false, error: 'invite_failed' }, { status: 502 });
  }
  const { error } = await admin.from('profiles').upsert({ id: res.userId, email: OWNER_EMAIL, role: 'owner' }, { onConflict: 'id' });
  if (error) {
    console.error('[bootstrap] profile failed', error.message);
    return NextResponse.json({ ok: false, error: 'profile_failed' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
