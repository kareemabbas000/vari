'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { JSONContent } from '@tiptap/react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { Badge, Button, Card, ConfirmDialog, Field, Input, Select, Spinner, Switch, Textarea, useToast } from '@/components/admin/ui';
import I18nInput, { type I18nValue } from '@/components/admin/I18nInput';
import MediaLibrary from '@/components/admin/MediaLibrary';
import Modal from '@/components/admin/Modal';
import { must, usePublish } from '@/components/admin/hooks';
import { useMember } from '@/components/admin/AdminShell';
import RichEditor, { type EditorValue } from '@/components/admin/blog/RichEditor';
import { mediaSrc } from '@/lib/media';
import { locales, localeMeta, type Locale } from '@/lib/i18n/config';
import { seoChecks, sourceHash } from '@/lib/seo-check';
import { textOf } from '@/lib/blog-html';
import { postSlug } from '@/lib/blog-slug';
import type { Json } from '@/lib/database.types';

type Tr = {
  slug: string;
  title: string;
  excerpt: string;
  content: JSONContent | string | null;
  html: string;
  takeaways: string[];
  seo_title: string;
  seo_description: string;
  focus_keyword: string;
  ready: boolean;
  source_hash: string | null;
  word_count: number;
  exists: boolean;
};
type Post = { id: string; status: 'draft' | 'published'; publish_at: string | null; category_id: string | null; author_id: string | null; cover: string | null; cover_alt: I18nValue; featured: boolean; faq: { q: I18nValue; a: I18nValue }[] };
type Opt = { id: string; label: string };

const emptyTr = (): Tr => ({ slug: '', title: '', excerpt: '', content: null, html: '', takeaways: [], seo_title: '', seo_description: '', focus_keyword: '', ready: false, source_hash: null, word_count: 0, exists: false });

