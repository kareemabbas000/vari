'use client';

import Link from 'next/link';
import { useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { Button, Card, Field, Input, PageHeader, Spinner, useToast } from '@/components/admin/ui';
import I18nInput, { type I18nValue } from '@/components/admin/I18nInput';
import { must, usePublish, useLoad } from '@/components/admin/hooks';
import { useMember } from '@/components/admin/AdminShell';
import { postSlug } from '@/lib/blog-slug';
import type { Json } from '@/lib/database.types';

type Cat = { id?: string; slug: string; name: I18nValue; description: I18nValue; sort: number };
type Author = { id?: string; slug: string; name: string; role: I18nValue; bio: I18nValue };
type Tag = { id: string; slug: string; name: I18nValue };

export default function BlogSettings() {
  const db = supabaseBrowser();
  const toast = useToast();
  const publish = usePublish();
  const { can } = useMember();
  const [busy, setBusy] = useState('');
  const { data, loading, error, setData } = useLoad(async () => {
    const [c, a, t] = await Promise.all([db.from('blog_categories').select('id,slug,name,description,sort').order('sort'), db.from('blog_authors').select('id,slug,name,role,bio').order('name'), db.from('blog_tags').select('id,slug,name').order('created_at')]);
    return { cats: must(c) as unknown as Cat[], authors: must(a) as unknown as Author[], tags: must(t) as unknown as Tag[] };
  });
  if (loading) return <Spinner />;
  if (error || !data) return <p className="text-[#E8A598]">{error}</p>;
  const editable = can('editor');

  async function saveCat(c: Cat, i: number) {
    if (!c.name.en?.trim() || !c.slug) return toast('error', 'A category needs an English name and an address.');
    setBusy(`c${i}`);
    const row = { slug: c.slug, name: c.name as Json, description: c.description as Json, sort: c.sort };
    const res = c.id ? await db.from('blog_categories').update(row).eq('id', c.id).select('id').single() : await db.from('blog_categories').insert(row).select('id').single();
    setBusy('');
    if (res.error) return toast('error', res.error.message);
    setData({ ...data!, cats: data!.cats.map((x, k) => (k === i ? { ...c, id: res.data.id } : x)) });
    publish('Category');
  }
  async function delCat(c: Cat, i: number) {
    if (c.id) {
      const res = await db.from('blog_categories').delete().eq('id', c.id);
      if (res.error) return toast('error', res.error.message);
    }
    setData({ ...data!, cats: data!.cats.filter((_, k) => k !== i) });
  }
  async function saveAuthor(a: Author, i: number) {
    if (!a.name.trim() || !a.slug) return toast('error', 'An author needs a name and an address.');
    setBusy(`a${i}`);
    const row = { slug: a.slug, name: a.name, role: a.role as Json, bio: a.bio as Json };
    const res = a.id ? await db.from('blog_authors').update(row).eq('id', a.id).select('id').single() : await db.from('blog_authors').insert(row).select('id').single();
    setBusy('');
    if (res.error) return toast('error', res.error.message);
    setData({ ...data!, authors: data!.authors.map((x, k) => (k === i ? { ...a, id: res.data.id } : x)) });
    publish('Author');
  }
  async function saveTag(t: Tag) {
    const res = await db.from('blog_tags').update({ name: t.name as Json }).eq('id', t.id);
    if (res.error) return toast('error', res.error.message);
    toast('success', 'Tag saved.');
  }
  async function delTag(t: Tag) {
    const res = await db.from('blog_tags').delete().eq('id', t.id);
    if (res.error) return toast('error', res.error.message);
    setData({ ...data!, tags: data!.tags.filter((x) => x.id !== t.id) });
  }

  return (
    <>
      <Link href="/admin/blog" className="mb-4 inline-block text-sm text-bone/50 hover:text-gold">← Journal</Link>
      <PageHeader title="Categories, authors & tags" description="Categories get their own page on the site (/blog/category/…); authors get a profile page that also helps search engines trust the content." />
      <fieldset disabled={!editable} className="grid gap-6 xl:grid-cols-2">
        <Card title="Categories" actions={<Button size="sm" variant="secondary" onClick={() => setData({ ...data, cats: [...data.cats, { slug: '', name: {}, description: {}, sort: (data.cats.length + 1) * 10 }] })}>Add</Button>}>
          <div className="space-y-4">
            {data.cats.map((c, i) => (
              <div key={c.id ?? `n${i}`} className="space-y-3 rounded-sm border border-bone/10 p-4">
                <I18nInput label="Name" value={c.name} onChange={(name) => setData({ ...data, cats: data.cats.map((x, k) => (k === i ? { ...x, name, slug: x.id ? x.slug : postSlug(name.en || '') } : x)) })} maxLength={60} />
                <I18nInput label="Description (shown on the category page)" value={c.description} multiline rows={2} onChange={(description) => setData({ ...data, cats: data.cats.map((x, k) => (k === i ? { ...x, description } : x)) })} maxLength={300} />
                <div className="flex flex-wrap items-end gap-3">
                  <Field label="Address" htmlFor={`cs${i}`}>
                    <Input id={`cs${i}`} value={c.slug} onChange={(e) => setData({ ...data, cats: data.cats.map((x, k) => (k === i ? { ...x, slug: postSlug(e.target.value) } : x)) })} />
                  </Field>
                  <Button size="sm" onClick={() => saveCat(c, i)} busy={busy === `c${i}`}>Save</Button>
                  {can('admin') && <Button size="sm" variant="ghost" onClick={() => delCat(c, i)}>Delete</Button>}
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Authors" actions={<Button size="sm" variant="secondary" onClick={() => setData({ ...data, authors: [...data.authors, { slug: '', name: '', role: {}, bio: {} }] })}>Add</Button>}>
          <div className="space-y-4">
            {data.authors.map((a, i) => (
              <div key={a.id ?? `n${i}`} className="space-y-3 rounded-sm border border-bone/10 p-4">
                <Field label="Name" htmlFor={`an${i}`}>
                  <Input id={`an${i}`} value={a.name} onChange={(e) => setData({ ...data, authors: data.authors.map((x, k) => (k === i ? { ...x, name: e.target.value, slug: x.id ? x.slug : postSlug(e.target.value) } : x)) })} />
                </Field>
                <I18nInput label="Role" value={a.role} onChange={(role) => setData({ ...data, authors: data.authors.map((x, k) => (k === i ? { ...x, role } : x)) })} maxLength={80} />
                <I18nInput label="Short bio" value={a.bio} multiline rows={3} onChange={(bio) => setData({ ...data, authors: data.authors.map((x, k) => (k === i ? { ...x, bio } : x)) })} maxLength={500} />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => saveAuthor(a, i)} busy={busy === `a${i}`}>Save</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Tags" className="xl:col-span-2">
          {!data.tags.length && <p className="text-sm text-bone/45">Tags are created while writing an article.</p>}
          <div className="grid gap-3 md:grid-cols-2">
            {data.tags.map((t, i) => (
              <div key={t.id} className="space-y-2 rounded-sm border border-bone/10 p-3">
                <I18nInput compact label={`#${t.slug}`} value={t.name} onChange={(name) => setData({ ...data, tags: data.tags.map((x, k) => (k === i ? { ...x, name } : x)) })} maxLength={40} />
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => saveTag(data.tags[i])}>Save</Button>
                  {can('admin') && <Button size="sm" variant="ghost" onClick={() => delTag(t)}>Delete</Button>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </fieldset>
    </>
  );
}
