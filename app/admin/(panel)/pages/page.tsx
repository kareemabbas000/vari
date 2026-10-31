'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { Badge, Button, Card, ConfirmDialog, Field, Input, PageHeader, Spinner, useToast } from '@/components/admin/ui';
import I18nInput, { type I18nValue } from '@/components/admin/I18nInput';
import Modal from '@/components/admin/Modal';
import { formatDate, must, slugify, usePublish, useLoad } from '@/components/admin/hooks';
import { useMember } from '@/components/admin/AdminShell';
import { StatusBadge } from '@/components/admin/builder/Builder';
import { RESERVED_SLUGS, cloneBlock, type Block } from '@/lib/blocks/schema';
import { TEMPLATES } from '@/lib/blocks/templates';
import type { Json } from '@/lib/database.types';

type Row = { id: string; slug: string; kind: 'custom' | 'system'; title: I18nValue; blocks: Block[]; draft: unknown; published: boolean; updated_at: string; sort: number };

const SYSTEM_PATH: Record<string, string> = { home: '/', work: '/work', services: '/services', studio: '/studio', contact: '/contact', blog: '/blog', privacy: '/privacy', 'project-template': '/work/… (every project)' };

export default function PagesList() {
  const db = supabaseBrowser();
  const router = useRouter();
  const toast = useToast();
  const publish = usePublish();
  const { can } = useMember();
  const { data, loading, error, reload } = useLoad(async () => must(await db.from('pages').select('id,slug,kind,title,blocks,draft,published,updated_at,sort').order('sort').order('created_at')) as unknown as Row[]);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<{ title: I18nValue; slug: string; template: string; touched: boolean }>({ title: {}, slug: '', template: 'landing', touched: false });
  const [busy, setBusy] = useState(false);
  const [remove, setRemove] = useState<Row | null>(null);

  const slugError =
    !form.slug ? 'Choose an address.' : !/^[a-z0-9]+(-[a-z0-9]+)*(\/[a-z0-9]+(-[a-z0-9]+)*)*$/.test(form.slug) ? 'Use lowercase letters, numbers and hyphens.' : RESERVED_SLUGS.includes(form.slug.split('/')[0]) ? 'This address is used by the website.' : data?.some((p) => p.slug === form.slug) ? 'Another page already uses this address.' : '';

  async function create() {
    if (!form.title.en?.trim() || slugError) return toast('error', !form.title.en?.trim() ? 'Give the page an English name.' : slugError);
    setBusy(true);
    const tpl = TEMPLATES.find((t) => t.id === form.template) ?? TEMPLATES[0];
    const blocks = tpl.build();
    const res = await db.from('pages').insert({ slug: form.slug, kind: 'custom', title: form.title as Json, blocks: [] as Json, draft: { title: form.title, seo: {}, blocks } as unknown as Json, published: false, sort: 100 + (data?.length ?? 0) }).select('id').single();
    setBusy(false);
    if (res.error) return toast('error', res.error.message);
    router.push(`/admin/pages/${res.data.id}`);
  }

  async function duplicate(p: Row) {
    let slug = `${p.slug}-copy`;
    let n = 2;
    while (data?.some((x) => x.slug === slug)) slug = `${p.slug}-copy-${n++}`;
    const src = must(await db.from('pages').select('title,seo,blocks,draft').eq('id', p.id).single());
    const draft = (src.draft as { blocks?: Block[] } | null) ?? { title: src.title, seo: src.seo, blocks: src.blocks };
    const blocks = ((draft as { blocks?: Block[] }).blocks || []).map((b) => (b.type === 'module' ? null : cloneBlock(b))).filter(Boolean);
    const title = Object.fromEntries(Object.entries((src.title as I18nValue) || {}).map(([k, v]) => [k, `${v} (copy)`]));
    const res = await db.from('pages').insert({ slug, kind: 'custom', title: title as Json, seo: src.seo, blocks: [] as Json, draft: { title, seo: src.seo, blocks } as unknown as Json, published: false }).select('id').single();
    if (res.error) return toast('error', res.error.message);
    toast('success', 'Page duplicated as a draft.');
    reload();
  }

  async function doRemove() {
    if (!remove) return;
    const { error: err } = await db.from('pages').delete().eq('id', remove.id);
    if (err) return toast('error', err.message);
    setRemove(null);
    reload();
    publish('Page deleted');
  }

  if (loading) return <Spinner />;
  if (error) return <p className="text-[#E8A598]">{error}</p>;
  const system = (data || []).filter((p) => p.kind === 'system');
  const custom = (data || []).filter((p) => p.kind === 'custom');

  const card = (p: Row) => {
    const path = p.kind === 'system' ? SYSTEM_PATH[p.slug] ?? `/${p.slug}` : `/${p.slug}`;
    const count = ((p.draft as { blocks?: Block[] } | null)?.blocks ?? p.blocks).length;
    return (
      <li key={p.id} className="group relative flex flex-col overflow-hidden rounded-sm border border-bone/10 bg-bone/[0.02] transition hover:border-gold/40">
        <Link href={`/admin/pages/${p.id}`} className="flex flex-1 flex-col p-5">
          <div className="mb-6 flex h-24 flex-col justify-end gap-1.5 rounded-sm bg-[linear-gradient(160deg,#1b1916,#0c0b0a)] p-3" aria-hidden>
            {Array.from({ length: Math.min(count, 5) }).map((_, i) => (
              <span key={i} className={`h-2 rounded-full ${i === 0 ? 'w-3/4 bg-gold/50' : 'bg-bone/10'}`} style={{ width: i ? `${90 - i * 12}%` : undefined }} />
            ))}
          </div>
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-display text-2xl leading-tight">{p.title?.en || p.slug}</h3>
            {p.kind === 'system' && <Badge>Built-in</Badge>}
          </div>
          <p className="mt-1 text-sm text-bone/45">/{'{lang}'}{path === '/' ? '' : path}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <StatusBadge page={p} />
            <span className="text-xs text-bone/40">{count} blocks · {formatDate(p.updated_at)}</span>
          </div>
        </Link>
        {p.kind === 'custom' && can('editor') && (
          <div className="flex border-t border-bone/10 text-xs">
            <button type="button" onClick={() => duplicate(p)} className="min-h-[44px] flex-1 text-bone/60 hover:bg-bone/5 hover:text-bone">Duplicate</button>
            {can('admin') && <button type="button" onClick={() => setRemove(p)} className="min-h-[44px] flex-1 border-l border-bone/10 text-bone/60 hover:bg-[#E8A598]/10 hover:text-[#E8A598]">Delete</button>}
          </div>
        )}
      </li>
    );
  };

  return (
    <>
      <PageHeader
        eyebrow="Content"
        title="Pages"
        description="Design pages visually with blocks — and add new blocks around the built-in sections of the existing pages."
        actions={can('editor') ? <Button onClick={() => setCreating(true)}>New page</Button> : undefined}
      />

      <h2 className="mb-3 font-sans text-[0.72rem] uppercase tracking-[0.16em] text-bone/50">Website pages</h2>
      <ul className="mb-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{system.map(card)}</ul>

      <h2 className="mb-3 font-sans text-[0.72rem] uppercase tracking-[0.16em] text-bone/50">Your pages</h2>
      {custom.length ? (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{custom.map(card)}</ul>
      ) : (
        <Card>
          <div className="py-8 text-center">
            <p className="font-display text-2xl">No pages of your own yet</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-bone/50">Create a landing page, a service page or an SEO page from a template — then shape it in the visual builder.</p>
            {can('editor') && <Button className="mt-6" onClick={() => setCreating(true)}>Create your first page</Button>}
          </div>
        </Card>
      )}

      <Modal open={creating} title="New page" onClose={() => setCreating(false)} wide>
        <div className="space-y-6 pb-6">
          <I18nInput label="Page name" required value={form.title} onChange={(title) => setForm((f) => ({ ...f, title, slug: f.touched ? f.slug : slugify(title.en || '') }))} maxLength={80} />
          <Field label="Web address" htmlFor="new-slug" error={form.slug ? slugError : undefined} hint={`vari-studio.com/en/${form.slug || '…'}`}>
            <Input id="new-slug" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9/-]/g, '-'), touched: true }))} />
          </Field>
          <div>
            <p className="mb-3 font-sans text-[0.72rem] font-medium uppercase tracking-[0.16em] text-bone/60">Start from</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {TEMPLATES.map((t) => (
                <button key={t.id} type="button" onClick={() => setForm((f) => ({ ...f, template: t.id }))} aria-pressed={form.template === t.id} className={`rounded-sm border p-4 text-left transition ${form.template === t.id ? 'border-gold bg-gold/10' : 'border-bone/10 hover:border-bone/30'}`}>
                  <p className="font-medium">{t.name}</p>
                  <p className="mt-1 text-xs leading-relaxed text-bone/50">{t.description}</p>
                  <p className="mt-3 text-[0.65rem] uppercase tracking-[0.14em] text-bone/35">{t.build().length} blocks</p>
                </button>
              ))}
            </div>
          </div>
          <Button className="w-full" onClick={create} busy={busy}>Create and open the builder</Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!remove}
        title="Delete this page?"
        body={<>“{remove?.title?.en}” and its version history are deleted, and its address stops working.</>}
        confirmLabel="Delete page"
        requireText={remove?.slug}
        onConfirm={doRemove}
        onCancel={() => setRemove(null)}
      />
    </>
  );
}
