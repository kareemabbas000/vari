'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { getDictionary } from '@/lib/i18n';
import { deepMerge, getAt } from '@/lib/merge';
import { Badge, Input, PageHeader, Spinner } from '@/components/admin/ui';
import { formatDate, must, useLoad } from '@/components/admin/hooks';
import { SECTIONS, SECTION_NAMES, sectionLeaves } from '@/components/admin/texts';
import type { Locale } from '@/lib/i18n/config';

export default function TextsIndex() {
  const [q, setQ] = useState('');
  const { data, loading, error } = useLoad(async () => must(await supabaseBrowser().from('content_blocks').select('key,value,updated_at')));

  const rows = useMemo(() => {
    return SECTIONS.map((key) => {
      const block = data?.find((b) => b.key === key);
      const over = (block?.value || {}) as Partial<Record<Locale, unknown>>;
      const merged = (l: Locale) => deepMerge(getDictionary(l)[key as keyof ReturnType<typeof getDictionary>], over[l]);
      const ls = sectionLeaves(key);
      const de = merged('de');
      const es = merged('es');
      const en = merged('en');
      const missing = ls.filter((l) => String(getAt(en, l.path) ?? '').trim() && (!String(getAt(de, l.path) ?? '').trim() || !String(getAt(es, l.path) ?? '').trim())).length;
      return { key, count: ls.length, missing, edited: !!block, updated: block?.updated_at };
    }).filter((r) => {
      const n = q.trim().toLowerCase();
      const meta = SECTION_NAMES[r.key];
      return !n || r.key.toLowerCase().includes(n) || meta?.name.toLowerCase().includes(n) || meta?.about.toLowerCase().includes(n);
    });
  }, [data, q]);

  return (
    <>
      <PageHeader
        eyebrow="Content"
        title="Texts & translations"
        description="Every text on the website, in English, German and Spanish. Open a section to edit it side by side; changes go live when you save."
      />
      <Input type="search" placeholder="Find a section…" value={q} onChange={(e) => setQ(e.target.value)} className="mb-4 sm:max-w-sm" />
      {loading ? (
        <Spinner />
      ) : error ? (
        <p className="text-[#E8A598]">{error}</p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((r) => (
            <li key={r.key}>
              <Link href={`/admin/texts/${r.key}`} className="flex h-full flex-col rounded-sm border border-bone/10 bg-[#141312] p-4 transition-colors hover:border-gold/50">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-display text-lg leading-tight">{SECTION_NAMES[r.key]?.name ?? r.key}</p>
                  {r.missing > 0 ? <Badge tone="red">{r.missing} to translate</Badge> : <Badge tone="green">Complete</Badge>}
                </div>
                <p className="mt-1 text-sm text-bone/45">{SECTION_NAMES[r.key]?.about}</p>
                <p className="mt-auto pt-3 text-xs text-bone/35">
                  {r.count} texts{r.updated ? ` · edited ${formatDate(r.updated)}` : ' · original wording'}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
