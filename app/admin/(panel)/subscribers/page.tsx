'use client';

import { useMemo, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { Badge, Button, ConfirmDialog, EmptyState, Input, PageHeader, Spinner, useToast } from '@/components/admin/ui';
import { downloadCsv, formatDate, must, useLoad } from '@/components/admin/hooks';
import { useMember } from '@/components/admin/AdminShell';

const TABS = ['confirmed', 'pending', 'unsubscribed', 'all'] as const;

export default function SubscribersPage() {
  const { can } = useMember();
  const toast = useToast();
  const [tab, setTab] = useState<(typeof TABS)[number]>('confirmed');
  const [q, setQ] = useState('');
  const [remove, setRemove] = useState<{ id: string; email: string } | null>(null);
  const db = supabaseBrowser();
  const { data, setData, loading, error } = useLoad(async () =>
    must(await db.from('newsletter_subscribers').select('id,email,locale,status,created_at,confirmed_at,unsubscribed_at').order('created_at', { ascending: false }).limit(5000)),
  );

  const rows = useMemo(
    () => (data ?? []).filter((r) => (tab === 'all' || r.status === tab) && (!q.trim() || r.email.includes(q.trim().toLowerCase()))),
    [data, tab, q],
  );
  const count = (t: (typeof TABS)[number]) => (data ?? []).filter((r) => t === 'all' || r.status === t).length;

  async function doRemove() {
    if (!remove) return;
    const { error: err } = await db.from('newsletter_subscribers').delete().eq('id', remove.id);
    if (err) return toast('error', err.message);
    setData((data ?? []).filter((r) => r.id !== remove.id));
    toast('success', `${remove.email} erased.`);
    setRemove(null);
  }

  return (
    <>
      <PageHeader
        eyebrow="Inbox"
        title="Newsletter subscribers"
        description="Only confirmed addresses (double opt-in) may receive newsletters. Pending sign-ups expire after 30 days."
        actions={
          <Button
            variant="secondary"
            disabled={!rows.length}
            onClick={() =>
              downloadCsv(
                `vari-subscribers-${tab}-${new Date().toISOString().slice(0, 10)}.csv`,
                rows.map((r) => ({ email: r.email, language: r.locale, status: r.status, signed_up: r.created_at, confirmed: r.confirmed_at ?? '' })),
              )
            }
          >
            Export CSV
          </Button>
        }
      />
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div role="tablist" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
          {TABS.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`min-h-[40px] shrink-0 rounded-sm border px-3 text-[0.72rem] font-medium uppercase tracking-[0.14em] ${
                tab === t ? 'border-gold bg-gold/10 text-gold' : 'border-bone/15 text-bone/55 hover:text-bone'
              }`}
            >
              {t} <span className="opacity-60">{count(t)}</span>
            </button>
          ))}
        </div>
        <Input type="search" placeholder="Search email…" value={q} onChange={(e) => setQ(e.target.value)} className="lg:max-w-xs" />
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <p className="text-[#E8A598]">{error}</p>
      ) : !rows.length ? (
        <EmptyState title="No subscribers here" body="Sign-ups from the website footer appear here once confirmed." />
      ) : (
        <ul className="divide-y divide-bone/10 rounded-sm border border-bone/10 bg-[#141312]">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
              <div className="min-w-0">
                <p className="truncate">{r.email}</p>
                <p className="text-xs text-bone/40">
                  {r.locale.toUpperCase()} · since {formatDate(r.confirmed_at ?? r.created_at)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge tone={r.status === 'confirmed' ? 'green' : r.status === 'pending' ? 'gold' : 'grey'}>{r.status}</Badge>
                {can('admin') && (
                  <Button variant="ghost" size="sm" aria-label={`Erase ${r.email}`} onClick={() => setRemove({ id: r.id, email: r.email })}>
                    Erase
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={!!remove}
        title="Erase subscriber?"
        body={`${remove?.email} is deleted from the database permanently (e.g. a GDPR erasure request).`}
        confirmLabel="Erase permanently"
        onConfirm={doRemove}
        onCancel={() => setRemove(null)}
      />
    </>
  );
}
