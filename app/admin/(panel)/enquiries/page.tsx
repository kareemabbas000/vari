'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { Badge, Button, EmptyState, Input, PageHeader, Spinner } from '@/components/admin/ui';
import { downloadCsv, formatDate, must, useLoad } from '@/components/admin/hooks';

const TABS = ['new', 'all', 'read', 'replied', 'archived', 'spam'] as const;
const TONE = { new: 'gold', read: 'grey', replied: 'green', archived: 'grey', spam: 'red' } as const;

export default function EnquiriesPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>('new');
  const [q, setQ] = useState('');
  const { data, loading, error } = useLoad(async () =>
    must(
      await supabaseBrowser()
        .from('contact_submissions')
        .select('id,created_at,first_name,last_name,email,message,intent,locale,status')
        .order('created_at', { ascending: false })
        .limit(1000),
    ),
  );

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (data ?? []).filter(
      (r) =>
        (tab === 'all' || r.status === tab) &&
        (!needle || [r.email, r.first_name, r.last_name, r.message].some((f) => f?.toLowerCase().includes(needle))),
    );
  }, [data, tab, q]);

  const counts = useMemo(() => Object.fromEntries(TABS.map((t) => [t, (data ?? []).filter((r) => t === 'all' || r.status === t).length])), [data]);

  return (
    <>
      <PageHeader
        eyebrow="Inbox"
        title="Enquiries"
        description="Every message sent through the website's contact forms, in all three languages."
        actions={
          <Button
            variant="secondary"
            disabled={!rows.length}
            onClick={() =>
              downloadCsv(
                `vari-enquiries-${new Date().toISOString().slice(0, 10)}.csv`,
                rows.map((r) => ({ date: r.created_at, first_name: r.first_name, last_name: r.last_name, email: r.email, intent: r.intent, language: r.locale, status: r.status, message: r.message })),
              )
            }
          >
            Export CSV
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div role="tablist" aria-label="Status" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
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
              {t} <span className="opacity-60">{counts[t] ?? 0}</span>
            </button>
          ))}
        </div>
        <Input type="search" placeholder="Search name, email or message…" value={q} onChange={(e) => setQ(e.target.value)} className="lg:max-w-xs" />
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <p className="text-[#E8A598]">{error}</p>
      ) : !rows.length ? (
        <EmptyState title={tab === 'new' ? 'Inbox zero' : 'Nothing here'} body={tab === 'new' ? 'There are no unread enquiries.' : 'No enquiries match this view.'} />
      ) : (
        <ul className="divide-y divide-bone/10 rounded-sm border border-bone/10 bg-[#141312]">
          {rows.map((r) => {
            const name = [r.first_name, r.last_name].filter(Boolean).join(' ');
            return (
              <li key={r.id}>
                <Link href={`/admin/enquiries/${r.id}`} className="block px-4 py-3.5 transition-colors hover:bg-bone/[0.03] sm:px-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className={`truncate ${r.status === 'new' ? 'font-medium text-bone' : 'text-bone/80'}`}>{name || r.email}</p>
                      {name && <p className="truncate text-xs text-bone/40">{r.email}</p>}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {r.intent !== 'general' && <Badge tone="blue">{r.intent}</Badge>}
                      <Badge tone={TONE[r.status]}>{r.status}</Badge>
                    </div>
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-sm text-bone/50">{r.message || '—'}</p>
                  <p className="mt-1.5 text-xs text-bone/35">
                    {formatDate(r.created_at, true)} · {r.locale.toUpperCase()}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
