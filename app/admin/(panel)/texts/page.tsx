'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { getDictionary } from '@/lib/i18n';
import { deepMerge, getAt } from '@/lib/merge';
import { Badge, Input, PageHeader, Spinner } from '@/components/admin/ui';
import { formatDate, must, useLoad } from '@/components/admin/hooks';
import { useLanguages } from '@/components/admin/languages';
import { SECTIONS, SECTION_NAMES, pathLabel, sectionLeaves } from '@/components/admin/texts';
import { SOURCE_LOCALE, type Locale } from '@/lib/i18n/config';

type Hit = { key: string; label: string; values: { code: Locale; text: string }[] };

export default function TextsIndex() {
  const [q, setQ] = useState('');
  const { all: languages, codes } = useLanguages();
  const { data, loading, error } = useLoad(async () => must(await supabaseBrowser().from('content_blocks').select('key,value,updated_at')));

  // Every section's texts, merged with the panel's edits, in every language.
  const sections = useMemo(
    () =>
      SECTIONS.map((key) => {
        const block = data?.find((b) => b.key === key);
        const over = (block?.value || {}) as Partial<Record<Locale, unknown>>;
        const merged = Object.fromEntries(codes.map((l) => [l, deepMerge(getDictionary(l)[key as keyof ReturnType<typeof getDictionary>], over[l])]));
        const leaves = sectionLeaves(key).map((lf) => ({ path: lf.path, values: codes.map((code) => ({ code, text: String(getAt(merged[code], lf.path) ?? '') })) }));
        const missingByLang = Object.fromEntries(
          codes.filter((c) => c !== SOURCE_LOCALE).map((c) => [c, leaves.filter((lf) => lf.values.find((v) => v.code === SOURCE_LOCALE)?.text.trim() && !lf.values.find((v) => v.code === c)?.text.trim()).length]),
        );
        return { key, leaves, missingByLang, edited: !!block, updated: block?.updated_at };
      }),
    [data, codes],
  );

  const n = q.trim().toLowerCase();
  const hits: Hit[] = useMemo(() => {
    if (n.length < 2) return [];
    const out: Hit[] = [];
    for (const s of sections) {
      for (const lf of s.leaves) {
        const label = pathLabel(lf.path);
        if (label.toLowerCase().includes(n) || lf.values.some((v) => v.text.toLowerCase().includes(n))) out.push({ key: s.key, label, values: lf.values });
        if (out.length >= 60) return out;
      }
    }
    return out;
  }, [sections, n]);

  const filteredSections = sections.filter((r) => {
    const meta = SECTION_NAMES[r.key];
    return !n || r.key.toLowerCase().includes(n) || meta?.name.toLowerCase().includes(n) || meta?.about.toLowerCase().includes(n);
  });

  const mark = (text: string) => {
    const i = text.toLowerCase().indexOf(n);
    if (!n || i < 0) return text.length > 140 ? `${text.slice(0, 140)}…` : text;
    const start = Math.max(0, i - 50);
    return (
      <>
        {start > 0 && '…'}
        {text.slice(start, i)}
        <mark className="bg-gold/30 text-bone">{text.slice(i, i + n.length)}</mark>
        {text.slice(i + n.length, i + n.length + 80)}
        {text.length > i + n.length + 80 && '…'}
      </>
    );
  };

  return (
    <>
      <PageHeader
        eyebrow="Content"
        title="Texts & translations"
        description={`Every text on the website, in ${languages.map((l) => l.englishName).join(', ')}. Search for any sentence you see on the site — in any language — and jump straight to it.`}
      />
      <Input type="search" placeholder="Search any text on the website, e.g. “Design With Us”…" value={q} onChange={(e) => setQ(e.target.value)} className="mb-6 sm:max-w-xl" autoFocus />
      {loading ? (
        <Spinner />
      ) : error ? (
        <p className="text-[#E8A598]">{error}</p>
      ) : (
        <>
          {hits.length > 0 && (
            <section className="mb-10">
              <p className="mb-3 font-sans text-[0.72rem] uppercase tracking-[0.16em] text-gold">
                {hits.length >= 60 ? '60+' : hits.length} matching texts
              </p>
              <ul className="space-y-2">
                {hits.map((h) => (
                  <li key={`${h.key}-${h.label}`}>
                    <Link href={`/admin/texts/${h.key}?q=${encodeURIComponent(h.label)}`} className="block rounded-sm border border-bone/10 bg-[#141312] p-4 transition-colors hover:border-gold/50">
                      <p className="text-xs uppercase tracking-[0.14em] text-bone/45">
                        {SECTION_NAMES[h.key]?.name ?? h.key} › {h.label}
                      </p>
                      <div className="mt-2 grid gap-1.5">
                        {h.values.map((v) => (
                          <p key={v.code} className="flex gap-3 text-sm leading-relaxed">
                            <span className="w-7 shrink-0 pt-0.5 font-sans text-[0.65rem] uppercase text-gold/80">{v.code}</span>
                            <span className={v.text ? 'text-bone/80' : 'italic text-bone/30'}>{v.text ? mark(v.text) : 'not translated yet'}</span>
                          </p>
                        ))}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {n.length >= 2 && !hits.length && !filteredSections.length && <p className="mb-6 text-sm text-bone/50">Nothing found. Try fewer words.</p>}

          {(!n || filteredSections.length > 0) && (
            <>
              {n && <p className="mb-3 font-sans text-[0.72rem] uppercase tracking-[0.16em] text-bone/45">Sections</p>}
              <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {filteredSections.map((r) => {
                  const missing = Object.entries(r.missingByLang).filter(([, c]) => c > 0);
                  return (
                    <li key={r.key}>
                      <Link href={`/admin/texts/${r.key}`} className="flex h-full flex-col rounded-sm border border-bone/10 bg-[#141312] p-4 transition-colors hover:border-gold/50">
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-display text-lg leading-tight">{SECTION_NAMES[r.key]?.name ?? r.key}</p>
                          {missing.length ? <Badge tone="red">To translate</Badge> : <Badge tone="green">Complete</Badge>}
                        </div>
                        <p className="mt-1 text-sm text-bone/45">{SECTION_NAMES[r.key]?.about}</p>
                        {missing.length > 0 && (
                          <p className="mt-2 flex flex-wrap gap-1.5">
                            {missing.map(([c, count]) => (
                              <span key={c} className="rounded-sm bg-gold/10 px-1.5 py-0.5 text-[0.65rem] uppercase text-gold">
                                {c} · {count}
                              </span>
                            ))}
                          </p>
                        )}
                        <p className="mt-auto pt-3 text-xs text-bone/35">
                          {r.leaves.length} texts{r.updated ? ` · edited ${formatDate(r.updated)}` : ' · original wording'}
                        </p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </>
      )}
    </>
  );
}
