'use client';

import { useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { Badge, Button, Card, ConfirmDialog, Field, Input, PageHeader, Spinner, useToast } from '@/components/admin/ui';
import I18nInput, { type I18nValue } from '@/components/admin/I18nInput';
import Modal from '@/components/admin/Modal';
import { must, slugify, usePublish, useLoad } from '@/components/admin/hooks';
import { useMember } from '@/components/admin/AdminShell';

/** The home page builds its exterior reel and interior rooms from these two. */
const SYSTEM = ['exterior', 'interior'];
type Cat = { id: string; slug: string; name: I18nValue; sort: number; count: number };

export default function CategoriesPage() {
  const db = supabaseBrowser();
  const toast = useToast();
  const publish = usePublish();
  const { can } = useMember();
  const [edit, setEdit] = useState<Cat | 'new' | null>(null);
  const [name, setName] = useState<I18nValue>({});
  const [slug, setSlug] = useState('');
  const [saving, setSaving] = useState(false);
  const [remove, setRemove] = useState<Cat | null>(null);

  const { data, setData, loading, error, reload } = useLoad(async () => {
    const [cats, projects] = await Promise.all([must(await db.from('categories').select('id,slug,name,sort').order('sort')), must(await db.from('projects').select('category_id'))]);
    return cats.map((c) => ({ ...c, name: (c.name || {}) as I18nValue, count: projects.filter((p) => p.category_id === c.id).length })) as Cat[];
  });

  function open(c: Cat | 'new') {
    setEdit(c);
    setName(c === 'new' ? {} : c.name);
    setSlug(c === 'new' ? '' : c.slug);
  }

  async function save() {
    if (!name.en?.trim()) return toast('error', 'An English name is required.');
    const s = edit === 'new' ? slugify(slug || name.en) : (edit as Cat).slug;
    if (!s) return toast('error', 'Choose a web address.');
    setSaving(true);
    const res =
      edit === 'new'
        ? await db.from('categories').insert({ slug: s, name, sort: ((data?.at(-1)?.sort ?? 0) as number) + 10 })
        : await db.from('categories').update({ name }).eq('id', (edit as Cat).id);
    setSaving(false);
    if (res.error) return toast('error', res.error.message.includes('duplicate') ? 'That web address is already used.' : res.error.message);
    setEdit(null);
    await reload();
    publish('Category');
  }

  async function move(i: number, dir: -1 | 1) {
    if (!data) return;
    const j = i + dir;
    if (j < 0 || j >= data.length) return;
    const list = [...data];
    [list[i], list[j]] = [list[j], list[i]];
    const next = list.map((c, k) => ({ ...c, sort: (k + 1) * 10 }));
    setData(next);
    await Promise.all([next[i], next[j]].map((c) => db.from('categories').update({ sort: c.sort }).eq('id', c.id)));
    publish('Order');
  }

  async function doRemove() {
    if (!remove) return;
    const { error: err } = await db.from('categories').delete().eq('id', remove.id);
    if (err) return toast('error', err.message);
    setRemove(null);
    await reload();
    publish('Category deleted');
  }

  return (
    <>
      <PageHeader
        eyebrow="Content"
        title="Categories"
        description="Group projects (e.g. Exteriors, Interiors, Commercial). Each category becomes a filter on the Work page, in this order."
        actions={can('editor') ? <Button onClick={() => open('new')}>New category</Button> : undefined}
      />
      {loading ? (
        <Spinner />
      ) : error ? (
        <p className="text-[#E8A598]">{error}</p>
      ) : (
        <Card>
          <ul className="-my-2 divide-y divide-bone/10">
            {data!.map((c, i) => (
              <li key={c.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[1.02rem]">{c.name.en}</p>
                  <p className="mt-0.5 text-xs text-bone/40">
                    {c.name.de || '—'} · {c.name.es || '—'} · /{c.slug}
                  </p>
                </div>
                <Badge>{c.count} projects</Badge>
                {SYSTEM.includes(c.slug) && <Badge tone="blue">System</Badge>}
                {can('editor') && (
                  <div className="flex shrink-0 items-center">
                    <Button variant="ghost" size="sm" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
                      ↑
                    </Button>
                    <Button variant="ghost" size="sm" aria-label="Move down" disabled={i === data!.length - 1} onClick={() => move(i, 1)}>
                      ↓
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => open(c)}>
                      Edit
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Modal open={!!edit} title={edit === 'new' ? 'New category' : 'Edit category'} onClose={() => setEdit(null)}>
        <div className="space-y-5 pb-5">
          <I18nInput label="Name" value={name} onChange={setName} required maxLength={60} />
          {edit === 'new' ? (
            <Field label="Web address" htmlFor="slug" hint="Used in links, e.g. /work?filter=commercial.">
              <Input id="slug" value={slug || slugify(name.en || '')} onChange={(e) => setSlug(slugify(e.target.value))} />
            </Field>
          ) : (
            <p className="text-xs text-bone/40">Web address: /{(edit as Cat | null)?.slug}</p>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            {edit !== 'new' && edit && !SYSTEM.includes(edit.slug) && (
              <Button variant="danger" disabled={edit.count > 0} title={edit.count ? 'Move its projects to another category first' : undefined} onClick={() => setRemove(edit)}>
                Delete
              </Button>
            )}
            <Button onClick={save} busy={saving} className="sm:ml-auto">
              Save
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!remove} title="Delete category?" body={`“${remove?.name.en}” is removed. It has no projects.`} confirmLabel="Delete" onConfirm={doRemove} onCancel={() => setRemove(null)} />
    </>
  );
}
