'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { Badge, Button, Card, ConfirmDialog, Field, Input, PageHeader, Select, Spinner, Switch, useToast } from '@/components/admin/ui';
import Modal from '@/components/admin/Modal';
import { must, usePublish, useLoad } from '@/components/admin/hooks';
import { useMember } from '@/components/admin/AdminShell';
import { BUILTIN_LOCALES } from '@/lib/i18n';
import { SOURCE_LOCALE } from '@/lib/i18n/config';

type Row = { code: string; name: string; english_name: string; og_locale: string; hreflang: string; welcome: string; dir: string; enabled: boolean; is_default: boolean; sort: number };
type Coverage = { done: number; total: number; posts: number };

/** Common languages, pre-filled when adding one. */
const PRESETS: Omit<Row, 'enabled' | 'is_default' | 'sort'>[] = [
  { code: 'fr', name: 'Français', english_name: 'French', og_locale: 'fr_FR', hreflang: 'fr', welcome: 'Bienvenue', dir: 'ltr' },
  { code: 'it', name: 'Italiano', english_name: 'Italian', og_locale: 'it_IT', hreflang: 'it', welcome: 'Benvenuti', dir: 'ltr' },
  { code: 'pt', name: 'Português', english_name: 'Portuguese', og_locale: 'pt_PT', hreflang: 'pt', welcome: 'Bem-vindo', dir: 'ltr' },
  { code: 'nl', name: 'Nederlands', english_name: 'Dutch', og_locale: 'nl_NL', hreflang: 'nl', welcome: 'Welkom', dir: 'ltr' },
  { code: 'pl', name: 'Polski', english_name: 'Polish', og_locale: 'pl_PL', hreflang: 'pl', welcome: 'Witamy', dir: 'ltr' },
  { code: 'ar', name: 'العربية', english_name: 'Arabic', og_locale: 'ar_AR', hreflang: 'ar', welcome: 'أهلاً وسهلاً', dir: 'rtl' },
  { code: 'ru', name: 'Русский', english_name: 'Russian', og_locale: 'ru_RU', hreflang: 'ru', welcome: 'Добро пожаловать', dir: 'ltr' },
  { code: 'zh', name: '中文', english_name: 'Chinese', og_locale: 'zh_CN', hreflang: 'zh', welcome: '欢迎', dir: 'ltr' },
  { code: 'ja', name: '日本語', english_name: 'Japanese', og_locale: 'ja_JP', hreflang: 'ja', welcome: 'ようこそ', dir: 'ltr' },
];

const empty = (): Row => ({ code: '', name: '', english_name: '', og_locale: '', hreflang: '', welcome: '', dir: 'ltr', enabled: false, is_default: false, sort: 100 });

