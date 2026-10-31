import { NextResponse } from 'next/server';
import { assignable, logTeam, requireTeamAdmin, ROLES } from '@/lib/team';
import { sendAccessLink } from '@/lib/panel-auth';
import { EMAIL_RE, clean } from '@/lib/mail';
import { originOf } from '@/lib/request';
import type { AppRole } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/** Team list with sign-in status (admins and owners). */
export async function GET() {
  const ok = await requireTeamAdmin('admin');
  if (ok instanceof NextResponse) return ok;
  const [{ data: profiles, error }, users] = await Promise.all([
    ok.admin.from('profiles').select('id,email,full_name,role,created_at').order('created_at'),
    ok.admin.auth.admin.listUsers({ perPage: 1000 }),
  ]);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  const byId = new Map((users.data?.users ?? []).map((u) => [u.id, u]));
  const members = (profiles ?? []).map((p) => {
    const u = byId.get(p.id);
    return { ...p, last_sign_in_at: u?.last_sign_in_at ?? null, pending: !u?.last_sign_in_at };
  });
  return NextResponse.json({ ok: true, members, me: ok.me, assignable: assignable(ok.me.role) });
}

/** Invite a new team member with a role. */
export async function POST(req: Request) {
  const ok = await requireTeamAdmin('admin');
  if (ok instanceof NextResponse) return ok;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const email = clean(body.email, 254).toLowerCase();
  const name = clean(body.name, 120) || null;
  const role = clean(body.role, 10) as AppRole;
  if (!EMAIL_RE.test(email)) return NextResponse.json({ ok: false, error: 'Enter a valid email address.' }, { status: 422 });
  if (!ROLES.includes(role) || !assignable(ok.me.role).includes(role)) return NextResponse.json({ ok: false, error: 'You cannot assign this role.' }, { status: 403 });

  const { data: existing } = await ok.admin.from('profiles').select('id').eq('email', email).maybeSingle();
  if (existing) return NextResponse.json({ ok: false, error: 'This person is already on the team.' }, { status: 409 });

  const sent = await sendAccessLink(ok.admin, email, 'invite', originOf(req), { shareable: true });
  if ('error' in sent) return NextResponse.json({ ok: false, error: `Could not create the invitation: ${sent.error}` }, { status: 502 });

  const { error } = await ok.admin.from('profiles').upsert({ id: sent.userId, email, full_name: name, role }, { onConflict: 'id' });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  await logTeam(ok, 'invite', `Invited a new ${role}`, sent.userId);
  return NextResponse.json(sent.emailed ? { ok: true, emailed: true } : { ok: true, emailed: false, link: sent.link, reason: sent.reason });
}
