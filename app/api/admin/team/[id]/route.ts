import { NextResponse } from 'next/server';
import { assignable, logTeam, RANK, requireTeamAdmin, ROLES } from '@/lib/team';
import type { AppRole } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

async function target(ok: Exclude<Awaited<ReturnType<typeof requireTeamAdmin>>, NextResponse>, id: string) {
  const { data } = await ok.admin.from('profiles').select('id,email,role').eq('id', id).maybeSingle();
  return data;
}

/** Change a member's role. */
export async function PATCH(req: Request, { params }: Params) {
  const ok = await requireTeamAdmin('admin');
  if (ok instanceof NextResponse) return ok;
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const role = String(body.role || '') as AppRole;
  if (id === ok.me.id) return NextResponse.json({ ok: false, error: 'You cannot change your own role.' }, { status: 403 });
  if (!ROLES.includes(role) || !assignable(ok.me.role).includes(role)) return NextResponse.json({ ok: false, error: 'You cannot assign this role.' }, { status: 403 });
  const t = await target(ok, id);
  if (!t) return NextResponse.json({ ok: false, error: 'Member not found.' }, { status: 404 });
  if (ok.me.role !== 'owner' && RANK[t.role] >= RANK[ok.me.role]) return NextResponse.json({ ok: false, error: 'You cannot change this member.' }, { status: 403 });

  const { error } = await ok.admin.from('profiles').update({ role }).eq('id', id);
  if (error) return NextResponse.json({ ok: false, error: error.message.includes('last_owner') ? 'The last owner cannot be demoted.' : error.message }, { status: 409 });
  await logTeam(ok, 'role_change', `Changed a member's role from ${t.role} to ${role}`, id);
  return NextResponse.json({ ok: true });
}

/**
 * Remove a member completely: the Supabase Auth user is hard-deleted, which cascades to
 * their profile; their email is scrubbed from the activity log by the database.
 */
export async function DELETE(_req: Request, { params }: Params) {
  const ok = await requireTeamAdmin('admin');
  if (ok instanceof NextResponse) return ok;
  const { id } = await params;
  if (id === ok.me.id) return NextResponse.json({ ok: false, error: 'You cannot delete your own account here.' }, { status: 403 });
  const t = await target(ok, id);
  if (!t) return NextResponse.json({ ok: false, error: 'Member not found.' }, { status: 404 });
  if (ok.me.role !== 'owner' && RANK[t.role] >= RANK[ok.me.role]) return NextResponse.json({ ok: false, error: 'You cannot remove this member.' }, { status: 403 });

  const { error } = await ok.admin.auth.admin.deleteUser(id, false);
  if (error) return NextResponse.json({ ok: false, error: error.message.includes('last_owner') ? 'The last owner cannot be removed.' : error.message }, { status: 409 });
  await logTeam(ok, 'delete', `Removed a ${t.role} from the team (account deleted)`);
  return NextResponse.json({ ok: true });
}
