'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { getDictionary, type Dictionary } from '@/lib/i18n';
import { locales, type Locale } from '@/lib/i18n/config';
import { deepMerge, getAt, setAt } from '@/lib/merge';
import { Button, Card, Input, PageHeader, Spinner, Switch, useToast } from '@/components/admin/ui';
import I18nInput, { type I18nValue } from '@/components/admin/I18nInput';
import { must, usePublish, useLoad } from '@/components/admin/hooks';
import { SECTION_NAMES, pathLabel, sectionLeaves } from '@/components/admin/texts';
import { useMember } from '@/components/admin/AdminShell';
import type { Json } from '@/lib/database.types';

type Values = Record<string, I18nValue>; // path key → texts per language
const keyOf = (path: (string | number)[]) => path.join('.');

export default function TextSectionEditor() {
  const { key } = useParams<{ key: string }>();
  const db = supabaseBrowser();
  const toast = useToast();
  const publish = usePublish();
  const { can } = useMember();
  const leafs = useMemo(() => sectionLeaves(key), [key]);
  const original = (l: Locale) => getDictionary(l)[key as keyof Dictionary];
  const [values, setValues] = useState<Values>({});
  const [q, setQ] = useState('');
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data, loading, error } = useLoad(async () => must(await db.from('content_blocks').select('key,value').eq('key', key).maybeSingle()), [key]);

  useEffect(() => {
    if (loading) return;
    const over = ((data?.value as Record<string, unknown>) || {}) as Partial<Record<Locale, unknown>>;
    const merged = Object.fromEntries(locales.map((l) => [l, deepMerge(original(l), over[l])])) as Record<Locale, unknown>;
    const v: Values = {};
    leafs.forEach((lf) => {
      v[keyOf(lf.path)] = Object.fromEntries(locales.map((l) => [l, String(getAt(merged[l], lf.path) ?? '')]));
    });
    setValues(v);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, loading, key]);

  const visible = leafs.filter((lf) => {
    const v = values[keyOf(lf.path)] || {};
    if (onlyMissing && !(v.en?.trim() && (!v.de?.trim() || !v.es?.trim()))) return false;
    const n = q.trim().toLowerCase();
    return !n || pathLabel(lf.path).toLowerCase().includes(n) || locales.some((l) => v[l]?.toLowerCase().includes(n));
  });

  async function save() {
    setSaving(true);
    // Store only what differs from the original wording, per language.
    const diff: Partial<Record<Locale, unknown>> = {};
    for (const l of locales) {
      let d: unknown = undefined;
      for (const lf of leafs) {
        const now = values[keyOf(lf.path)]?.[l] ?? '';
        const orig = String(getAt(original(l), lf.path) ?? '');
        if (now !== orig) d = setAt(d ?? (typeof lf.path[0] === 'number' ? [] : {}), lf.path, now);
      }
      if (d !== undefined) diff[l] = d;
    }
    const empty = !Object.keys(diff).length;
    const res = empty
      ? await db.from('content_blocks').delete().eq('key', key)
      : await db.from('content_blocks').upsert({ key, value: diff as Json }, { onConflict: 'key' });
    setSaving(false);
    if (res.error) return toast('error', res.error.message);
    publish(SECTION_NAMES[key]?.name ?? 'Texts');
  }

  const reset = (path: (string | number)[]) =>
    setValues((v) => ({ ...v, [keyOf(path)]: Object.fromEntries(locales.map((l) => [l, String(getAt(original(l), path) ?? '')])) }));

  if (!leafs.length) return <p className="text-bone/60">Unknown section.</p>;
  if (loading) return <Spinner />;
  if (error) return <p className="text-[#E8A598]">{error}</p>;

  const missingCount = leafs.filter((lf) => {
    const v = values[keyOf(lf.path)] || {};
    return v.en?.trim() && (!v.de?.trim() || !v.es?.trim());
  }).length;

  return (
    <>
      <Link href="/admin/texts" className="mb-4 inline-block text-sm text-bone/50 hover:text-gold">
        ← Texts & translations
      </Link>
      <PageHeader
        title={SECTION_NAMES[key]?.name ?? key}
        description={`${leafs.length} texts · ${missingCount ? `${missingCount} need a translation` : 'fully translated'}. Words in a headline that appear in “italic” lists keep the gold italic style.`}
        actions={can('editor') ? <Button onClick={save} busy={saving}>Save & publish</Button> : undefined}
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input type="search" placeholder="Search texts in any language…" value={q} onChange={(e) => setQ(e.target.value)} className="sm:max-w-sm" />
        <div className="sm:w-72">
          <Switch checked={onlyMissing} onChange={setOnlyMissing} label="Only missing translations" />
        </div>
      </div>

      <fieldset disabled={!can('editor')} className="space-y-3">
        {visible.map((lf) => {
          const k = keyOf(lf.path);
          const v = values[k] || {};
          const changed = locales.some((l) => (v[l] ?? '') !== String(getAt(original(l), lf.path) ?? ''));
          return (
            <Card key={k}>
              <I18nInput
                label={pathLabel(lf.path) || (SECTION_NAMES[key]?.name ?? key)}
                value={v}
                onChange={(nv) => setValues((all) => ({ ...all, [k]: nv }))}
                multiline={lf.value.length > 70 || lf.value.includes('\n')}
                rows={lf.value.length > 240 ? 6 : 3}
              />
              {changed && can('editor') && (
                <button type="button" onClick={() => reset(lf.path)} className="mt-2 text-xs text-bone/40 hover:text-gold">
                  Reset to original wording
                </button>
              )}
            </Card>
          );
        })}
        {!visible.length && <p className="text-sm text-bone/45">No texts match.</p>}
      </fieldset>

      {can('editor') && (
        <div className="sticky bottom-4 mt-6 flex justify-end">
          <Button onClick={save} busy={saving} className="shadow-2xl">
            Save & publish
          </Button>
        </div>
      )}
    </>
  );
}
