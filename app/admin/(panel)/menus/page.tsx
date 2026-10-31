'use client';

import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { Button, Card, Input, PageHeader, Spinner, Switch, useToast } from '@/components/admin/ui';
import I18nInput, { type I18nValue } from '@/components/admin/I18nInput';
import { must, usePublish, useLoad } from '@/components/admin/hooks';
import { useMember } from '@/components/admin/AdminShell';
import type { Json } from '@/lib/database.types';

type Item = { label: I18nValue; href: string; newTab?: boolean };
type Announcement = { enabled: boolean; text: I18nValue; link?: { label?: I18nValue; href?: string }; dismissible: boolean; version: number };
type Data = { navigation?: { header?: Item[]; footer?: Item[] }; announcement?: Announcement; [k: string]: unknown };

const DEFAULT_MENU: Item[] = [
  { label: { en: 'Work', de: 'Projekte', es: 'Proyectos' }, href: '/work' },
  { label: { en: 'Services', de: 'Leistungen', es: 'Servicios' }, href: '/services' },
  { label: { en: 'Studio', de: 'Studio', es: 'Estudio' }, href: '/studio' },
  { label: { en: 'Contact', de: 'Kontakt', es: 'Contacto' }, href: '/contact' },
];
const BUILT_IN = ['/', '/work', '/services', '/studio', '/contact', '/blog', '/privacy'];

function MenuEditor({ title, items, onChange, targets, emptyNote }: { title: string; items: Item[]; onChange: (v: Item[]) => void; targets: string[]; emptyNote: string }) {
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
          {!items.length && <Button size="sm" variant="ghost" onClick={() => onChange(DEFAULT_MENU)}>Start from current menu</Button>}
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
  const [header, setHeader] = useState<Item[]>([]);
  const [footer, setFooter] = useState<Item[]>([]);
  const [ann, setAnn] = useState<Announcement>({ enabled: false, text: {}, dismissible: true, version: 1 });
  const [targets, setTargets] = useState<string[]>(BUILT_IN);
  const [saving, setSaving] = useState(false);

  const { data, loading, error } = useLoad(async () => must(await db.from('site_settings').select('data').eq('id', 1).single()).data as Data);

  useEffect(() => {
    if (!data) return;
    setHeader(data.navigation?.header || []);
    setFooter(data.navigation?.footer || []);
    setAnn({ enabled: false, text: {}, dismissible: true, version: 1, ...(data.announcement || {}) });
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
    const next = { ...data, navigation: { header, footer }, announcement: { ...ann, version: changed ? (prev?.version || 1) + 1 : ann.version } };
    const res = await db.from('site_settings').update({ data: next as unknown as Json }).eq('id', 1).select('id');
    setSaving(false);
    if (res.error || !res.data?.length) return toast('error', res.error?.message || 'Not saved — sign in again.');
    publish('Menus');
  }

  return (
    <>
      <PageHeader eyebrow="Site" title="Menus & announcement" description="Choose the links in the main menu and the footer — including pages you build — and show a message bar above the menu." actions={<Button onClick={save} busy={saving}>Save & publish</Button>} />

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

      <div className="grid gap-6 xl:grid-cols-2">
        <MenuEditor title="Main menu" items={header} onChange={setHeader} targets={targets} emptyNote="Using the built-in menu: Work, Services, Studio, Contact." />
        <MenuEditor title="Footer “Explore” links" items={footer} onChange={setFooter} targets={targets} emptyNote="Using the same links as the main menu." />
      </div>
    </>
  );
}
