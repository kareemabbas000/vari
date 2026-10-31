'use client';

import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { Button, Card, Input, PageHeader, Spinner, Switch, useToast } from '@/components/admin/ui';
import I18nInput, { type I18nValue } from '@/components/admin/I18nInput';
import { must, usePublish, useLoad } from '@/components/admin/hooks';
import { useMember } from '@/components/admin/AdminShell';
import { useLanguages } from '@/components/admin/languages';
import { getDictionary } from '@/lib/i18n';
import type { Json } from '@/lib/database.types';
import { DEFAULT_LAYOUT, type Layout } from '@/lib/layout';

type Item = { label: I18nValue; href: string; newTab?: boolean };
type Announcement = { enabled: boolean; text: I18nValue; link?: { label?: I18nValue; href?: string }; dismissible: boolean; version: number };
type Data = { navigation?: { header?: Item[]; footer?: Item[] }; announcement?: Announcement; layout?: Partial<Layout>; [k: string]: unknown };

/** The built-in menu, labelled in every language from that language's own texts. */
const NAV_KEYS = [
  ['work', '/work'],
  ['services', '/services'],
  ['studio', '/studio'],
  ['blog', '/blog'],
  ['contact', '/contact'],
] as const;
const defaultMenu = (codes: string[]): Item[] => NAV_KEYS.map(([k, href]) => ({ label: Object.fromEntries(codes.map((c) => [c, getDictionary(c).nav[k]])), href }));
const BUILT_IN = ['/', '/work', '/services', '/studio', '/contact', '/blog', '/privacy'];

