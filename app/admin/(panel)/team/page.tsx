'use client';

import { useState } from 'react';
import { Badge, Button, Card, ConfirmDialog, Field, Input, PageHeader, Select, Spinner, useToast } from '@/components/admin/ui';
import Modal from '@/components/admin/Modal';
import { formatDate, useLoad } from '@/components/admin/hooks';
import type { AppRole } from '@/lib/supabase/server';

type Member = { id: string; email: string; full_name: string | null; role: AppRole; created_at: string; last_sign_in_at: string | null; pending: boolean };
type TeamData = { members: Member[]; me: { id: string; role: AppRole }; assignable: AppRole[] };

const RANK: Record<AppRole, number> = { viewer: 1, editor: 2, admin: 3, owner: 4 };
const ABOUT: Record<AppRole, string> = {
  owner: 'Everything, including managing admins. The last owner can never be removed.',
  admin: 'All content, site settings, deleting enquiries, managing editors and viewers.',
  editor: 'Projects, categories, services, texts, media and enquiry statuses.',
  viewer: 'Read-only access to the panel and the inbox.',
};
const TONE: Record<AppRole, 'gold' | 'blue' | 'green' | 'grey'> = { owner: 'gold', admin: 'blue', editor: 'green', viewer: 'grey' };

async function api(url: string, init?: RequestInit) {
  const res = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json' } });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.ok) throw new Error(json.error || `Request failed (${res.status})`);
  return json;
}

export default function TeamPage() {
  const toast = useToast();
  const { data, loading, error, reload } = useLoad<TeamData>(() => api('/api/admin/team'));
  const [invite, setInvite] = useState(false);
  const [form, setForm] = useState({ email: '', name: '', role: 'editor' as AppRole });
  const [busy, setBusy] = useState<string | null>(null);
  const [remove, setRemove] = useState<Member | null>(null);

  const canManage = (m: Member) => !!data && m.id !== data.me.id && (data.me.role === 'owner' || RANK[m.role] < RANK[data.me.role]);

  async function send() {
    setBusy('invite');
    try {
      await api('/api/admin/team', { method: 'POST', body: JSON.stringify(form) });
      toast('success', `Invitation sent to ${form.email}.`);
      setInvite(false);
      setForm({ email: '', name: '', role: 'editor' });
      reload();
    } catch (e) {
      toast('error', (e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function changeRole(m: Member, role: AppRole) {
    setBusy(m.id);
    try {
      await api(`/api/admin/team/${m.id}`, { method: 'PATCH', body: JSON.stringify({ role }) });
      toast('success', `${m.full_name || m.email} is now ${role}.`);
      reload();
    } catch (e) {
      toast('error', (e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function resend(m: Member) {
    setBusy(m.id);
    try {
      await api(`/api/admin/team/${m.id}/resend`, { method: 'POST' });
      toast('success', `A new link was sent to ${m.email}.`);
    } catch (e) {
      toast('error', (e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function doRemove() {
    if (!remove) return;
    setBusy(remove.id);
    try {
      await api(`/api/admin/team/${remove.id}`, { method: 'DELETE' });
      toast('success', `${remove.email} was removed and their account deleted.`);
      setRemove(null);
      reload();
    } catch (e) {
      toast('error', (e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Team"
        title="Members & roles"
        description="Invite people to the control panel and decide what they can do. Removing a member deletes their account entirely."
        actions={data?.assignable.length ? <Button onClick={() => setInvite(true)}>Invite member</Button> : undefined}
      />

      {loading ? (
        <Spinner />
      ) : error ? (
        <p className="text-[#E8A598]">{error === 'not_configured' ? 'Team management needs the server key (SUPABASE_SECRET_KEY) in the environment.' : error}</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <ul className="-my-2 divide-y divide-bone/10">
              {data!.members.map((m) => (
                <li key={m.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold/40 font-display text-gold">{(m.full_name || m.email)[0].toUpperCase()}</span>
                    <div className="min-w-0">
                      <p className="truncate">
                        {m.full_name || m.email} {m.id === data!.me.id && <span className="text-xs text-bone/40">(you)</span>}
                      </p>
                      <p className="truncate text-xs text-bone/45">
                        {m.full_name ? `${m.email} · ` : ''}
                        {m.pending ? 'Invitation pending' : `Last sign-in ${formatDate(m.last_sign_in_at!)}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                    {canManage(m) ? (
                      <Select aria-label={`Role of ${m.email}`} value={m.role} disabled={busy === m.id} onChange={(e) => changeRole(m, e.target.value as AppRole)} className="!min-h-[36px] w-32 !py-1.5 text-sm">
                        {Array.from(new Set([m.role, ...data!.assignable])).map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </Select>
                    ) : (
                      <Badge tone={TONE[m.role]}>{m.role}</Badge>
                    )}
                    {canManage(m) && m.pending && (
                      <Button size="sm" variant="ghost" busy={busy === m.id} onClick={() => resend(m)}>
                        Resend
                      </Button>
                    )}
                    {canManage(m) && (
                      <Button size="sm" variant="danger" onClick={() => setRemove(m)}>
                        Remove
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Card>
          <Card title="Roles">
            <dl className="space-y-4 text-sm">
              {(['owner', 'admin', 'editor', 'viewer'] as AppRole[]).map((r) => (
                <div key={r}>
                  <dt>
                    <Badge tone={TONE[r]}>{r}</Badge>
                  </dt>
                  <dd className="mt-1.5 text-bone/55">{ABOUT[r]}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      )}

      <Modal open={invite} title="Invite a team member" onClose={() => setInvite(false)}>
        <div className="space-y-4 pb-5">
          <Field label="Email" htmlFor="inv-email">
            <Input id="inv-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Name (optional)" htmlFor="inv-name">
            <Input id="inv-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Role" htmlFor="inv-role" hint={ABOUT[form.role]}>
            <Select id="inv-role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as AppRole })}>
              {data?.assignable.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </Field>
          <p className="text-xs leading-relaxed text-bone/45">They receive an email with a link to choose their password. Links expire after 24 hours; you can resend them.</p>
          <Button className="w-full" onClick={send} busy={busy === 'invite'} disabled={!form.email}>
            Send invitation
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!remove}
        title="Remove and delete this account?"
        body={
          <>
            <strong className="text-bone">{remove?.full_name || remove?.email}</strong> loses access immediately. Their login and profile are deleted from the database permanently, and their
            name is removed from the activity log. Content they created stays on the website.
          </>
        }
        confirmLabel="Delete account"
        requireText={remove?.email}
        busy={!!remove && busy === remove.id}
        onConfirm={doRemove}
        onCancel={() => setRemove(null)}
      />
    </>
  );
}
