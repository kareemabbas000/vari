'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useMemo, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { mediaSrc } from '@/lib/media';
import { Badge, Button, EmptyState, Input, LinkButton, PageHeader, Select, Spinner, useToast } from '@/components/admin/ui';
import { must, usePublish, useLoad } from '@/components/admin/hooks';
import { useMember } from '@/components/admin/AdminShell';

type I18n = Record<string, string | undefined>;
const needsTranslation = (v: unknown) => {
  const o = (v || {}) as I18n;
  return !!o.en?.trim() && (!o.de?.trim() || !o.es?.trim());
};

function ProjectsList() {
  const db = supabaseBrowser();
  const toast = useToast();
  const publish = usePublish();
  const { can } = useMember();
  const params = useSearchParams();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [status, setStatus] = useState(params.get('filter') === 'translation' ? 'translation' : 'all');

  const { data, setData, loading, error } = useLoad(async () => {
    const [projects, categories] = await Promise.all([
      must(
        await db
          .from('projects')
          .select('id,slug,title,description,published,featured,sort,category_id,gallery:project_media(sort,media:media(source,path))')
          .order('sort', { ascending: true }),
      ),
      must(await db.from('categories').select('id,slug,name').order('sort')),
    ]);
    return { projects, categories };
  });

  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    return (data?.projects ?? []).filter((p) => {
      const title = ((p.title || {}) as I18n).en?.toLowerCase() ?? '';
      if (n && !title.includes(n) && !p.slug.includes(n)) return false;
      if (cat !== 'all' && p.category_id !== cat) return false;
      if (status === 'published' && !p.published) return false;
      if (status === 'draft' && p.published) return false;
      if (status === 'featured' && !p.featured) return false;
      if (status === 'translation' && !needsTranslation(p.title) && !needsTranslation(p.description)) return false;
      return true;
    });
  }, [data, q, cat, status]);

  async function toggle(id: string, field: 'published' | 'featured', value: boolean) {
    if (!data) return;
    const patch = field === 'published' ? { published: value } : { featured: value };
    const { error: err } = await db.from('projects').update(patch).eq('id', id);
    if (err) return toast('error', err.message);
    setData({ ...data, projects: data.projects.map((p) => (p.id === id ? { ...p, [field]: value } : p)) });
    publish(field === 'published' ? (value ? 'Project published' : 'Project hidden') : value ? 'Featured' : 'Unfeatured');
  }

  async function move(id: string, dir: -1 | 1) {
    if (!data) return;
    const list = [...data.projects];
    const i = list.findIndex((p) => p.id === id);
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    const resorted = list.map((p, k) => ({ ...p, sort: (k + 1) * 10 }));
    setData({ ...data, projects: resorted });
    const a = resorted[i];
    const b = resorted[j];
    const [r1, r2] = await Promise.all([db.from('projects').update({ sort: a.sort }).eq('id', a.id), db.from('projects').update({ sort: b.sort }).eq('id', b.id)]);
    if (r1.error || r2.error) return toast('error', (r1.error || r2.error)!.message);
    publish('New order');
  }

  const catName = (id: string) => ((data?.categories.find((c) => c.id === id)?.name || {}) as I18n).en ?? '';
  const filtered = q || cat !== 'all' || status !== 'all';

  return (
    <>
      <PageHeader
        eyebrow="Content"
        title="Projects"
        description="The portfolio shown on the website. The order here is the order on the site; the first image of each project is its cover."
        actions={can('editor') ? <LinkButton href="/admin/projects/new" variant="primary">New project</LinkButton> : undefined}
      />

      <div className="mb-4 grid gap-2 sm:grid-cols-3">
        <Input type="search" placeholder="Search projects…" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category">
          <option value="all">All categories</option>
          {data?.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {((c.name || {}) as I18n).en}
            </option>
          ))}
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Hidden (drafts)</option>
          <option value="featured">Featured</option>
          <option value="translation">Needs translation</option>
        </Select>
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <p className="text-[#E8A598]">{error}</p>
      ) : !rows.length ? (
        <EmptyState title="No projects" body={filtered ? 'Nothing matches these filters.' : 'Create the first project.'} />
      ) : (
        <ul className="space-y-2">
          {rows.map((p) => {
            const cover = [...((p.gallery as { sort: number; media: { source: string; path: string } | null }[]) ?? [])].sort((a, b) => a.sort - b.sort)[0]?.media;
            const title = ((p.title || {}) as I18n).en || p.slug;
            const idx = data!.projects.findIndex((x) => x.id === p.id);
            return (
              <li key={p.id} className="flex items-center gap-3 rounded-sm border border-bone/10 bg-[#141312] p-2.5 sm:gap-4 sm:p-3">
                <Link href={`/admin/projects/${p.id}`} className="relative h-16 w-20 shrink-0 overflow-hidden rounded-sm bg-[#1a1917] sm:h-20 sm:w-28">
                  {cover ? <Image src={mediaSrc(cover.source, cover.path)} alt="" fill sizes="112px" className="object-cover" /> : <span className="flex h-full items-center justify-center text-xs text-bone/30">No image</span>}
                </Link>
                <Link href={`/admin/projects/${p.id}`} className="min-w-0 flex-1">
                  <p className="truncate font-display text-lg leading-tight hover:text-gold">{title}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <Badge>{catName(p.category_id)}</Badge>
                    {p.published ? <Badge tone="green">Published</Badge> : <Badge tone="grey">Hidden</Badge>}
                    {p.featured && <Badge tone="gold">★ Featured</Badge>}
                    {(needsTranslation(p.title) || needsTranslation(p.description)) && <Badge tone="red">Translate</Badge>}
                  </div>
                </Link>
                {can('editor') && (
                  <div className="flex shrink-0 flex-col gap-1 sm:flex-row sm:items-center">
                    <Button variant="ghost" size="sm" onClick={() => toggle(p.id, 'published', !p.published)} title={p.published ? 'Hide from the website' : 'Publish'}>
                      {p.published ? 'Hide' : 'Publish'}
                    </Button>
                    {!filtered && (
                      <div className="hidden gap-1 sm:flex">
                        <Button variant="ghost" size="sm" aria-label="Move up" disabled={idx === 0} onClick={() => move(p.id, -1)}>
                          ↑
                        </Button>
                        <Button variant="ghost" size="sm" aria-label="Move down" disabled={idx === data!.projects.length - 1} onClick={() => move(p.id, 1)}>
                          ↓
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <ProjectsList />
    </Suspense>
  );
}