export default function LanguagesPage() {
  const db = supabaseBrowser();
  const toast = useToast();
  const publish = usePublish();
  const router = useRouter();
  const { can } = useMember();
  const [editing, setEditing] = useState<{ row: Row; isNew: boolean } | null>(null);
  const [confirmOff, setConfirmOff] = useState<Row | null>(null);
  const [busy, setBusy] = useState('');

  const { data, loading, error, reload } = useLoad(async () => {
    const [langs, projects, services, categories, posts] = await Promise.all([
      db.from('languages').select('*').order('sort'),
      db.from('projects').select('title,label,description'),
      db.from('services').select('title,body'),
      db.from('categories').select('name'),
      db.from('blog_post_translations').select('locale,ready'),
    ]);
    const rows = must(langs) as Row[];
    // Coverage of structured content (projects, services, categories) per language.
    const fields: Record<string, string>[] = [];
    for (const p of must(projects)) fields.push(p.title as Record<string, string>, p.label as Record<string, string>, p.description as Record<string, string>);
    for (const s of must(services)) fields.push(s.title as Record<string, string>, s.body as Record<string, string>);
    for (const c of must(categories)) fields.push(c.name as Record<string, string>);
    const withSource = fields.filter((f) => f && f[SOURCE_LOCALE]?.trim());
    const coverage: Record<string, Coverage> = {};
    for (const r of rows) {
      coverage[r.code] = {
        done: withSource.filter((f) => f[r.code]?.trim()).length,
        total: withSource.length,
        posts: (must(posts) as { locale: string; ready: boolean }[]).filter((p) => p.locale === r.code && p.ready).length,
      };
    }
    return { rows, coverage };
  });

  if (loading) return <Spinner />;
  if (error || !data) return <p className="text-[#E8A598]">{error}</p>;
  const admin = can('admin');

  async function after(msg: string) {
    await reload();
    router.refresh(); // the panel's language list updates too
    publish(msg);
  }

  async function setEnabled(r: Row, enabled: boolean) {
    setBusy(r.code);
    const res = await db.from('languages').update({ enabled }).eq('code', r.code).select('code');
    setBusy('');
    setConfirmOff(null);
    if (res.error || !res.data?.length) return toast('error', res.error?.message.includes('At least one') ? 'At least one language must stay enabled.' : res.error?.message || 'Not saved — sign in again.');
    after(enabled ? `${r.english_name} is live` : `${r.english_name} switched off`);
  }

  async function makeDefault(r: Row) {
    setBusy(r.code);
    const res = await db.rpc('set_default_language', { p_code: r.code });
    setBusy('');
    if (res.error) return toast('error', res.error.message);
    after(`${r.english_name} is now the default language`);
  }

  async function move(i: number, dir: -1 | 1) {
    const rows = [...data!.rows];
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    [rows[i], rows[j]] = [rows[j], rows[i]];
    await Promise.all(rows.map((r, k) => db.from('languages').update({ sort: (k + 1) * 10 }).eq('code', r.code)));
    after('Language order');
  }

  async function save() {
    if (!editing) return;
    const r = editing.row;
    const code = r.code.trim().toLowerCase();
    if (!/^[a-z]{2,3}(-[a-z]{2,4})?$/.test(code)) return toast('error', 'Use an ISO language code such as “fr” or “pt-br”.');
    if (!r.name.trim() || !r.english_name.trim()) return toast('error', 'Enter the native and the English name.');
    if (!/^[a-z]{2,3}_[A-Z]{2}$/.test(r.og_locale)) return toast('error', 'Social locale looks like “fr_FR”.');
    setBusy('save');
    const row = { name: r.name.trim(), english_name: r.english_name.trim(), og_locale: r.og_locale, hreflang: (r.hreflang || code).trim(), welcome: r.welcome.trim(), dir: r.dir };
    const res = editing.isNew
      ? await db.from('languages').insert({ ...row, code, enabled: false, is_default: false, sort: (data!.rows.length + 1) * 10 }).select('code')
      : await db.from('languages').update(row).eq('code', r.code).select('code');
    setBusy('');
    if (res.error) return toast('error', res.error.message.includes('duplicate') ? 'This language already exists.' : res.error.message);
    setEditing(null);
    toast('success', editing.isNew ? `${row.english_name} added — translate it, then switch it on.` : 'Language saved.');
    after('Languages');
  }

  return (
    <>
      <PageHeader
        eyebrow="Site"
        title="Languages"
        description="Switch languages on or off, choose the default and add new ones. A language that is off disappears everywhere: menus, language switcher, intro, blog, sitemap and search-engine links — its addresses send visitors to the same page in their language."
        actions={admin ? <Button onClick={() => setEditing({ row: empty(), isNew: true })}>Add language</Button> : undefined}
      />

      <div className="grid gap-4">
        {data.rows.map((r, i) => {
          const c = data.coverage[r.code];
          const pct = c.total ? Math.round((c.done / c.total) * 100) : 100;
          const builtIn = BUILTIN_LOCALES.includes(r.code);
          return (
            <Card key={r.code}>
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-sm border font-display text-lg ${r.enabled ? 'border-gold/50 text-gold' : 'border-bone/15 text-bone/35'}`}>{r.code.toUpperCase()}</span>
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-lg">
                      {r.name} <span className="text-sm text-bone/45">{r.english_name}</span>
                      {r.is_default && <Badge tone="gold">Default</Badge>}
                      {r.enabled ? <Badge tone="green">Live</Badge> : <Badge>Off</Badge>}
                      {r.dir === 'rtl' && <Badge tone="blue">Right-to-left</Badge>}
                    </p>
                    <p className="mt-1 text-xs text-bone/45">
                      {builtIn ? 'Built-in interface translation' : 'Interface starts in English — translate it under Texts & translations'} · content {pct}% translated · {c.posts} article{c.posts === 1 ? '' : 's'} ready
                    </p>
                    <div className="mt-2 h-1 w-full max-w-xs overflow-hidden rounded-full bg-bone/10" aria-hidden>
                      <div className={`h-full ${pct === 100 ? 'bg-emerald-400' : 'bg-gold'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
                {admin && (
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="w-44">
                      <Switch checked={r.enabled} disabled={r.is_default || busy === r.code} onChange={(on) => (on ? setEnabled(r, true) : setConfirmOff(r))} label={r.enabled ? 'On' : 'Off'} />
                    </div>
                    {!r.is_default && (
                      <Button size="sm" variant="secondary" onClick={() => makeDefault(r)} busy={busy === r.code}>
                        Make default
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => setEditing({ row: { ...r }, isNew: false })}>Edit</Button>
                    <Button size="sm" variant="ghost" aria-label="Move up" onClick={() => move(i, -1)}>↑</Button>
                    <Button size="sm" variant="ghost" aria-label="Move down" onClick={() => move(i, 1)}>↓</Button>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6">
        <p className="text-sm leading-relaxed text-bone/60">
          Where to translate: interface texts under <Link href="/admin/texts" className="text-gold hover:underline">Texts & translations</Link> (search any sentence on the site), projects, services and categories in their editors, pages in the{' '}
          <Link href="/admin/pages" className="text-gold hover:underline">page builder</Link> and articles in the <Link href="/admin/blog" className="text-gold hover:underline">blog</Link>. Every field has a tab per language; anything not yet translated falls back to English.
        </p>
      </Card>

      <Modal open={!!editing} title={editing?.isNew ? 'Add a language' : `Edit ${editing?.row.english_name}`} onClose={() => setEditing(null)}>
        {editing && (
          <div className="space-y-4 pb-6">
            {editing.isNew && (
              <Field label="Start from" htmlFor="preset">
                <Select id="preset" value="" onChange={(e) => { const p = PRESETS.find((x) => x.code === e.target.value); if (p) setEditing({ isNew: true, row: { ...editing.row, ...p } }); }}>
                  <option value="">Choose a common language…</option>
                  {PRESETS.filter((p) => !data.rows.some((r) => r.code === p.code)).map((p) => (
                    <option key={p.code} value={p.code}>{p.english_name} — {p.name}</option>
                  ))}
                </Select>
              </Field>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Code (ISO 639)" htmlFor="code" hint="Used in the address: /fr/…">
                <Input id="code" value={editing.row.code} disabled={!editing.isNew} onChange={(e) => setEditing({ ...editing, row: { ...editing.row, code: e.target.value.toLowerCase() } })} />
              </Field>
              <Field label="Search-engine code (hreflang)" htmlFor="hl" hint="Usually the same, e.g. fr or pt-BR">
                <Input id="hl" value={editing.row.hreflang} onChange={(e) => setEditing({ ...editing, row: { ...editing.row, hreflang: e.target.value } })} />
              </Field>
              <Field label="Native name" htmlFor="nn" hint="Shown to visitors, e.g. Français">
                <Input id="nn" value={editing.row.name} onChange={(e) => setEditing({ ...editing, row: { ...editing.row, name: e.target.value } })} />
              </Field>
              <Field label="English name" htmlFor="en">
                <Input id="en" value={editing.row.english_name} onChange={(e) => setEditing({ ...editing, row: { ...editing.row, english_name: e.target.value } })} />
              </Field>
              <Field label="Social locale" htmlFor="og" hint="For link previews, e.g. fr_FR">
                <Input id="og" value={editing.row.og_locale} onChange={(e) => setEditing({ ...editing, row: { ...editing.row, og_locale: e.target.value } })} />
              </Field>
              <Field label="Welcome word" htmlFor="wel" hint="Shown on the intro's language choice">
                <Input id="wel" value={editing.row.welcome} onChange={(e) => setEditing({ ...editing, row: { ...editing.row, welcome: e.target.value } })} />
              </Field>
            </div>
            <Field label="Writing direction" htmlFor="dir">
              <Select id="dir" value={editing.row.dir} onChange={(e) => setEditing({ ...editing, row: { ...editing.row, dir: e.target.value } })}>
                <option value="ltr">Left to right</option>
                <option value="rtl">Right to left (Arabic, Hebrew…)</option>
              </Select>
            </Field>
            {editing.isNew && <p className="text-xs leading-relaxed text-bone/45">New languages start switched off and use English wherever a translation is missing. Translate the texts, then switch the language on.</p>}
            <Button className="w-full" onClick={save} busy={busy === 'save'}>{editing.isNew ? 'Add language' : 'Save'}</Button>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirmOff}
        title={`Switch off ${confirmOff?.english_name}?`}
        body={<>The {confirmOff?.english_name} version disappears from the website, menus, intro, blog and sitemap, and its addresses forward visitors to the same page in another language. Nothing is deleted — switch it back on at any time.</>}
        confirmLabel="Switch off"
        onConfirm={async () => {
          if (confirmOff) await setEnabled(confirmOff, false);
        }}
        onCancel={() => setConfirmOff(null)}
      />
    </>
  );
}
