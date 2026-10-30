'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { Badge, Button, Card, Field, Input, PageHeader, useToast } from '@/components/admin/ui';
import { useMember } from '@/components/admin/AdminShell';

export default function AccountPage() {
  const me = useMember();
  const router = useRouter();
  const toast = useToast();
  const db = supabaseBrowser();
  const [name, setName] = useState(me.name || '');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => setName(me.name || ''), [me.name]);

  async function saveName() {
    setBusy('name');
    const { data } = await db.auth.getUser();
    const { error } = await db.from('profiles').update({ full_name: name.trim() || null }).eq('id', data.user!.id);
    setBusy(null);
    if (error) return toast('error', error.message);
    toast('success', 'Name saved.');
    router.refresh();
  }

  async function savePassword() {
    if (pw.length < 10) return toast('error', 'Use at least 10 characters.');
    if (pw !== pw2) return toast('error', 'The passwords do not match.');
    setBusy('pw');
    const { error } = await db.auth.updateUser({ password: pw });
    setBusy(null);
    if (error) return toast('error', error.message);
    setPw('');
    setPw2('');
    toast('success', 'Password changed.');
  }

  async function signOutEverywhere() {
    setBusy('out');
    await db.auth.signOut({ scope: 'global' });
    router.replace('/admin/login');
  }

  return (
    <>
      <PageHeader eyebrow="Account" title="Your account" description={me.email} actions={<Badge tone="gold">{me.role}</Badge>} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Profile">
          <div className="space-y-4">
            <Field label="Your name" htmlFor="name" hint="Shown to the team in the activity log.">
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
            </Field>
            <Button variant="secondary" onClick={saveName} busy={busy === 'name'}>
              Save name
            </Button>
          </div>
        </Card>
        <Card title="Password">
          <div className="space-y-4">
            <Field label="New password" htmlFor="pw" hint="At least 10 characters.">
              <Input id="pw" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
            </Field>
            <Field label="Repeat password" htmlFor="pw2">
              <Input id="pw2" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
            </Field>
            <Button variant="secondary" onClick={savePassword} busy={busy === 'pw'} disabled={!pw}>
              Change password
            </Button>
          </div>
        </Card>
        <Card title="Sessions">
          <p className="mb-4 text-sm text-bone/55">Signed in on a shared or lost device? Sign out of the panel everywhere.</p>
          <Button variant="danger" onClick={signOutEverywhere} busy={busy === 'out'}>
            Sign out on all devices
          </Button>
        </Card>
      </div>
    </>
  );
}