const toLocalInput = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function PostEditor() {
  const { id } = useParams<{ id: string }>();
  const db = supabaseBrowser();
  const router = useRouter();
  const toast = useToast();
  const publishSite = usePublish();
  const { can } = useMember();
  const editable = can('editor');

  const [post, setPost] = useState<Post | null>(null);
  const [trs, setTrs] = useState<Record<Locale, Tr>>({ en: emptyTr(), de: emptyTr(), es: emptyTr() });
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [cats, setCats] = useState<Opt[]>([]);
  const [authors, setAuthors] = useState<Opt[]>([]);
  const [tags, setTags] = useState<Opt[]>([]);
  const [lang, setLang] = useState<Locale>('en');
  const [compare, setCompare] = useState(true);
  const [slugTouched, setSlugTouched] = useState<Record<Locale, boolean>>({ en: false, de: false, es: false });
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [coverPick, setCoverPick] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [deepl, setDeepl] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editorKey, setEditorKey] = useState(0);

  const load = useCallback(async () => {
    try {
      const [p, t, pt, c, a, tg] = await Promise.all([
        db.from('blog_posts').select('id,status,publish_at,category_id,author_id,cover,cover_alt,featured,faq').eq('id', id).single(),
        db.from('blog_post_translations').select('*').eq('post_id', id),
        db.from('blog_post_tags').select('tag_id').eq('post_id', id),
        db.from('blog_categories').select('id,name').order('sort'),
        db.from('blog_authors').select('id,name').order('name'),
        db.from('blog_tags').select('id,name').order('created_at'),
      ]);
      setPost(must(p) as unknown as Post);
      const next = { en: emptyTr(), de: emptyTr(), es: emptyTr() };
      (must(t) as unknown as (Tr & { locale: Locale })[]).forEach((r) => (next[r.locale] = { ...emptyTr(), ...r, takeaways: Array.isArray(r.takeaways) ? r.takeaways : [], exists: true }));
      setTrs(next);
      setSlugTouched({ en: !!next.en.slug, de: !!next.de.slug, es: !!next.es.slug });
      setTagIds((must(pt) as { tag_id: string }[]).map((x) => x.tag_id));
      setCats((must(c) as { id: string; name: I18nValue }[]).map((x) => ({ id: x.id, label: x.name.en || '' })));
      setAuthors((must(a) as { id: string; name: string }[]).map((x) => ({ id: x.id, label: x.name })));
      setTags((must(tg) as { id: string; name: I18nValue }[]).map((x) => ({ id: x.id, label: x.name.en || '' })));
      setDirty(false);
      setEditorKey((k) => k + 1);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [db, id]);

  useEffect(() => {
    load();
    fetch('/api/admin/translate').then((r) => r.json()).then((j) => setDeepl(!!j.available)).catch(() => {});
  }, [load]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => dirty && e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const tr = trs[lang];
  const en = trs.en;
  const enHash = useMemo(() => sourceHash([en.title, en.excerpt, en.html, en.takeaways.join('\n'), en.seo_title, en.seo_description]), [en]);
  const setTr = (l: Locale, patch: Partial<Tr>) => {
    setTrs((all) => ({ ...all, [l]: { ...all[l], ...patch } }));
    setDirty(true);
  };
  const setP = (patch: Partial<Post>) => {
    setPost((p) => (p ? { ...p, ...patch } : p));
    setDirty(true);
  };
  const status = (l: Locale): 'ready' | 'outdated' | 'draft' | 'missing' => {
    const x = trs[l];
    if (!x.title.trim()) return 'missing';
    if (!x.ready) return 'draft';
    if (l !== 'en' && x.source_hash && x.source_hash !== enHash) return 'outdated';
    return 'ready';
  };

  const seo = useMemo(
    () => seoChecks({ title: tr.title, slug: tr.slug, excerpt: tr.excerpt, html: tr.html, seoTitle: tr.seo_title, seoDescription: tr.seo_description, focus: tr.focus_keyword, takeaways: tr.takeaways }, { hasCover: !!post?.cover, hasCoverAlt: !!post?.cover_alt?.[lang], faqCount: (post?.faq || []).filter((f) => f.q?.[lang] && f.a?.[lang]).length }),
    [tr, post, lang],
  );

  if (error) return <p className="text-[#E8A598]">{error}</p>;
  if (!post) return <Spinner />;

  const live = post.status === 'published' && post.publish_at && new Date(post.publish_at) <= new Date();
  const scheduled = post.status === 'published' && post.publish_at && new Date(post.publish_at) > new Date();

  async function save(publish?: 'publish' | 'unpublish') {
    if (!post) return;
    if (!en.title.trim()) {
      setLang('en');
      return toast('error', 'Write the English title first — English is the source language.');
    }
    for (const l of locales) {
      const x = trs[l];
      if (x.title.trim() && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(x.slug)) {
        setLang(l);
        return toast('error', `Check the ${localeMeta[l].name} address (lowercase letters, numbers, hyphens).`);
      }
    }
    setSaving(true);
    const nextStatus = publish === 'publish' ? 'published' : publish === 'unpublish' ? 'draft' : post.status;
    const publishAt = publish === 'publish' ? post.publish_at || new Date().toISOString() : post.publish_at;
    const res = await db
      .from('blog_posts')
      .update({ status: nextStatus, publish_at: publishAt, category_id: post.category_id, author_id: post.author_id, cover: post.cover, cover_alt: post.cover_alt as Json, featured: post.featured, faq: post.faq as unknown as Json })
      .eq('id', post.id)
      .select('id');
    if (res.error || !res.data?.length) {
      setSaving(false);
      return toast('error', res.error?.message || 'Not saved — sign in again.');
    }
    const rows = locales
      .filter((l) => trs[l].title.trim())
      .map((l) => {
        const x = trs[l];
        const ready = l === 'en' && publish === 'publish' ? true : x.ready;
        return {
          post_id: post.id,
          locale: l,
          slug: x.slug,
          title: x.title.trim(),
          excerpt: x.excerpt.trim(),
          content: (typeof x.content === 'string' ? null : x.content) as Json,
          html: x.html,
          takeaways: x.takeaways.map((k) => k.trim()).filter(Boolean) as Json,
          seo_title: x.seo_title.trim(),
          seo_description: x.seo_description.trim(),
          focus_keyword: x.focus_keyword.trim(),
          ready,
          source_hash: l === 'en' ? null : x.source_hash,
          word_count: textOf(x.html).split(/\s+/).filter(Boolean).length,
        };
      });
    const up = await db.from('blog_post_translations').upsert(rows, { onConflict: 'post_id,locale' });
    if (up.error) {
      setSaving(false);
      return toast('error', up.error.message.includes('locale_slug') || up.error.message.includes('duplicate') ? 'Another article already uses one of these addresses.' : up.error.message);
    }
    await db.from('blog_post_tags').delete().eq('post_id', post.id);
    if (tagIds.length) await db.from('blog_post_tags').insert(tagIds.map((tag_id) => ({ post_id: post.id, tag_id })));
    setSaving(false);
    setDirty(false);
    setPost({ ...post, status: nextStatus, publish_at: publishAt });
    if (publish === 'publish') setTrs((all) => ({ ...all, en: { ...all.en, ready: true, exists: true } }));
    const when = publishAt && new Date(publishAt) > new Date() ? `scheduled for ${new Date(publishAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}` : '';
    if (nextStatus === 'published' || publish === 'unpublish') publishSite(publish === 'unpublish' ? 'Article unpublished' : when ? `Article ${when}` : 'Article');
    else toast('success', 'Draft saved.');
  }

  function startFromEnglish() {
    setTr(lang, { content: en.content, html: en.html, takeaways: [...en.takeaways], title: tr.title || en.title, excerpt: tr.excerpt || en.excerpt, source_hash: enHash });
    setEditorKey((k) => k + 1);
    toast('info', `English copied into ${localeMeta[lang].name} — now translate the text, keeping images and structure.`);
  }

  async function machineTranslate() {
    setTranslating(true);
    const plain = [en.title, en.excerpt, en.seo_title || en.title, en.seo_description || en.excerpt, en.focus_keyword, ...en.takeaways];
    try {
      const [a, b] = await Promise.all([
        fetch('/api/admin/translate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ texts: plain.map((x) => x || ' '), target: lang }) }).then((r) => r.json()),
        fetch('/api/admin/translate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ texts: [en.html || '<p></p>'], target: lang, html: true }) }).then((r) => r.json()),
      ]);
      if (!a.ok || !b.ok) throw new Error(a.error || b.error);
      const [title, excerpt, seoTitle, seoDesc, focus, ...take] = a.texts as string[];
      setTr(lang, { title, excerpt, seo_title: seoTitle, seo_description: seoDesc, focus_keyword: focus.trim(), takeaways: take, content: b.texts[0], html: b.texts[0], slug: slugTouched[lang] ? tr.slug : postSlug(title), source_hash: enHash, ready: false });
      setEditorKey((k) => k + 1);
      toast('success', 'Draft translation ready — please read it through, then mark it ready.');
    } catch (e) {
      toast('error', (e as Error).message || 'Translation failed.');
    } finally {
      setTranslating(false);
    }
  }

  async function addTag() {
    const name = newTag.trim();
    if (!name) return;
    const slug = postSlug(name);
    const existing = tags.find((x) => postSlug(x.label) === slug);
    if (existing) {
      if (!tagIds.includes(existing.id)) setTagIds([...tagIds, existing.id]);
    } else {
      const res = await db.from('blog_tags').insert({ slug, name: { en: name } as Json }).select('id').single();
      if (res.error) return toast('error', res.error.message);
      setTags([...tags, { id: res.data.id, label: name }]);
      setTagIds([...tagIds, res.data.id]);
    }
    setNewTag('');
    setDirty(true);
  }

  async function remove() {
    const { error: err } = await db.from('blog_posts').delete().eq('id', post!.id);
    if (err) return toast('error', err.message);
    publishSite('Article deleted');
    router.replace('/admin/blog');
  }

  const dot = (s: ReturnType<typeof status>) => ({ ready: 'bg-emerald-400', outdated: 'bg-[#E8A598]', draft: 'bg-gold', missing: 'bg-bone/25' })[s];
  const stLabel = { ready: 'Ready', outdated: 'English changed', draft: 'In progress', missing: 'Not started' };

  return (
    <div className="pb-24">
      {/* Top bar */}
      <div className="sticky top-0 z-30 -mx-4 mb-6 flex flex-wrap items-center gap-3 border-b border-bone/10 bg-[#0e0d0c]/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
        <Link href="/admin/blog" className="text-sm text-bone/50 hover:text-gold">← Articles</Link>
        <span className="line-clamp-1 min-w-0 flex-1 font-display text-xl">{en.title || 'Untitled article'}</span>
        {live ? <Badge tone="green">Live</Badge> : scheduled ? <Badge tone="blue">Scheduled</Badge> : <Badge>Draft</Badge>}
        {dirty && <span className="text-xs text-gold">Unsaved changes</span>}
        {editable && (
          <>
            <Button size="sm" variant="secondary" onClick={() => save()} busy={saving}>Save</Button>
            {post.status === 'published' ? (
              <>
                <Button size="sm" variant="ghost" onClick={() => save('unpublish')}>Unpublish</Button>
                <Button size="sm" onClick={() => save('publish')} busy={saving}>Update</Button>
              </>
            ) : (
              <Button size="sm" onClick={() => save('publish')} busy={saving}>{post.publish_at && new Date(post.publish_at) > new Date() ? 'Schedule' : 'Publish'}</Button>
            )}
          </>
        )}
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-6">
          {/* Languages */}
          <div className="flex flex-wrap items-center gap-2">
            {locales.map((l) => {
              const s = status(l);
              return (
                <button key={l} type="button" onClick={() => setLang(l)} aria-pressed={lang === l} className={`flex min-h-[44px] items-center gap-2.5 rounded-sm border px-4 text-sm transition ${lang === l ? 'border-gold bg-gold/10 text-bone' : 'border-bone/15 text-bone/60 hover:border-bone/40'}`}>
                  <span className={`h-2 w-2 rounded-full ${dot(s)}`} />
                  <span className="font-medium">{localeMeta[l].name}</span>
                  <span className="text-xs text-bone/45">{stLabel[s]}</span>
                </button>
              );
            })}
            {lang !== 'en' && (
              <div className="ml-auto flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2 text-sm text-bone/60"><input type="checkbox" checked={compare} onChange={(e) => setCompare(e.target.checked)} className="accent-[#D4AF37]" /> Show English beside</label>
              </div>
            )}
          </div>

          {lang !== 'en' && editable && (
            <Card>
              <div className="flex flex-wrap items-center gap-3">
                <p className="mr-auto text-sm text-bone/65">
                  {status(lang) === 'outdated' ? (
                    <span className="text-[#E8A598]">The English article changed after this translation was made. Review the differences, then confirm.</span>
                  ) : tr.title ? (
                    `Translating into ${localeMeta[lang].name}. Mark it ready when it reads well — only ready languages appear on the website.`
                  ) : (
                    `No ${localeMeta[lang].name} version yet. Start from the English article (keeps images and structure) and translate the text.`
                  )}
                </p>
                <Button size="sm" variant="secondary" onClick={startFromEnglish} disabled={!en.html}>Start from English</Button>
                {deepl && <Button size="sm" variant="secondary" onClick={machineTranslate} busy={translating} disabled={!en.html}>Draft with DeepL</Button>}
                {status(lang) === 'outdated' && <Button size="sm" onClick={() => setTr(lang, { source_hash: enHash })}>Mark as up to date</Button>}
              </div>
            </Card>
          )}

          <fieldset disabled={!editable} className={`grid gap-6 ${lang !== 'en' && compare ? '2xl:grid-cols-2' : ''}`}>
            {lang !== 'en' && compare && (
              <div className="hidden min-w-0 space-y-4 rounded-sm border border-bone/10 bg-bone/[0.02] p-5 2xl:block">
                <p className="label text-bone/45">English original</p>
                <h2 className="font-display text-3xl">{en.title}</h2>
                <p className="text-bone/60">{en.excerpt}</p>
                {en.takeaways.length > 0 && <ul className="list-disc pl-5 text-sm text-bone/60">{en.takeaways.map((k, i) => <li key={i}>{k}</li>)}</ul>}
                <div className="post-body admin-post-body max-h-[70vh] overflow-y-auto text-[0.95rem]" dangerouslySetInnerHTML={{ __html: en.html }} />
              </div>
            )}

            <div className="min-w-0 space-y-6">
              <Field label={`Title (${localeMeta[lang].name})`} htmlFor="title">
                <Input
                  id="title"
                  value={tr.title}
                  maxLength={200}
                  onChange={(e) => setTr(lang, { title: e.target.value, ...(slugTouched[lang] ? {} : { slug: postSlug(e.target.value) }) })}
                  className="font-display !text-2xl"
                  placeholder={lang === 'en' ? 'A clear, specific title' : en.title}
                />
              </Field>
              <Field label="Address" htmlFor="slug" hint={`vari-studio.com/${lang}/blog/${tr.slug || '…'}`}>
                <Input id="slug" value={tr.slug} onChange={(e) => { setSlugTouched({ ...slugTouched, [lang]: true }); setTr(lang, { slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-{2,}/g, '-') }); }} />
              </Field>
              <Field label="Intro / excerpt" htmlFor="excerpt" hint="One or two sentences under the title and on article cards.">
                <Textarea id="excerpt" rows={3} maxLength={600} value={tr.excerpt} onChange={(e) => setTr(lang, { excerpt: e.target.value })} placeholder={lang === 'en' ? '' : en.excerpt} />
              </Field>

              <div>
                <p className="mb-2 font-sans text-[0.72rem] font-medium uppercase tracking-[0.16em] text-bone/60">Key takeaways</p>
                <div className="space-y-2">
                  {tr.takeaways.map((k, i) => (
                    <div key={i} className="flex gap-2">
                      <Input value={k} onChange={(e) => setTr(lang, { takeaways: tr.takeaways.map((x, j) => (j === i ? e.target.value : x)) })} placeholder={lang === 'en' ? 'One short insight' : en.takeaways[i]} />
                      <Button size="sm" variant="ghost" aria-label="Remove" onClick={() => setTr(lang, { takeaways: tr.takeaways.filter((_, j) => j !== i) })}>✕</Button>
                    </div>
                  ))}
                  {tr.takeaways.length < 6 && <Button size="sm" variant="secondary" onClick={() => setTr(lang, { takeaways: [...tr.takeaways, ''] })}>Add takeaway</Button>}
                </div>
              </div>

              <div>
                <p className="mb-2 font-sans text-[0.72rem] font-medium uppercase tracking-[0.16em] text-bone/60">Article</p>
                <RichEditor
                  key={`${lang}-${editorKey}`}
                  value={tr.content ?? (tr.html || null)}
                  editable={editable}
                  placeholder={lang === 'en' ? 'Write your article… Use H2 for sections, add images, quotes, tip boxes and a call to action.' : 'Translate the article here…'}
                  onChange={(v: EditorValue) => setTr(lang, { content: v.json, html: v.html, word_count: v.words })}
                />
              </div>

              <Card title={`Search engines — ${localeMeta[lang].name}`}>
                <div className="space-y-5">
                  <Field label="Focus keyword" htmlFor="kw" hint="The main phrase people search for, e.g. “architectural rendering cost”.">
                    <Input id="kw" value={tr.focus_keyword} onChange={(e) => setTr(lang, { focus_keyword: e.target.value })} />
                  </Field>
                  <Field label="SEO title" htmlFor="st" hint={`${(tr.seo_title || tr.title).length}/60 — leave empty to use the title.`}>
                    <Input id="st" value={tr.seo_title} maxLength={120} onChange={(e) => setTr(lang, { seo_title: e.target.value })} placeholder={tr.title} />
                  </Field>
                  <Field label="Meta description" htmlFor="sd" hint={`${(tr.seo_description || tr.excerpt).length}/160 — leave empty to use the intro.`}>
                    <Textarea id="sd" rows={3} maxLength={320} value={tr.seo_description} onChange={(e) => setTr(lang, { seo_description: e.target.value })} placeholder={tr.excerpt} />
                  </Field>
                  <div className="rounded-sm bg-white p-4 text-left font-[arial,sans-serif]">
                    <p className="text-[12px] text-[#4d5156]">vari-studio.com › {lang} › blog › {tr.slug || '…'}</p>
                    <p className="mt-1 line-clamp-1 text-[18px] text-[#1a0dab]">{(tr.seo_title || tr.title || 'Article title') + ' | VARI Studio'}</p>
                    <p className="mt-1 line-clamp-2 text-[13px] text-[#4d5156]">{tr.seo_description || tr.excerpt || 'Meta description…'}</p>
                  </div>
                </div>
              </Card>

              <div className="flex items-center justify-between gap-4 rounded-sm border border-bone/10 p-4">
                <Switch
                  checked={tr.ready}
                  onChange={(ready) => setTr(lang, { ready, ...(lang !== 'en' && ready ? { source_hash: enHash } : {}) })}
                  label={`${localeMeta[lang].name} version is ready`}
                  description="Only ready languages are shown on the website (and listed for search engines)."
                />
              </div>
            </div>
          </fieldset>
        </div>

        {/* Sidebar */}
        <fieldset disabled={!editable} className="space-y-6">
          <Card title="Publishing">
            <div className="space-y-4">
              <Field label="Publish date & time" htmlFor="when" hint="A future date schedules the article — it appears automatically (within about 5 minutes).">
                <Input id="when" type="datetime-local" value={toLocalInput(post.publish_at)} onChange={(e) => setP({ publish_at: e.target.value ? new Date(e.target.value).toISOString() : null })} />
              </Field>
              <Switch checked={post.featured} onChange={(featured) => setP({ featured })} label="Feature on the journal page" />
              {live && trs[lang].ready && <a href={`/${lang}/blog/${tr.slug}`} target="_blank" rel="noreferrer" className="block text-sm text-gold hover:underline">View on the website ↗</a>}
            </div>
          </Card>

          <Card title={`SEO score · ${localeMeta[lang].short}`}>
            <div className="mb-4 flex items-center gap-4">
              <div className={`grid h-16 w-16 place-items-center rounded-full border-4 font-display text-2xl ${seo.score >= 80 ? 'border-emerald-400 text-emerald-300' : seo.score >= 55 ? 'border-gold text-gold' : 'border-[#E8A598] text-[#E8A598]'}`}>{seo.score}</div>
              <p className="text-sm text-bone/55">{seo.score >= 80 ? 'Well optimised.' : seo.score >= 55 ? 'Good — a few improvements left.' : 'Needs work before publishing.'}</p>
            </div>
            <ul className="space-y-2">
              {seo.checks.map((c) => (
                <li key={c.label} className="flex gap-2 text-sm" title={c.tip}>
                  <span className={c.ok ? 'text-emerald-400' : 'text-[#E8A598]'}>{c.ok ? '✓' : '○'}</span>
                  <span className={c.ok ? 'text-bone/70' : 'text-bone'}>
                    {c.label}
                    {!c.ok && <span className="block text-xs text-bone/45">{c.tip}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Cover image">
            {post.cover ? (
              <div className="space-y-3">
                <div className="relative aspect-[16/10] overflow-hidden rounded-sm"><Image src={post.cover} alt="" fill sizes="360px" className="object-cover" /></div>
                <div className="flex gap-3 text-sm">
                  <button type="button" className="text-gold hover:underline" onClick={() => setCoverPick(true)}>Replace</button>
                  <button type="button" className="text-bone/50 hover:text-[#E8A598]" onClick={() => setP({ cover: null })}>Remove</button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => setCoverPick(true)} className="grid aspect-[16/10] w-full place-items-center rounded-sm border border-dashed border-gold/40 text-sm text-gold hover:bg-gold/5">Choose cover image</button>
            )}
            <div className="mt-4">
              <I18nInput compact label="Cover description (alt text)" value={post.cover_alt || {}} onChange={(cover_alt) => setP({ cover_alt })} maxLength={160} />
            </div>
          </Card>

          <Card title="Organise">
            <div className="space-y-4">
              <Field label="Category" htmlFor="cat">
                <Select id="cat" value={post.category_id || ''} onChange={(e) => setP({ category_id: e.target.value || null })}>
                  <option value="">— None —</option>
                  {cats.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </Select>
              </Field>
              <Field label="Author" htmlFor="author">
                <Select id="author" value={post.author_id || ''} onChange={(e) => setP({ author_id: e.target.value || null })}>
                  <option value="">— None —</option>
                  {authors.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
                </Select>
              </Field>
              <div>
                <p className="mb-2 font-sans text-[0.72rem] font-medium uppercase tracking-[0.16em] text-bone/60">Tags</p>
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {tagIds.map((tid) => (
                    <button key={tid} type="button" onClick={() => { setTagIds(tagIds.filter((x) => x !== tid)); setDirty(true); }} className="rounded-sm border border-gold/40 px-2 py-1 text-xs text-gold hover:bg-gold/10">
                      #{tags.find((x) => x.id === tid)?.label} ✕
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input list="tag-list" value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())} placeholder="Add a tag" />
                  <Button size="sm" variant="secondary" onClick={addTag}>Add</Button>
                </div>
                <datalist id="tag-list">{tags.map((x) => <option key={x.id} value={x.label} />)}</datalist>
              </div>
              <Link href="/admin/blog/settings" className="block text-xs text-bone/45 hover:text-gold">Manage categories, authors and tags →</Link>
            </div>
          </Card>

          <Card title="FAQ (shown in Google)">
            <div className="space-y-4">
              {post.faq.map((f, i) => (
                <div key={i} className="space-y-3 rounded-sm border border-bone/10 p-3">
                  <I18nInput compact label={`Question ${i + 1}`} value={f.q} onChange={(q) => setP({ faq: post.faq.map((x, j) => (j === i ? { ...x, q } : x)) })} maxLength={200} />
                  <I18nInput compact label="Answer" value={f.a} onChange={(a) => setP({ faq: post.faq.map((x, j) => (j === i ? { ...x, a } : x)) })} multiline rows={4} maxLength={1200} />
                  <button type="button" onClick={() => setP({ faq: post.faq.filter((_, j) => j !== i) })} className="text-xs text-bone/45 hover:text-[#E8A598]">Remove question</button>
                </div>
              ))}
              {post.faq.length < 10 && <Button size="sm" variant="secondary" onClick={() => setP({ faq: [...post.faq, { q: {}, a: {} }] })}>Add question</Button>}
            </div>
          </Card>

          {can('admin') && (
            <Button variant="danger" className="w-full" onClick={() => setConfirmDelete(true)}>Delete article</Button>
          )}
        </fieldset>
      </div>

      <Modal open={coverPick} title="Cover image" onClose={() => setCoverPick(false)} wide>
        <MediaLibrary
          mode="pick"
          onPick={(rows) => {
            const m = rows[0];
            if (m) setP({ cover: mediaSrc(m.source, m.path), cover_alt: post.cover_alt?.en ? post.cover_alt : ((m.alt as I18nValue) || {}) });
            setCoverPick(false);
          }}
        />
      </Modal>
      <ConfirmDialog open={confirmDelete} title="Delete this article?" body="All language versions are deleted permanently and their addresses stop working." confirmLabel="Delete article" requireText="delete" onConfirm={remove} onCancel={() => setConfirmDelete(false)} />
    </div>
  );
}
