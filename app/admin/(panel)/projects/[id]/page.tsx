'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { mediaSrc } from '@/lib/media';
import { Button, Card, ConfirmDialog, Field, Input, PageHeader, Select, Spinner, Switch, useToast } from '@/components/admin/ui';
import I18nInput, { type I18nValue } from '@/components/admin/I18nInput';
import MediaLibrary from '@/components/admin/MediaLibrary';
import Modal from '@/components/admin/Modal';
import { must, slugify, usePublish, useLoad } from '@/components/admin/hooks';
import type { MediaRow } from '@/components/admin/media';
import { useMember } from '@/components/admin/AdminShell';

type Gallery = { id: string; source: string; path: string; alt: Record<string, string> }[];
type Form = {
  slug: string;
  category_id: string;
  title: I18nValue;
  label: I18nValue;
  location: I18nValue;
  client: string;
  description: I18nValue;
  seoTitle: I18nValue;
  seoDescription: I18nValue;
  featured: boolean;
  published: boolean;
};

const EMPTY: Form = { slug: '', category_id: '', title: {}, label: {}, location: {}, client: '', description: {}, seoTitle: {}, seoDescription: {}, featured: false, published: true };
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export default function ProjectEditor() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'new';
  const router = useRouter();
  const toast = useToast();
  const publish = usePublish();
  const { can } = useMember();
  const db = supabaseBrowser();
  const readOnly = !can('editor');

  const [form, setForm] = useState<Form>(EMPTY);
  const [gallery, setGallery] = useState<Gallery>([]);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [picker, setPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data, loading, error } = useLoad(async () => {
    const categories = must(await db.from('categories').select('id,slug,name').order('sort'));
    if (isNew) return { categories, project: null };
    const project = must(
      await db
        .from('projects')
        .select('id,slug,category_id,title,label,location,client,description,seo,featured,published,gallery:project_media(sort,media:media(id,source,path,alt))')
        .eq('id', id)
        .single(),
    );
    return { categories, project };
  }, [id]);

  useEffect(() => {
    if (!data) return;
    const p = data.project;
    if (!p) {
      setForm((f) => ({ ...f, category_id: f.category_id || data.categories[0]?.id || '' }));
      return;
    }
    const seo = (p.seo || {}) as { title?: I18nValue; description?: I18nValue };
    setForm({
      slug: p.slug,
      category_id: p.category_id,
      title: (p.title || {}) as I18nValue,
      label: (p.label || {}) as I18nValue,
      location: (p.location || {}) as I18nValue,
      client: p.client || '',
      description: (p.description || {}) as I18nValue,
      seoTitle: seo.title || {},
      seoDescription: seo.description || {},
      featured: p.featured,
      published: p.published,
    });
    const g = ((p.gallery as { sort: number; media: Gallery[number] | null }[]) || [])
      .filter((x) => x.media)
      .sort((a, b) => a.sort - b.sort)
      .map((x) => ({ ...x.media!, alt: (x.media!.alt || {}) as Record<string, string> }));
    setGallery(g);
  }, [data]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  function onTitle(v: I18nValue) {
    set('title', v);
    if (!slugTouched) set('slug', slugify(v.en || ''));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.title.en?.trim()) e.title = 'An English title is required.';
    if (!SLUG_RE.test(form.slug)) e.slug = 'Use lowercase letters, numbers and dashes only (e.g. villa-in-cairo).';
    if (!form.category_id) e.category = 'Choose a category.';
    if (form.published && !gallery.length) e.gallery = 'Add at least one image before publishing.';
    setErrors(e);
    return !Object.keys(e).length;
  }

  async function save() {
    if (!validate()) return toast('error', 'Please check the highlighted fields.');
    setSaving(true);
    const row = {
      slug: form.slug,
      category_id: form.category_id,
      title: form.title,
      label: form.label,
      location: form.location,
      client: form.client.trim() || null,
      description: form.description,
      seo: { title: form.seoTitle, description: form.seoDescription },
      featured: form.featured,
      published: form.published,
    };
    let projectId = id;
    if (isNew) {
      const max = await db.from('projects').select('sort').order('sort', { ascending: false }).limit(1);
      const res = await db.from('projects').insert({ ...row, sort: ((max.data?.[0]?.sort ?? 0) as number) + 10 }).select('id').single();
      if (res.error) {
        setSaving(false);
        return toast('error', res.error.message.includes('duplicate') ? 'This web address (slug) is already used by another project.' : res.error.message);
      }
      projectId = res.data.id;
    } else {
      const res = await db.from('projects').update(row).eq('id', id);
      if (res.error) {
        setSaving(false);
        return toast('error', res.error.message.includes('duplicate') ? 'This web address (slug) is already used by another project.' : res.error.message);
      }
    }
    // Gallery: replace the ordered list.
    const del = await db.from('project_media').delete().eq('project_id', projectId);
    const ins = gallery.length
      ? await db.from('project_media').insert(gallery.map((g, i) => ({ project_id: projectId, media_id: g.id, sort: i * 10 })))
      : { error: null };
    setSaving(false);
    if (del.error || ins.error) return toast('error', (del.error || ins.error)!.message);
    await publish(isNew ? 'Project created' : 'Project');
    if (isNew) router.replace(`/admin/projects/${projectId}`);
  }

  async function remove() {
    const { error: err } = await db.from('projects').delete().eq('id', id);
    if (err) return toast('error', err.message);
    await publish('Project deleted');
    router.replace('/admin/projects');
  }

  function addPicked(rows: MediaRow[]) {
    setGallery((g) => [...g, ...rows.filter((r) => !g.some((x) => x.id === r.id)).map((r) => ({ id: r.id, source: r.source, path: r.path, alt: r.alt || {} }))]);
    setPicker(false);
  }

  const moveImage = (i: number, dir: -1 | 1) =>
    setGallery((g) => {
      const j = i + dir;
      if (j < 0 || j >= g.length) return g;
      const next = [...g];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  if (loading) return <Spinner />;
  if (error) return <p className="text-[#E8A598]">{error}</p>;

  const title = form.title.en || (isNew ? 'New project' : 'Project');

  return (
    <>
      <Link href="/admin/projects" className="mb-4 inline-block text-sm text-bone/50 hover:text-gold">
        ← Projects
      </Link>
      <PageHeader
        title={title}
        description={isNew ? 'Fill in the English text first, then the German and Spanish translations.' : form.published ? 'Published — visible on the website.' : 'Hidden — only the team can see it.'}
        actions={
          <>
            {!isNew && form.published && (
              <a href={`/en/work/${form.slug}`} target="_blank" rel="noreferrer" className="inline-flex min-h-[44px] items-center px-3 text-sm text-gold hover:underline">
                View on site ↗
              </a>
            )}
            {!readOnly && (
              <Button onClick={save} busy={saving}>
                {isNew ? 'Create project' : 'Save & publish'}
              </Button>
            )}
          </>
        }
      />

      <fieldset disabled={readOnly} className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Text">
            <div className="space-y-6">
              <div>
                <I18nInput label="Title" value={form.title} onChange={onTitle} required maxLength={160} hint="Project names usually stay the same in every language." />
                {errors.title && <p className="mt-1 text-sm text-[#E8A598]">{errors.title}</p>}
              </div>
              <I18nInput label="Short label" value={form.label} onChange={(v) => set('label', v)} maxLength={120} hint="E.g. “Contemporary residential project”." />
              <I18nInput label="Location" value={form.location} onChange={(v) => set('location', v)} maxLength={120} />
              <I18nInput label="Description" value={form.description} onChange={(v) => set('description', v)} multiline rows={7} hint="Separate paragraphs with an empty line." />
            </div>
          </Card>

          <Card
            title={`Gallery (${gallery.length})`}
            actions={
              !readOnly && (
                <Button size="sm" variant="secondary" onClick={() => setPicker(true)}>
                  Add images
                </Button>
              )
            }
          >
            {errors.gallery && <p className="mb-3 text-sm text-[#E8A598]">{errors.gallery}</p>}
            {gallery.length ? (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {gallery.map((g, i) => (
                  <li key={g.id} className="overflow-hidden rounded-sm border border-bone/10 bg-[#1a1917]">
                    <div className="relative aspect-[4/3]">
                      <Image src={mediaSrc(g.source, g.path)} alt={g.alt?.en || ''} fill sizes="260px" className="object-cover" />
                      {i === 0 && <span className="absolute left-2 top-2 rounded-sm bg-gold px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-night">Cover</span>}
                    </div>
                    {!readOnly && (
                      <div className="flex items-center justify-between gap-1 p-1">
                        <div className="flex">
                          <Button variant="ghost" size="sm" aria-label="Move earlier" disabled={i === 0} onClick={() => moveImage(i, -1)}>
                            ←
                          </Button>
                          <Button variant="ghost" size="sm" aria-label="Move later" disabled={i === gallery.length - 1} onClick={() => moveImage(i, 1)}>
                            →
                          </Button>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setGallery((x) => x.filter((_, k) => k !== i))}>
                          Remove
                        </Button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-bone/45">No images yet. Add renders from the media library or upload new ones.</p>
            )}
          </Card>

          <Card title="Search engines (optional)">
            <div className="space-y-6">
              <I18nInput label="SEO title" value={form.seoTitle} onChange={(v) => set('seoTitle', v)} maxLength={70} hint="Defaults to the project title. Up to ~60 characters." />
              <I18nInput label="SEO description" value={form.seoDescription} onChange={(v) => set('seoDescription', v)} multiline rows={3} maxLength={170} hint="Defaults to the start of the description. Up to ~160 characters." />
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Publishing">
            <div className="space-y-5">
              <Switch checked={form.published} onChange={(v) => set('published', v)} label="Published" description="Visible on the website." />
              <Switch checked={form.featured} onChange={(v) => set('featured', v)} label="Featured" description="Highlighted on the home page (interior rooms) and the services page." />
            </div>
          </Card>
          <Card title="Details">
            <div className="space-y-4">
              <Field label="Category" htmlFor="category" error={errors.category}>
                <Select id="category" value={form.category_id} onChange={(e) => set('category_id', e.target.value)}>
                  {data?.categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {((c.name || {}) as I18nValue).en}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Web address" htmlFor="slug" error={errors.slug} hint={`vari-studio.com/en/work/${form.slug || '…'}`}>
                <Input
                  id="slug"
                  value={form.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    set('slug', slugify(e.target.value));
                  }}
                />
              </Field>
              <Field label="Client (optional)" htmlFor="client">
                <Input id="client" value={form.client} onChange={(e) => set('client', e.target.value)} maxLength={200} />
              </Field>
            </div>
          </Card>
          {!isNew && !readOnly && (
            <Button variant="danger" className="w-full" onClick={() => setConfirmDelete(true)}>
              Delete project
            </Button>
          )}
        </div>
      </fieldset>

      <Modal open={picker} title="Choose images" onClose={() => setPicker(false)} wide>
        <MediaLibrary mode="pick" multiple onPick={addPicked} />
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this project?"
        body="The project and its page are removed from the website permanently. Its images stay in the media library."
        confirmLabel="Delete project"
        requireText={form.slug}
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
