'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { Badge, Button, EmptyState, Input, LinkButton, PageHeader, Spinner, useToast } from '@/components/admin/ui';
import { formatDate, must, useLoad } from '@/components/admin/hooks';
import { useMember } from '@/components/admin/AdminShell';
import { locales, type Locale } from '@/lib/i18n/config';

type Row = {
  id: string;
  status: string;
  publish_at: string | null;
  updated_at: string;
  cover: string | null;
  featured: boolean;
  category: { name: { en?: string } } | null;
  translations: { locale: Locale; title: string; ready: boolean; word_count: number; source_hash: string | null }[];
};
type Filter = 'all' | 'live' | 'scheduled' | 'draft';

const stateOf = (r: Row): Exclude<Filter, 'all'> => (r.status !== 'published' || !r.publish_at ? 'draft' : new Date(r.publish_at) > new Date() ? 'scheduled' : 'live');

export default function BlogList() {
  const db = supabaseBrowser();
  const router = useRouter();
  const toast = useToast();
  const { can } = useMember();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [creating, setCreating] = useState(false);
  const { data, loading, error } = useLoad(async () => must(await db.from('blog_posts').select('id,status,publish_at,updated_at,cover,featured,category:blog_categories(name),translations:blog_post_translations(locale,title,ready,word_count,source_hash)').order('updated_at', { ascending: false })) as unknown as Row[]);

  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    return (data || []).filter((r) => (filter === 'all' || stateOf(r) === filter) && (!n || r.translations.some((t) => t.title.toLowerCase().includes(n))));
  }, [data, q, filter]);
  const counts = useMemo(() => {
    const c = { all: 0, live: 0, scheduled: 0, draft: 0 } as Record<Filter, number>;
    (data || []).forEach((r) => {
      c.all++;
      c[stateOf(r)]++;
    });
    return c;
  }, [data]);

  async function create() {
    setCreating(true);
    const author = await db.from('blog_authors').select('id').eq('slug', 'vari-studio').maybeSingle();
    const res = await db.from('blog_posts').insert({ status: 'draft', author_id: author.data?.id ?? null }).select('id').single();
    setCreating(false);
    if (res.error) return toast('error', res.error.message);
    router.push(`/admin/blog/${res.data.id}`);
  }

  if (loading) return <Spinner />;
  if (error) return <p className="text-[#E8A598]">{error}</p>;

  return (
    <>
      <PageHeader
        eyebrow="Content"
        title="Journal (blog)"
        description="Write, translate, schedule and optimise articles in English, German and Spanish."
        actions={
          <div className="flex gap-2">
            <LinkButton href="/admin/blog/settings">Categories & authors</LinkButton>
            {can('editor') && <Button onClick={create} busy={creating}>New article</Button>}
          </div>
        }
      />
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1">
          {(['all', 'live', 'scheduled', 'draft'] as Filter[]).map((f) => (
            <button key={f} type="button" onClick={() => setFilter(f)} aria-pressed={filter === f} className={`min-h-[40px] rounded-sm px-3 text-sm capitalize ${filter === f ? 'bg-gold text-night' : 'text-bone/60 hover:bg-bone/5'}`}>
              {f} <span className="opacity-60">{counts[f]}</span>
            </button>
          ))}
        </div>
        <Input type="search" placeholder="Search titles…" value={q} onChange={(e) => setQ(e.target.value)} className="sm:max-w-xs" />
      </div>

      {!rows.length ? (
        <EmptyState title={data?.length ? 'No articles match' : 'No articles yet'} body={data?.length ? undefined : 'Create your first article — the editor guides you through SEO and translations.'} action={can('editor') && !data?.length ? <Button onClick={create}>New article</Button> : undefined} />
      ) : (
        <ul className="divide-y divide-bone/10 rounded-sm border border-bone/10">
          {rows.map((r) => {
            const en = r.translations.find((t) => t.locale === 'en');
            const st = stateOf(r);
            return (
              <li key={r.id}>
                <Link href={`/admin/blog/${r.id}`} className="flex items-center gap-4 p-3 transition hover:bg-bone/[0.03] sm:p-4">
                  <div className="relative hidden h-16 w-24 shrink-0 overflow-hidden rounded-sm bg-bone/5 sm:block">{r.cover && <Image src={r.cover} alt="" fill sizes="96px" className="object-cover" />}</div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 font-display text-xl">{en?.title || <span className="text-bone/40">Untitled</span>}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-bone/45">
                      {r.category?.name?.en && <span className="text-gold">{r.category.name.en}</span>}
                      <span>{en?.word_count ?? 0} words</span>
                      <span>{st === 'draft' ? `Edited ${formatDate(r.updated_at)}` : `${st === 'scheduled' ? 'Goes live' : 'Published'} ${formatDate(r.publish_at!, true)}`}</span>
                      {r.featured && <span>★ Featured</span>}
                    </p>
                  </div>
                  <div className="hidden gap-1 md:flex" aria-label="Languages">
                    {locales.map((l) => {
                      const t = r.translations.find((x) => x.locale === l);
                      return (
                        <span key={l} title={!t ? 'Not started' : t.ready ? 'Ready' : 'In progress'} className={`grid h-7 w-9 place-items-center rounded-sm border text-[0.65rem] font-medium uppercase ${!t ? 'border-bone/10 text-bone/25' : t.ready ? 'border-emerald-400/50 text-emerald-300' : 'border-gold/50 text-gold'}`}>
                          {l}
                        </span>
                      );
                    })}
                  </div>
                  {st === 'live' ? <Badge tone="green">Live</Badge> : st === 'scheduled' ? <Badge tone="blue">Scheduled</Badge> : <Badge>Draft</Badge>}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
