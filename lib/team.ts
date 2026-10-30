import { NextResponse } from 'next/server';
import { currentMember, type AppRole } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const ROLES: AppRole[] = ['viewer', 'editor', 'admin', 'owner'];
export const RANK: Record<AppRole, number> = { viewer: 1, editor: 2, admin: 3, owner: 4 };

/** Roles a member may hand out: owners any, everyone else strictly below themselves. */
export function assignable(by: AppRole): AppRole[] {
  return ROLES.filter((r) => (by === 'owner' ? true : RANK[r] < RANK[by]));
}

type Ok = { me: { id: string; email: string; role: AppRole }; admin: NonNullable<ReturnType<typeof supabaseAdmin>> };

/** Signed-in member with at least `min`, plus the privileged client — or an error response. */
export async function requireTeamAdmin(min: AppRole = 'admin'): Promise<Ok | NextResponse> {
  const m = await currentMember();
  if (!m?.profile) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  if (RANK[m.profile.role] < RANK[min]) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ ok: false, error: 'not_configured' }, { status: 503 });
  return { me: { id: m.profile.id, email: m.profile.email, role: m.profile.role }, admin };
}

/** Team changes are logged by the server (they don't run with a user session). */
export async function logTeam(ok: Ok, action: string, summary: string, entityId?: string) {
  await ok.admin.from('audit_log').insert({ actor: ok.me.id, actor_email: ok.me.email, action, entity: 'team', entity_id: entityId ?? null, summary: summary.slice(0, 300) });
}
