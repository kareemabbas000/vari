import { NextResponse } from 'next/server';
import { logTeam, RANK, requireTeamAdmin } from '@/lib/team';
import { sendAccessLink } from '@/lib/panel-auth';
import { originOf } from '@/lib/request';

export const dynamic = 'force-dynamic';

/** Resend an invitation (or a password link if they already signed in once). */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ok = await requireTeamAdmin('admin');
  if (ok instanceof NextResponse) return ok;
  const { id } = await params;
  const { data: t } = await ok.admin.from('profiles').select('id,email,role').eq('id', id).maybeSingle();
  if (!t) return NextResponse.json({ ok: false, error: 'Member not found.' }, { status: 404 });
  if (ok.me.role !== 'owner' && RANK[t.role] >= RANK[ok.me.role]) return NextResponse.json({ ok: false, error: 'You cannot manage this member.' }, { status: 403 });
  const { data: u } = await ok.admin.auth.admin.getUserById(id);
  const sent = await sendAccessLink(ok.admin, t.email, u?.user?.last_sign_in_at ? 'recovery' : 'invite', originOf(req));
  if ('error' in sent) return NextResponse.json({ ok: false, error: `Could not send (${sent.error}).` }, { status: 502 });
  await logTeam(ok, 'resend', 'Resent an access link', id);
  return NextResponse.json({ ok: true });
}
