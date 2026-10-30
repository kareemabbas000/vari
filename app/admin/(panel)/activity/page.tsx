'use client';

import { useMemo, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { Badge, EmptyState, Input, PageHeader, Spinner } from '@/components/admin/ui';
import { formatDate, must, useLoad } from '@/components/admin/hooks';

const ENTITY: Record<string, string> = {
  projects: 'Project',
  categories: 'Category',
  services: 'Service',
  media: 'Image',
  content_blocks: 'Texts',
  site_settings: 'Settings',
  contact_submissions: 'Enquiry',
  newsletter_subscribers: 'Subscriber',
  team: 'Team',
};
const ACTION_TONE: Record<string, 'green' | 'blue' | 'red' | 'gold' | 'grey'> = { insert: 'green', update: 'blue', delete: 'red', invite: 'gold', role_change: 'gold', resend: 'grey' };

export default function ActivityPage() {
  const [q, setQ] = useState('');
  const { data, loading, error } = useLoad(async () =>
    must(await supabaseBrowser().from('audit_log').select('id,at,actor_email,action,entity,entity_id,summary').order('at', { ascending: false }).limit(500)),
  );
  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    return (data ?? []).filter((r) => !n || [r.actor_email, r.summary, r.entity, r.action].some((f) => f?.toLowerCase().includes(n)));
  }, [data, q]);

  return (
    <>
      <PageHeader eyebrow="Team" title="Activity log" description="Who changed what, and when (latest 500 changes). People removed from the team appear as “former member”." />
      <Input type="search" placeholder="Filter by person, item or action…" value={q} onChange={(e) => setQ(e.target.value)} className="mb-4 sm:max-w-sm" />
      {loading ? (
        <Spinner />
      ) : error ? (
        <p className="text-[#E8A598]">{error}</p>
      ) : !rows.length ? (
        <EmptyState title="No activity yet" body="Changes made in the panel will be listed here." />
      ) : (
        <ol className="divide-y divide-bone/10 rounded-sm border border-bone/10 bg-[#141312]">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
              <span className="w-36 shrink-0 text-xs text-bone/40">{formatDate(r.at, true)}</span>
              <span className="flex shrink-0 items-center gap-2">
                <Badge tone={ACTION_TONE[r.action] ?? 'grey'}>{r.action.replace('_', ' ')}</Badge>
                <span className="text-sm text-bone/70">{ENTITY[r.entity] ?? r.entity}</span>
              </span>
              <span className="min-w-0 flex-1 truncate text-sm">{r.summary || r.entity_id}</span>
              <span className="truncate text-xs text-bone/45 sm:max-w-[14rem]">{r.actor_email ?? 'former member'}</span>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