function MenuEditor({ title, items, onChange, targets, emptyNote, codes }: { title: string; items: Item[]; onChange: (v: Item[]) => void; targets: string[]; emptyNote: string; codes: string[] }) {
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const n = [...items];
    [n[i], n[j]] = [n[j], n[i]];
    onChange(n);
  };
  return (
    <Card
      title={title}
      actions={
        <div className="flex gap-2">
          {!items.length && <Button size="sm" variant="ghost" onClick={() => onChange(defaultMenu(codes))}>Start from current menu</Button>}
          {items.length < 10 && <Button size="sm" variant="secondary" onClick={() => onChange([...items, { label: {}, href: '/' }])}>Add link</Button>}
        </div>
      }
    >
      {!items.length ? (
        <p className="text-sm text-bone/50">{emptyNote}</p>
      ) : (
        <ol className="space-y-3">
          {items.map((it, i) => (
            <li key={i} className="space-y-3 rounded-sm border border-bone/10 p-4">
              <div className="flex items-center justify-between">
                <span className="label text-[0.62rem] text-gold">{String(i + 1).padStart(2, '0')}</span>
                <span className="flex">
                  <Button size="sm" variant="ghost" aria-label="Move up" onClick={() => move(i, -1)}>↑</Button>
                  <Button size="sm" variant="ghost" aria-label="Move down" onClick={() => move(i, 1)}>↓</Button>
                  <Button size="sm" variant="ghost" onClick={() => onChange(items.filter((_, k) => k !== i))}>Remove</Button>
                </span>
              </div>
              <I18nInput label="Text" value={it.label} onChange={(label) => onChange(items.map((x, k) => (k === i ? { ...x, label } : x)))} maxLength={30} />
              <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                <Input list="menu-targets" aria-label="Link" value={it.href} placeholder="/work or https://…" onChange={(e) => onChange(items.map((x, k) => (k === i ? { ...x, href: e.target.value.trim() } : x)))} />
                <div className="sm:w-56">
                  <Switch checked={!!it.newTab} onChange={(newTab) => onChange(items.map((x, k) => (k === i ? { ...x, newTab } : x)))} label="Open in new tab" />
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
      <datalist id="menu-targets">
        {targets.map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>
    </Card>
  );
}

export default function MenusPage() {
  const db = supabaseBrowser();
  const toast = useToast();
  const publish = usePublish();
  const { can } = useMember();
  const { codes } = useLanguages();
  const [header, setHeader] = useState<Item[]>([]);
  const [footer, setFooter] = useState<Item[]>([]);
  const [ann, setAnn] = useState<Announcement>({ enabled: false, text: {}, dismissible: true, version: 1 });
  const [targets, setTargets] = useState<string[]>(BUILT_IN);
  const [layout, setLayout] = useState<Layout>(DEFAULT_LAYOUT);
  const [saving, setSaving] = useState(false);

  const { data, loading, error } = useLoad(async () => must(await db.from('site_settings').select('data').eq('id', 1).single()).data as Data);

  useEffect(() => {
    if (!data) return;
    setHeader(data.navigation?.header || []);
    setFooter(data.navigation?.footer || []);
    setAnn({ enabled: false, text: {}, dismissible: true, version: 1, ...(data.announcement || {}) });
    setLayout({ header: { ...DEFAULT_LAYOUT.header, ...(data.layout?.header || {}) }, footer: { ...DEFAULT_LAYOUT.footer, ...(data.layout?.footer || {}) } });
    db.from('pages').select('slug').eq('kind', 'custom').then(({ data: pages }) => setTargets([...BUILT_IN, ...(pages || []).map((p) => `/${p.slug}`)]));
  }, [data, db]);

  if (loading) return <Spinner />;
  if (error) return <p className="text-[#E8A598]">{error}</p>;
  if (!can('admin')) return <p className="text-bone/60">Only admins can change menus.</p>;

  async function save() {
    if (!data) return;
    const bad = [...header, ...footer].find((i) => !i.label.en?.trim() || !i.href);
    if (bad) return toast('error', 'Every menu link needs an English text and an address.');
    if (ann.enabled && !ann.text.en?.trim()) return toast('error', 'Write the announcement text (English at least).');
    setSaving(true);
    // A changed announcement is shown again to visitors who closed the previous one.
    const prev = data.announcement;
    const changed = JSON.stringify(prev?.text) !== JSON.stringify(ann.text) || JSON.stringify(prev?.link) !== JSON.stringify(ann.link);
    const next = { ...data, layout, navigation: { header, footer }, announcement: { ...ann, version: changed ? (prev?.version || 1) + 1 : ann.version } };
    const res = await db.from('site_settings').update({ data: next as unknown as Json }).eq('id', 1).select('id');
    setSaving(false);
    if (res.error || !res.data?.length) return toast('error', res.error?.message || 'Not saved — sign in again.');
    publish('Menus');
  }

  return (
    <>
      <PageHeader eyebrow="Site" title="Menus, header & footer" description="Choose the menu links (including pages you build), what the header and footer show, and a message bar above the menu." actions={<Button onClick={save} busy={saving}>Save & publish</Button>} />

      <Card title="Announcement bar" className="mb-6">
        <div className="space-y-5">
          <Switch checked={ann.enabled} onChange={(enabled) => setAnn({ ...ann, enabled })} label="Show the announcement bar" description="A slim gold bar above the menu on every page — for news, offers or events." />
          {ann.enabled && (
            <>
              <div className="flex min-h-10 items-center justify-center rounded-sm bg-gold px-10 py-2 text-center text-[0.8rem] text-night">
                {ann.text.en || 'Your message appears here'}
                {ann.link?.label?.en && <span className="ml-1 font-medium underline">{ann.link.label.en} →</span>}
              </div>
              <I18nInput label="Message" value={ann.text} onChange={(text) => setAnn({ ...ann, text })} maxLength={110} />
              <div className="grid gap-4 lg:grid-cols-2">
                <I18nInput label="Link text (optional)" value={ann.link?.label || {}} onChange={(label) => setAnn({ ...ann, link: { ...ann.link, label } })} maxLength={30} />
                <div>
                  <p className="mb-2 font-sans text-[0.72rem] font-medium uppercase tracking-[0.16em] text-bone/60">Link address</p>
                  <Input list="menu-targets" value={ann.link?.href || ''} placeholder="/contact" onChange={(e) => setAnn({ ...ann, link: { ...ann.link, href: e.target.value.trim() } })} />
                </div>
              </div>
              <Switch checked={ann.dismissible} onChange={(dismissible) => setAnn({ ...ann, dismissible })} label="Visitors can close it" description="Closed bars stay closed until you change the message." />
            </>
          )}
        </div>
      </Card>

      <Card title="Header & footer" className="mb-6">
        <div className="grid gap-x-10 gap-y-4 md:grid-cols-2">
          <div className="space-y-4">
            <p className="font-sans text-[0.72rem] uppercase tracking-[0.16em] text-gold">Header</p>
            <Switch checked={layout.header.cta} onChange={(cta) => setLayout({ ...layout, header: { ...layout.header, cta } })} label="“Design with us” button" />
            <Switch checked={layout.header.languages} onChange={(languages) => setLayout({ ...layout, header: { ...layout.header, languages } })} label="Language switcher" description="Hidden automatically when only one language is on." />
          </div>
          <div className="space-y-4">
            <p className="font-sans text-[0.72rem] uppercase tracking-[0.16em] text-gold">Footer</p>
            {(
              [
                ['cta', '“Begin your design journey” call to action'],
                ['newsletter', 'Newsletter sign-up'],
                ['explore', '“Explore” links'],
                ['contact', 'Contact details'],
                ['social', 'Social links'],
                ['signature', 'Drawing-style signature block'],
                ['backToTop', '“Go up” button'],
              ] as [keyof Layout['footer'], string][]
            ).map(([k, label]) => (
              <Switch key={k} checked={layout.footer[k]} onChange={(v) => setLayout({ ...layout, footer: { ...layout.footer, [k]: v } })} label={label} />
            ))}
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <MenuEditor title="Main menu" items={header} onChange={setHeader} targets={targets} emptyNote="Using the built-in menu: Work, Services, Studio, Blog, Contact." codes={codes} />
        <MenuEditor title="Footer “Explore” links" items={footer} onChange={setFooter} targets={targets} emptyNote="Using the same links as the main menu." codes={codes} />
      </div>
    </>
  );
}
