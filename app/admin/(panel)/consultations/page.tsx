'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { Badge, Button, Card, EmptyState, Input, PageHeader, Spinner } from '@/components/admin/ui';
import { downloadCsv, formatDate, must, useLoad } from '@/components/admin/hooks';
import { CONSULT_STATUSES, PROJECT_LABEL, STATUS_LABEL, STATUS_TONE, TRIGGER_LABEL, type ConsultStatus } from '@/components/admin/consultations';

const TABS = ['new', 'all', ...CONSULT_STATUSES.filter((s) => s !== 'new')] as const;

/**
 * Inbox → Free consultation calls: requests from the "free 30-minute project call" offer on
 * articles. One query when the page opens (newest 1,000), nothing in the background.
 */
export default function ConsultationsPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>('new');
  const [q, setQ] = useState('');
  const { data, loading, error } = useLoad(async () =>
    must(
      await supabaseBrowser()
        .from('consultation_requests')
        .select('id,created_at,name,email,phone,preferred_time,timezone,project_type,locale,source_title,source_path,trigger,status,scheduled_at')
        .order('created_at', { ascending: false })
        .limit(1000),
    ),
  );

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (data ?? []).filter(
      (r) => (tab === 'all' || r.status === tab) && (!needle || [r.name, r.email, r.phone, r.source_title].some((f) => f?.toLowerCase().includes(needle))),
    );
  }, [data, tab, q]);
  const counts = useMemo(() => Object.fromEntries(TABS.map((t) => [t, (data ?? []).filter((r) => t === 'all' || r.status === t).length])), [data]);

  // Which placement brings requests: helps decide what to keep (last 90 days).
  const sources = useMemo(() => {
    const since = Date.now() - 90 * 86_400_000;
    const m = new Map<string, number>();
    (data ?? []).filter((r) => new Date(r.created_at).getTime() >= since).forEach((r) => m.set(r.trigger || 'other', (m.get(r.trigger || 'other') ?? 0) + 1));
    return [...m].sort((a, b) => b[1] - a[1]);
  }, [data]);
  const total90 = sources.reduce((a, [, n]) => a + n, 0);

  return (
    <>
      <PageHeader
        eyebrow="Inbox"
        title="Free consultation calls"
        description="Requests for the free 30-minute project call offered on the articles. Reply quickly: a call booked within a day is far more likely to happen."
        actions={
          <Button
            variant="secondary"
            disabled={!rows.length}
            onClick={() =>
              downloadCsv(
                `vari-consultations-${new Date().toISOString().slice(0, 10)}.csv`,
                rows.map((r) => ({ date: r.created_at, name: r.name, email: r.email, phone: r.phone, project: r.project_type, preferred_time: r.preferred_time, timezone: r.timezone, language: r.locale, from: r.source_title || r.source_path, placement: r.trigger, status: r.status, scheduled_at: r.scheduled_at })),
              )
            }
          >
            Export CSV
          </Button>
        }
      />

      {total90 > 0 && (
        <Card title="Where requests come from (last 90 days)" className="mb-6">
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sources.map(([k, n]) => (
              <li key={k} className="flex items-center gap-3 text-sm">
                <span className="w-40 shrink-0 truncate text-bone/70">{TRIGGER_LABEL[k] ?? k}</span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-bone/10">
                  <span className="block h-full bg-gold" style={{ width: `${Math.round((n / total90) * 100)}%` }} />
                </span>
                <span className="w-8 text-right tabular-nums text-bone/60">{n}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div role="tablist" aria-label="Status" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
          {TABS.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`min-h-[40px] shrink-0 rounded-sm border px-3 text-[0.72rem] font-medium uppercase tracking-[0.14em] ${tab === t ? 'border-gold bg-gold/10 text-gold' : 'border-bone/15 text-bone/55 hover:text-bone'}`}
            >
              {t === 'all' ? 'All' : STATUS_LABEL[t as ConsultStatus]} <span className="opacity-60">{counts[t] ?? 0}</span>
            </button>
          ))}
        </div>
        <Input type="search" placeholder="Search name, email, phone or article…" value={q} onChange={(e) => setQ(e.target.value)} className="lg:max-w-xs" />
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <p className="text-[#E8A598]">{/relation|does not exist|schema cache/i.test(error) ? 'The consultation table is not set up yet: run supabase/migrations/20261122090000_consultations.sql in Supabase.' : error}</p>
      ) : !rows.length ? (
        <EmptyState title={tab === 'new' ? 'No new requests' : 'Nothing here'} body={tab === 'new' ? 'New requests for a free call appear here.' : 'No requests match this view.'} />
      ) : (
        <ul className="divide-y divide-bone/10 rounded-sm border border-bone/10 bg-[#141312]">
          {rows.map((r) => (
            <li key={r.id}>
              <Link href={`/admin/consultations/${r.id}`} className="block px-4 py-3.5 transition-colors hover:bg-bone/[0.03] sm:px-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className={`truncate ${r.status === 'new' ? 'font-medium text-bone' : 'text-bone/80'}`}>{r.name}</p>
                    <p className="truncate text-xs text-bone/40">
                      {r.email}
                      {r.phone ? ` · ${r.phone}` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                    <Badge tone="grey">{PROJECT_LABEL[r.project_type] ?? r.project_type}</Badge>
                    <Badge tone={STATUS_TONE[r.status as ConsultStatus] ?? 'grey'}>{STATUS_LABEL[r.status as ConsultStatus] ?? r.status}</Badge>
                  </div>
                </div>
                {r.preferred_time && (
                  <p className="mt-1.5 text-sm text-bone/60">
                    Prefers: {r.preferred_time}
                    {r.timezone ? <span className="text-bone/35"> ({r.timezone})</span> : null}
                  </p>
                )}
                <p className="mt-1.5 truncate text-xs text-bone/35">
                  {formatDate(r.created_at, true)} · {r.locale.toUpperCase()}
                  {r.source_title ? ` · ${r.source_title}` : ''}
                  {r.scheduled_at ? ` · Call: ${formatDate(r.scheduled_at, true)}` : ''}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
