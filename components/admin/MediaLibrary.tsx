'use client';

import Image from 'next/image';
import { useMemo, useRef, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { mediaSrc } from '@/lib/media';
import { Badge, Button, ConfirmDialog, EmptyState, Input, Spinner, useToast } from './ui';
import I18nInput from './I18nInput';
import { must, useLoad } from './hooks';
import { MEDIA_COLUMNS, uploadImage, type MediaRow } from './media';
import { useMember } from './AdminShell';

/**
 * The media library. "manage": browse, upload, edit alt texts, delete unused images.
 * "pick": choose one or more images (used by the project editor and settings).
 */
export default function MediaLibrary({
  mode = 'manage',
  multiple = false,
  onPick,
}: {
  mode?: 'manage' | 'pick';
  multiple?: boolean;
  onPick?: (rows: MediaRow[]) => void;
}) {
  const db = supabaseBrowser();
  const toast = useToast();
  const { can } = useMember();
  const fileInput = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [editing, setEditing] = useState<MediaRow | null>(null);
  const [alt, setAlt] = useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data, setData, loading, error } = useLoad(async () => {
    const [media, usage, pages, settings, posts, articles] = await Promise.all([
      must(await db.from('media').select(MEDIA_COLUMNS).order('created_at', { ascending: false })),
      must(await db.from('project_media').select('media_id')),
      db.from('pages').select('blocks,draft,seo'),
      db.from('site_settings').select('data').eq('id', 1).maybeSingle(),
      db.from('blog_posts').select('cover'),
      db.from('blog_post_translations').select('html'),
    ]);
    const used = new Map<string, number>();
    usage.forEach((u) => used.set(u.media_id, (used.get(u.media_id) ?? 0) + 1));
    // Pages, the blog and site settings refer to images by their address.
    const elsewhere = JSON.stringify([pages.data ?? [], settings.data?.data ?? {}, posts.data ?? [], articles.data ?? []]);
    const usedElsewhere = new Set((media as MediaRow[]).filter((m) => elsewhere.includes(JSON.stringify(mediaSrc(m.source, m.path)).slice(1, -1))).map((m) => m.id));
    return { media: media as MediaRow[], used, usedElsewhere };
  });

  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    return (data?.media ?? []).filter((m) => !n || [m.file_name, m.alt?.en, m.path].some((f) => f?.toLowerCase().includes(n)));
  }, [data, q]);

  async function onFiles(files: FileList | null) {
    if (!files?.length || !data) return;
    setBusy(true);
    const added: MediaRow[] = [];
    for (const f of Array.from(files)) {
      try {
        added.push(await uploadImage(f));
      } catch (e) {
        toast('error', (e as Error).message);
      }
    }
    setBusy(false);
    if (fileInput.current) fileInput.current.value = '';
    if (added.length) {
      setData({ ...data, media: [...added, ...data.media] });
      toast('success', `${added.length} image${added.length > 1 ? 's' : ''} uploaded.`);
      if (mode === 'pick') setPicked((p) => (multiple ? [...added.map((a) => a.id), ...p] : [added[0].id]));
    }
  }

  function click(m: MediaRow) {
    if (mode === 'pick') {
      setPicked((p) => (multiple ? (p.includes(m.id) ? p.filter((x) => x !== m.id) : [...p, m.id]) : [m.id]));
      return;
    }
    setEditing(m);
    setAlt(m.alt || {});
  }

  async function saveAlt() {
    if (!editing || !data) return;
    const { error: err } = await db.from('media').update({ alt }).eq('id', editing.id);
    if (err) return toast('error', err.message);
    setData({ ...data, media: data.media.map((m) => (m.id === editing.id ? { ...m, alt } : m)) });
    toast('success', 'Alt text saved.');
    setEditing(null);
    fetch('/api/admin/revalidate', { method: 'POST' }).catch(() => undefined);
  }

  async function remove() {
    if (!editing || !data) return;
    if (editing.source === 'storage') await db.storage.from('media').remove([editing.path]);
    const { error: err } = await db.from('media').delete().eq('id', editing.id);
    if (err) return toast('error', err.message);
    setData({ ...data, media: data.media.filter((m) => m.id !== editing.id) });
    toast('success', 'Image deleted.');
    setConfirmDelete(false);
    setEditing(null);
  }

  const usedBy = editing ? data?.used.get(editing.id) ?? 0 : 0;
  const inPages = editing ? !!data?.usedElsewhere.has(editing.id) : false;

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input type="search" placeholder="Search by file name or alt text…" value={q} onChange={(e) => setQ(e.target.value)} className="sm:max-w-sm" />
        {can('editor') && (
          <>
            <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/svg+xml" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <Button onClick={() => fileInput.current?.click()} busy={busy}>
              Upload images
            </Button>
          </>
        )}
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <p className="text-[#E8A598]">{error}</p>
      ) : !rows.length ? (
        <EmptyState title="No images found" body={q ? 'Try another search.' : 'Upload the first image.'} />
      ) : (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
          {rows.map((m) => {
            const sel = picked.includes(m.id);
            return (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => click(m)}
                  aria-pressed={mode === 'pick' ? sel : undefined}
                  className={`group relative block aspect-square w-full overflow-hidden rounded-sm border bg-[#1a1917] text-left transition-colors ${
                    sel ? 'border-gold ring-2 ring-gold/60' : 'border-bone/10 hover:border-bone/30'
                  }`}
                >
                  <Image src={mediaSrc(m.source, m.path)} alt={m.alt?.en || ''} fill sizes="(max-width: 640px) 50vw, 240px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                  <span className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-night/90 to-transparent px-2 pb-1.5 pt-6 text-[0.68rem] text-bone/80">
                    <span className="truncate">{m.file_name || m.path.split('/').pop()}</span>
                    {!m.alt?.en && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold" title="Alt text missing" />}
                  </span>
                  {sel && <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-gold text-xs text-night">✓</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {mode === 'pick' && (
        <div className="sticky bottom-0 -mx-4 mt-4 flex items-center justify-between gap-3 border-t border-bone/10 bg-[#141312] px-4 py-3 sm:-mx-6 sm:px-6">
          <span className="text-sm text-bone/55">{picked.length ? `${picked.length} selected` : 'Select images'}</span>
          <Button disabled={!picked.length} onClick={() => onPick?.((data?.media ?? []).filter((m) => picked.includes(m.id)).sort((a, b) => picked.indexOf(a.id) - picked.indexOf(b.id)))}>
            Use {multiple ? 'images' : 'image'}
          </Button>
        </div>
      )}

      {/* Edit drawer (manage mode) */}
      {editing && mode === 'manage' && (
        <div role="dialog" aria-modal="true" aria-label="Edit image" className="fixed inset-0 z-[80] flex justify-end bg-night/70 backdrop-blur-sm" onClick={() => setEditing(null)}>
          <div className="flex h-full w-full max-w-xl flex-col overflow-y-auto border-l border-bone/10 bg-[#141312] p-5 sm:p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-2xl">Image</h2>
              <button type="button" onClick={() => setEditing(null)} className="flex h-11 w-11 items-center justify-center rounded-sm hover:bg-bone/5" aria-label="Close">
                ✕
              </button>
            </div>
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm bg-[#1a1917]">
              <Image src={mediaSrc(editing.source, editing.path)} alt="" fill sizes="560px" className="object-contain" />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-bone/45">
              <span>{editing.file_name || editing.path}</span>
              {editing.width && <span>· {editing.width}×{editing.height}</span>}
              <Badge tone={usedBy || inPages ? 'green' : 'grey'}>{usedBy ? `Used in ${usedBy} project${usedBy > 1 ? 's' : ''}` : inPages ? 'Used on pages, articles or settings' : 'Not used'}</Badge>
            </div>
            <div className="mt-6">
              <I18nInput label="Alt text (describes the image for SEO and screen readers)" value={alt} onChange={(v) => setAlt(v as Record<string, string>)} maxLength={300} />
            </div>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              {can('editor') && <Button onClick={saveAlt}>Save alt text</Button>}
              <Button variant="secondary" onClick={() => navigator.clipboard.writeText(mediaSrc(editing.source, editing.path)).then(() => toast('success', 'Link copied.'))}>
                Copy link
              </Button>
              {can('editor') && (
                <Button variant="danger" className="sm:ml-auto" disabled={usedBy > 0 || inPages} title={usedBy ? 'Remove it from its projects first' : inPages ? 'Remove it from the pages or settings that use it first' : undefined} onClick={() => setConfirmDelete(true)}>
                  Delete
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this image?"
        body="The file is removed from storage and the library permanently."
        confirmLabel="Delete image"
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
