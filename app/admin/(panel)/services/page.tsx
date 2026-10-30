'use client';

import { useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { Badge, Button, Card, ConfirmDialog, PageHeader, Spinner, useToast } from '@/components/admin/ui';
import I18nInput, { type I18nValue } from '@/components/admin/I18nInput';
import Modal from '@/components/admin/Modal';
import { must, slugify, usePublish, useLoad } from '@/components/admin/hooks';
import { useMember } from '@/components/admin/AdminShell';

/** Services with a dedicated pose in the 3D model on the website. */
const POSES: Record<string, string> = {
  product: 'Object study',
  tour: 'Eye-level walk-in',
  interior: 'Roof lifted, furnished interior',
  design: 'Complete building',
  walk: 'Camera fly-around',
  bim: 'Exploded layers',
  render: 'Night render',
  draft: 'Plan view',
};

type Svc = { id: string; key: string; title: I18nValue; body: I18nValue; note: I18nValue; sort: number; visible: boolean };

export default function ServicesAdmin() {
  const db = supabaseBrowser();
  const toast = useToast();
  const publish = usePublish();
  const { can } = useMember();
  const [edit, setEdit] = useState<Svc | 'new' | null>(null);
  const [form, setForm] = useState<{ title: I18nValue; body: I18nValue; note: I18nValue }>({ title: {}, body: {}, note: {} });
  const [saving, setSaving] = useState(false);
  const [remove, setRemove] = useState<Svc | null>(null);

  const { data, setData, loading, error, reload } = useLoad(async () => must(await db.from('services').select('id,key,title,body,note,sort,visible').order('sort')) as Svc[]);

  function open(s: Svc | 'new') {
    setEdit(s);
    setForm(s === 'new' ? { title: {}, body: {}, note: {} } : { title: s.title || {}, body: s.body || {}, note: s.note || {} });
  }

  async function save() {
    if (!form.title.en?.trim()) return toast('error', 'An English title is required.');
    setSaving(true);
    const res =
      edit === 'new'
        ? await db.from('services').insert({ key: slugify(form.title.en) || `service-${Date.now()}`, ...form, sort: ((data?.at(-1)?.sort ?? 0) as number) + 10 })
        : await db.from('services').update(form).eq('id', (edit as Svc).id);
    setSaving(false);
    if (res.error) return toast('error', res.error.message.includes('duplicate') ? 'A service with this name already exists.' : res.error.message);
    setEdit(null);
    await reload();
    publish('Service');
  }

  async function toggle(s: Svc) {
    if (!data) return;
    const { error: err } = await db.from('services').update({ visible: !s.visible }).eq('id', s.id);
    if (err) return toast('error', err.message);
    setData(data.map((x) => (x.id === s.id ? { ...x, visible: !s.visible } : x)));
    publish(s.visible ? 'Service hidden' : 'Service shown');
  }

  async function move(i: number, dir: -1 | 1) {
    if (!data) return;
    const j = i + dir;
    if (j < 0 || j >= data.length) return;
    const list = [...data];
    [list[i], list[j]] = [list[j], list[i]];
    const next = list.map((c, k) => ({ ...c, sort: (k + 1) * 10 }));
    setData(next);
    await Promise.all([next[i], next[j]].map((c) => db.from('services').update({ sort: c.sort }).eq('id', c.id)));
    publish('Order');
  }

  async function doRemove() {
    if (!remove) return;
    const { error: err } = await db.from('services').delete().eq('id', remove.id);
    if (err) return toast('error', err.message);
    setRemove(null);
    setEdit(null);
    await reload();
    publish('Service deleted');
  }

  return (
    <>
      <PageHeader
        eyebrow="Content"
        title="Services"
        description="The services list and its live 3D model on the home and services pages. Hidden services disappear from the website."
        actions={can('editor') ? <Button onClick={() => open('new')}>New service</Button> : undefined}
      />
      {loading ? (
        <Spinner />
      ) : error ? (
        <p className="text-[#E8A598]">{error}</p>
      ) : (
        <Card>
          <ul className="-my-2 divide-y divide-bone/10">
            {data!.map((s, i) => (
              <li key={s.id} className="flex flex-wrap items-center gap-3 py-3">
                <span className="w-7 font-sans text-xs text-gold">{String(i + 1).padStart(2, '0')}</span>
                <div className="min-w-0 flex-1">
                  <p className={`text-[1.02rem] ${s.visible ? '' : 'text-bone/40 line-through'}`}>{s.title?.en}</p>
                  <p className="mt-0.5 truncate text-xs text-bone/40">{POSES[s.key] ? `3D: ${POSES[s.key]}` : '3D: complete building'}</p>
                </div>
                {!s.visible && <Badge>Hidden</Badge>}
                {can('editor') && (
                  <div className="flex shrink-0 items-center">
                    <Button variant="ghost" size="sm" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
                      ↑
                    </Button>
                    <Button variant="ghost" size="sm" aria-label="Move down" disabled={i === data!.length - 1} onClick={() => move(i, 1)}>
                      ↓
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => toggle(s)}>
                      {s.visible ? 'Hide' : 'Show'}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => open(s)}>
                      Edit
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Modal open={!!edit} title={edit === 'new' ? 'New service' : 'Edit service'} onClose={() => setEdit(null)} wide>
        <div className="space-y-6 pb-5">
          <I18nInput label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} required maxLength={80} />
          <I18nInput label="Description" value={form.body} onChange={(v) => setForm({ ...form, body: v })} multiline rows={3} maxLength={300} />
          <I18nInput label="3D model caption" value={form.note} onChange={(v) => setForm({ ...form, note: v })} maxLength={140} hint="Shown under the live model when this service is selected." />
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            {edit !== 'new' && edit && (
              <Button variant="danger" onClick={() => setRemove(edit)}>
                Delete
              </Button>
            )}
            <Button onClick={save} busy={saving} className="sm:ml-auto">
              Save & publish
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!remove} title="Delete service?" body={`“${remove?.title?.en}” is removed from the website. Hiding it keeps it for later instead.`} confirmLabel="Delete" onConfirm={doRemove} onCancel={() => setRemove(null)} />
    </>
  );
}
