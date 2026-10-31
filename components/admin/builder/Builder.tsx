'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent, type ReactNode } from 'react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { Badge, Button, ConfirmDialog, Input, Switch, useToast } from '@/components/admin/ui';
import I18nInput, { type I18nValue } from '@/components/admin/I18nInput';
import Modal from '@/components/admin/Modal';
import { formatDate, must, usePublish } from '@/components/admin/hooks';
import { useMember } from '@/components/admin/AdminShell';
import { BLOCKS, BLOCK_MAP, MODULES, RESERVED_SLUGS, cloneBlock, createBlock, newBlockId, type Block, type BlockStyle } from '@/lib/blocks/schema';
import { SOURCE_LOCALE, type Locale } from '@/lib/i18n/config';
import { useLanguages } from '@/components/admin/languages';
import type { Json } from '@/lib/database.types';
import { FieldEditor, Row, Segmented, StyleEditor, type Ctx } from './FieldEditor';

export type PageSeo = { title?: I18nValue; description?: I18nValue; image?: string; noindex?: boolean };
export type PageRow = { id: string; slug: string; kind: 'custom' | 'system'; title: I18nValue; seo: PageSeo; blocks: Block[]; draft: Doc | null; published: boolean; published_at: string | null; updated_at: string };
type Doc = { title: I18nValue; seo: PageSeo; blocks: Block[]; slug: string };
type Device = 'desktop' | 'tablet' | 'mobile';
type MobilePane = 'add' | 'layers' | 'preview' | 'edit';

const DEVICE_W: Record<Device, number> = { desktop: 1366, tablet: 820, mobile: 390 };
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*(\/[a-z0-9]+(-[a-z0-9]+)*)*$/;
const STATIC_TARGETS = [
  { href: '/', label: 'Home' },
  { href: '/work', label: 'Work' },
  { href: '/services', label: 'Services' },
  { href: '/studio', label: 'Studio' },
  { href: '/contact', label: 'Contact' },
  { href: '/blog', label: 'Blog' },
  { href: '/privacy', label: 'Privacy' },
];

function Icon({ d, size = 18 }: { d: string; size?: number }) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d={d} />
    </svg>
  );
}

const blockName = (b: Block) => (b.type === 'module' ? MODULES[String(b.props?.module)]?.label ?? 'Section' : BLOCK_MAP[b.type]?.label ?? b.type);
const blockIcon = (b: Block) => (b.type === 'module' ? 'M4 4h16v16H4zM9 9h6v6H9z' : BLOCK_MAP[b.type]?.icon ?? 'M4 4h16v16H4z');
const blockSummary = (b: Block) => {
  const p = b.props || {};
  for (const k of ['title', 'quote', 'body', 'eyebrow', 'address']) {
    const v = p[k];
    const s = typeof v === 'string' ? v : (v as I18nValue)?.en;
    if (s) return s.replace(/[*#[\]()]/g, '').slice(0, 60);
  }
  if (Array.isArray(p.images)) return `${p.images.length} image${p.images.length === 1 ? '' : 's'}`;
  return b.type === 'module' ? MODULES[String(p.module)]?.about ?? '' : BLOCK_MAP[b.type]?.description ?? '';
};

export default function Builder({ initial, onReload }: { initial: PageRow; onReload: () => void }) {
  const { enabled: previewLangs } = useLanguages();
  const locales = previewLangs.map((l) => l.code);
  const localeMeta = Object.fromEntries(previewLangs.map((l) => [l.code, l]));
  const db = supabaseBrowser();
  const toast = useToast();
  const publishSite = usePublish();
  const { can } = useMember();
  const editable = can('editor');
  const isSystem = initial.kind === 'system';

  const start = useMemo<Doc>(
    () => initial.draft ? { ...initial.draft, slug: initial.slug } : { title: initial.title || {}, seo: initial.seo || {}, blocks: initial.blocks || [], slug: initial.slug },
    [initial],
  );
  const [doc, setDoc] = useState<Doc>(start);
  const history = useRef<{ past: Doc[]; future: Doc[]; key: string; at: number }>({ past: [], future: [], key: '', at: 0 });
  const [, force] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [leftTab, setLeftTab] = useState<'add' | 'layers'>('layers');
  const [rightTab, setRightTab] = useState<'content' | 'style'>('content');
  const [device, setDevice] = useState<Device>(() => (typeof window !== 'undefined' && window.innerWidth < 1024 ? 'mobile' : 'desktop'));
  const [lang, setLang] = useState<Locale>(SOURCE_LOCALE);
  const [pane, setPane] = useState<MobilePane>('preview');
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'dirty' | 'error'>('saved');
  const [hasDraft, setHasDraft] = useState(!!initial.draft);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(initial.published);
  const [query, setQuery] = useState('');
  const [showPage, setShowPage] = useState(false);
  const [showRevisions, setShowRevisions] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [ctx, setCtx] = useState<Ctx>({ targets: STATIC_TARGETS, projects: [] });

  // Link targets and projects for pickers.
  useEffect(() => {
    (async () => {
      const [pages, projects] = await Promise.all([db.from('pages').select('slug,title,kind').eq('kind', 'custom'), db.from('projects').select('slug,title').order('sort')]);
      const pt = (pages.data || []).map((p) => ({ href: `/${p.slug}`, label: (p.title as I18nValue)?.en || p.slug }));
      const pr = (projects.data || []).map((p) => ({ slug: p.slug, title: (p.title as I18nValue)?.en || p.slug }));
      setCtx({ targets: [...STATIC_TARGETS, ...pt, ...pr.map((p) => ({ href: `/work/${p.slug}`, label: `Project · ${p.title}` }))], projects: pr });
    })();
  }, [db]);

  /* ——— Editing with undo/redo ——— */

  const commit = useCallback((next: Doc | ((d: Doc) => Doc), key = '') => {
    setDoc((prev) => {
      const value = typeof next === 'function' ? next(prev) : next;
      if (value === prev) return prev;
      const h = history.current;
      const now = Date.now();
      // Typing into the same field within a moment is one undo step.
      if (!(key && key === h.key && now - h.at < 900)) h.past.push(prev);
      if (h.past.length > 120) h.past.shift();
      h.future = [];
      h.key = key;
      h.at = now;
      return value;
    });
    setSaveState('dirty');
    force((n) => n + 1);
  }, []);

  const undo = useCallback(() => {
    const h = history.current;
    const prev = h.past.pop();
    if (!prev) return;
    setDoc((cur) => {
      h.future.push(cur);
      return prev;
    });
    h.key = '';
    setSaveState('dirty');
    force((n) => n + 1);
  }, []);
  const redo = useCallback(() => {
    const h = history.current;
    const next = h.future.pop();
    if (!next) return;
    setDoc((cur) => {
      h.past.push(cur);
      return next;
    });
    h.key = '';
    setSaveState('dirty');
    force((n) => n + 1);
  }, []);

  const setBlocks = (fn: (b: Block[]) => Block[], key = '') => commit((d) => ({ ...d, blocks: fn(d.blocks) }), key);
  const updateBlock = (id: string, fn: (b: Block) => Block, key = '') => setBlocks((bs) => bs.map((b) => (b.id === id ? fn(b) : b)), key);

  const addBlock = (type: string, at?: number) => {
    // "module:hero" adds one of the site's signature sections.
    const block: Block = type.startsWith('module:') ? { id: newBlockId(), type: 'module', props: { module: type.slice(7) } } : createBlock(type);
    setBlocks((bs) => {
      const i = at ?? (selected ? bs.findIndex((b) => b.id === selected) + 1 : bs.length);
      const n = [...bs];
      n.splice(i < 0 ? bs.length : i, 0, block);
      return n;
    });
    select(block.id, true);
    setRightTab('content');
    setLeftTab('layers');
    setPane('edit');
  };

  const action = (id: string, what: string) => {
    const i = doc.blocks.findIndex((b) => b.id === id);
    if (i < 0) return;
    const b = doc.blocks[i];
    if (what === 'up' || what === 'down') {
      const j = what === 'up' ? i - 1 : i + 1;
      if (j < 0 || j >= doc.blocks.length) return;
      setBlocks((bs) => {
        const n = [...bs];
        [n[i], n[j]] = [n[j], n[i]];
        return n;
      });
      select(id, true);
    } else if (what === 'duplicate' && !(b.type === 'module' && b.props?.module === 'page')) {
      const copy = b.type === 'module' ? { ...b, id: newBlockId() } : cloneBlock(b);
      setBlocks((bs) => [...bs.slice(0, i + 1), copy, ...bs.slice(i + 1)]);
      select(copy.id, true);
    } else if (what === 'delete' && !(b.type === 'module' && b.props?.module === 'page')) {
      setBlocks((bs) => bs.filter((x) => x.id !== id));
      setSelected(null);
      toast('info', `${blockName(b)} removed — press Undo to bring it back.`);
    } else if (what === 'hide' && !(b.type === 'module' && b.props?.module === 'page')) {
      updateBlock(id, (x) => ({ ...x, hidden: !x.hidden }));
    }
  };

  const reorder = (from: number, to: number) => {
    if (from === to || from < 0) return;
    setBlocks((bs) => {
      const n = [...bs];
      const [m] = n.splice(from, 1);
      n.splice(to > from ? to - 1 : to, 0, m);
      return n;
    });
  };

  /* ——— Live preview (iframe) ——— */

  const frame = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const scrollNext = useRef(false);
  const select = (id: string | null, scroll = false) => {
    scrollNext.current = scroll;
    setSelected(id);
  };

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== frame.current?.contentWindow) return;
      const m = e.data as { type: string; id?: string; action?: string };
      if (m.type === 'vari:ready') setReady(true);
      if (m.type === 'vari:select' && m.id) {
        setSelected(m.id);
        setLeftTab('layers');
      }
      if (m.type === 'vari:action' && m.id && m.action) actionRef.current(m.id, m.action);
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);
  const actionRef = useRef(action);
  actionRef.current = action;

  useEffect(() => {
    if (!ready) return;
    const id = requestAnimationFrame(() => {
      frame.current?.contentWindow?.postMessage({ type: 'vari:render', blocks: doc.blocks, selected, scroll: scrollNext.current }, window.location.origin);
      scrollNext.current = false;
    });
    return () => cancelAnimationFrame(id);
  }, [doc.blocks, selected, ready]);

  // Scale the canvas so every device width fits the available space.
  const stage = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 1000, h: 700 });
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setBox({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, [pane]);
  const logical = DEVICE_W[device];
  const scale = Math.max(0.05, Math.min(1, (box.w - (device === 'desktop' ? 0 : 32)) / logical));

  /* ——— Saving ——— */

  const docRef = useRef(doc);
  docRef.current = doc;
  const saveDraft = useCallback(async () => {
    if (!editable) return true;
    setSaveState('saving');
    const { slug, ...draft } = docRef.current;
    void slug;
    const { data: saved, error } = await db.from('pages').update({ draft: draft as unknown as Json }).eq('id', initial.id).select('id');
    // RLS turns a forbidden update into "0 rows" rather than an error.
    if (error || !saved?.length) {
      setSaveState('error');
      toast('error', `Draft not saved: ${error?.message ?? 'your session may have expired — sign in again.'}`);
      return false;
    }
    setHasDraft(true);
    setSaveState((s) => (s === 'saving' ? 'saved' : s));
    return true;
  }, [db, editable, initial.id, toast]);

  useEffect(() => {
    if (saveState !== 'dirty') return;
    const t = setTimeout(saveDraft, 1600);
    return () => clearTimeout(t);
  }, [doc, saveState, saveDraft]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (saveState === 'dirty' || saveState === 'saving') e.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [saveState]);

  function problems(): string[] {
    const p: string[] = [];
    if (!doc.title.en?.trim()) p.push('Give the page an English title (Page settings).');
    if (!isSystem) {
      if (!SLUG_RE.test(doc.slug)) p.push('The address may only use lowercase letters, numbers and hyphens.');
      if (RESERVED_SLUGS.includes(doc.slug.split('/')[0])) p.push(`"/${doc.slug}" is reserved by the website. Choose another address.`);
    }
    return p;
  }

  async function publish() {
    const p = problems();
    if (p.length) {
      setShowPage(true);
      return toast('error', p[0]);
    }
    setPublishing(true);
    const { slug, ...live } = doc;
    const patch = {
      title: live.title as Json,
      seo: live.seo as Json,
      blocks: live.blocks as unknown as Json,
      draft: null,
      published: true,
      published_at: new Date().toISOString(),
      ...(isSystem ? {} : { slug }),
    };
    const res = await db.from('pages').update(patch).eq('id', initial.id).select('id');
    if (res.error || !res.data?.length) {
      setPublishing(false);
      if (!res.error) return toast('error', 'Not published: your session may have expired — sign in again.');
      return toast('error', res.error.message.includes('duplicate') ? 'Another page already uses this address.' : res.error.message);
    }
    await db.from('page_revisions').insert({ page_id: initial.id, title: live.title as Json, seo: live.seo as Json, blocks: live.blocks as unknown as Json });
    setPublishing(false);
    setHasDraft(false);
    setPublished(true);
    setSaveState('saved');
    publishSite(`“${doc.title.en || 'Page'}”`);
  }

  async function discard() {
    const { data: done, error } = await db.from('pages').update({ draft: null }).eq('id', initial.id).select('id');
    if (error || !done?.length) return toast('error', error?.message ?? 'Not saved — sign in again.');
    setConfirmDiscard(false);
    toast('info', 'Unpublished changes discarded.');
    onReload();
  }

  async function setLive(on: boolean) {
    const { data: done, error } = await db.from('pages').update({ published: on, ...(on ? { published_at: new Date().toISOString() } : {}) }).eq('id', initial.id).select('id');
    if (error || !done?.length) return toast('error', error?.message ?? 'Not saved — sign in again.');
    setPublished(on);
    publishSite(on ? 'Page' : 'Page hidden');
  }

  // Keyboard: undo / redo / save.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const typing = (e.target as HTMLElement)?.closest('input,textarea,[contenteditable]');
      if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        void saveDraft();
      } else if (!typing && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (!typing && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo, saveDraft]);

  /* ——— Panels ——— */

  const sel = doc.blocks.find((b) => b.id === selected) || null;
  const liveUrl = `/${lang}${isSystem ? (doc.slug === 'home' ? '' : doc.slug === 'project-template' ? '/work' : `/${doc.slug}`) : `/${doc.slug}`}`;

  const dragFrom = useRef<number>(-1);
  const dragType = useRef<string>('');
  const [dropAt, setDropAt] = useState<number | null>(null);
  const onDrop = (e: DragEvent, i: number) => {
    e.preventDefault();
    if (dragType.current) addBlock(dragType.current, i);
    else reorder(dragFrom.current, i);
    dragFrom.current = -1;
    dragType.current = '';
    setDropAt(null);
  };

  const library = (
    <div className="space-y-5 p-4">
      <Input type="search" placeholder="Search blocks…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search blocks" />
      {(() => {
        const mods = Object.entries(MODULES).filter(([id, m]) => id !== 'page' && (!query || `${m.label} ${m.about}`.toLowerCase().includes(query.toLowerCase())));
        if (!mods.length) return null;
        return (
          <div>
            <p className="mb-2 font-sans text-[0.62rem] uppercase tracking-[0.2em] text-gold/70">Signature sections</p>
            <div className="grid grid-cols-2 gap-2">
              {mods.map(([id, m]) => (
                <button
                  key={id}
                  type="button"
                  draggable={editable}
                  onDragStart={() => {
                    dragType.current = `module:${id}`;
                    setLeftTab('layers');
                  }}
                  onDragEnd={() => (dragType.current = '')}
                  disabled={!editable}
                  onClick={() => addBlock(`module:${id}`)}
                  title={m.about}
                  className="group flex min-h-[92px] flex-col items-start gap-2 rounded-sm border border-gold/25 bg-gold/[0.04] p-3 text-left transition hover:-translate-y-0.5 hover:border-gold/60 hover:bg-gold/[0.08] disabled:opacity-40"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-sm bg-gold/15 text-gold transition group-hover:bg-gold group-hover:text-night">
                    <Icon d="M4 4h16v16H4zM9 9h6v6H9z" />
                  </span>
                  <span className="text-[0.82rem] font-medium leading-tight">{m.label}</span>
                  <span className="line-clamp-2 text-[0.68rem] leading-snug text-bone/45">{m.about}</span>
                </button>
              ))}
            </div>
          </div>
        );
      })()}
      {(['Layout', 'Text', 'Media', 'Showcase', 'Engage'] as const).map((cat) => {
        const items = BLOCKS.filter((b) => b.category === cat && (!query || `${b.label} ${b.description}`.toLowerCase().includes(query.toLowerCase())));
        if (!items.length) return null;
        return (
          <div key={cat}>
            <p className="mb-2 font-sans text-[0.62rem] uppercase tracking-[0.2em] text-bone/40">{cat}</p>
            <div className="grid grid-cols-2 gap-2">
              {items.map((b) => (
                <button
                  key={b.type}
                  type="button"
                  draggable={editable}
                  onDragStart={() => {
                    dragType.current = b.type;
                    setLeftTab('layers');
                  }}
                  onDragEnd={() => (dragType.current = '')}
                  disabled={!editable}
                  onClick={() => addBlock(b.type)}
                  title={b.description}
                  className="group flex min-h-[92px] flex-col items-start gap-2 rounded-sm border border-bone/10 bg-bone/[0.02] p-3 text-left transition hover:-translate-y-0.5 hover:border-gold/50 hover:bg-gold/[0.06] disabled:opacity-40"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-sm bg-gold/10 text-gold transition group-hover:bg-gold group-hover:text-night">
                    <Icon d={b.icon} />
                  </span>
                  <span className="text-[0.82rem] font-medium leading-tight">{b.label}</span>
                  <span className="line-clamp-2 text-[0.68rem] leading-snug text-bone/45">{b.description}</span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

  const layers = (
    <div className="p-3">
      <ol
        className="space-y-1"
        onDragOver={(e) => {
          e.preventDefault();
        }}
      >
        {doc.blocks.map((b, i) => {
          const isSel = b.id === selected;
          return (
            <li key={b.id} onDragOver={(e) => { e.preventDefault(); setDropAt(i); }} onDrop={(e) => onDrop(e, i)}>
              {dropAt === i && <div className="mb-1 h-0.5 rounded bg-gold" />}
              <div
                draggable={editable}
                onDragStart={() => (dragFrom.current = i)}
                onDragEnd={() => setDropAt(null)}
                className={`group flex items-center gap-2 rounded-sm border px-2 py-2 transition ${isSel ? 'border-gold/60 bg-gold/10' : 'border-transparent hover:border-bone/15 hover:bg-bone/[0.04]'} ${b.hidden ? 'opacity-50' : ''}`}
              >
                <span aria-hidden className="cursor-grab px-1 text-bone/30 group-hover:text-bone/60">⋮⋮</span>
                <button type="button" onClick={() => { select(b.id, true); setPane('edit'); }} className="flex min-h-[40px] min-w-0 flex-1 items-center gap-3 text-left">
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-sm ${b.type === 'module' ? 'bg-bone/10 text-bone/70' : 'bg-gold/10 text-gold'}`}>
                    <Icon d={blockIcon(b)} size={16} />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 text-[0.82rem] font-medium">
                      {blockName(b)}
                      {b.type === 'module' && <span className="text-[0.6rem] uppercase tracking-[0.14em] text-bone/35">built-in</span>}
                      {b.hidden && <span className="text-[0.6rem] uppercase tracking-[0.14em] text-bone/35">hidden</span>}
                    </span>
                    <span className="line-clamp-1 text-[0.7rem] text-bone/40">{blockSummary(b)}</span>
                  </span>
                </button>
                {editable && (
                  <span className="flex lg:hidden lg:group-hover:flex lg:group-focus-within:flex">
                    <button type="button" title="Move up" aria-label="Move up" onClick={() => action(b.id, 'up')} className="h-8 w-7 text-bone/50 hover:text-gold">↑</button>
                    <button type="button" title="Move down" aria-label="Move down" onClick={() => action(b.id, 'down')} className="h-8 w-7 text-bone/50 hover:text-gold">↓</button>
                    {!(b.type === 'module' && b.props?.module === 'page') && (
                      <button type="button" title={b.hidden ? 'Show' : 'Hide'} aria-label={b.hidden ? 'Show' : 'Hide'} onClick={() => action(b.id, 'hide')} className="h-8 w-7 text-bone/50 hover:text-gold">{b.hidden ? '◉' : '◌'}</button>
                    )}
                  </span>
                )}
              </div>
            </li>
          );
        })}
        <li onDragOver={(e) => { e.preventDefault(); setDropAt(doc.blocks.length); }} onDrop={(e) => onDrop(e, doc.blocks.length)} className="pt-1">
          {dropAt === doc.blocks.length && <div className="mb-1 h-0.5 rounded bg-gold" />}
          {editable && (
            <button type="button" onClick={() => { setSelected(null); setLeftTab('add'); setPane('add'); }} className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-sm border border-dashed border-gold/40 text-[0.8rem] text-gold hover:bg-gold/5">
              + Add a block
            </button>
          )}
        </li>
      </ol>
      {!doc.blocks.length && <p className="mt-4 text-center text-sm text-bone/45">No blocks yet.</p>}
    </div>
  );

  const editor = sel ? (
    <div>
      <div className="sticky top-0 z-10 border-b border-bone/10 bg-[#121110] px-4 pb-3 pt-4">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-sm bg-gold/10 text-gold"><Icon d={blockIcon(sel)} /></span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{blockName(sel)}</p>
            <p className="line-clamp-1 text-[0.7rem] text-bone/40">{sel.type === 'module' ? 'Signature section' : BLOCK_MAP[sel.type]?.description}</p>
          </div>
          <button type="button" onClick={() => setSelected(null)} aria-label="Close block settings" className="grid h-9 w-9 place-items-center rounded-sm text-bone/50 hover:bg-bone/5">✕</button>
        </div>
        {sel.type !== 'module' && (
          <div className="mt-3">
            <Segmented value={rightTab} onChange={(v) => setRightTab(v as 'content' | 'style')} options={[{ value: 'content', label: 'Content' }, { value: 'style', label: 'Design' }]} />
          </div>
        )}
      </div>
      <fieldset disabled={!editable} className="space-y-6 p-4">
        {sel.type === 'module' ? (
          <>
            <p className="text-sm leading-relaxed text-bone/65">{MODULES[String(sel.props?.module)]?.about}</p>
            <p className="text-sm leading-relaxed text-bone/50">This section keeps its custom design and animation. Move it with the arrows, hide it, or add new blocks around it.</p>
            {MODULES[String(sel.props?.module)]?.texts && (
              <Link href={`/admin/texts/${MODULES[String(sel.props?.module)]!.texts}`} target="_blank" className="inline-flex items-center gap-2 text-sm text-gold hover:underline">
                Edit this section’s texts & translations ↗
              </Link>
            )}
            {!(sel.props?.module === 'page') && <Switch checked={!sel.hidden} onChange={(v) => updateBlock(sel.id, (b) => ({ ...b, hidden: !v }))} label="Show on the website" />}
            <div>
              <p className="mb-2 font-sans text-[0.68rem] uppercase tracking-[0.16em] text-bone/55">Show on</p>
              <Segmented
                value={sel.style?.hideOn ?? ''}
                onChange={(v) => updateBlock(sel.id, (b) => ({ ...b, style: { ...b.style, hideOn: v as BlockStyle['hideOn'] } }))}
                options={[{ value: '', label: 'All' }, { value: 'mobile', label: 'Desktop' }, { value: 'desktop', label: 'Mobile' }]}
              />
            </div>
          </>
        ) : rightTab === 'content' ? (
          (BLOCK_MAP[sel.type]?.fields || []).map((f) => (
            <FieldEditor key={`${sel.id}-${f.key}`} field={f} value={sel.props[f.key]} ctx={ctx} onChange={(v) => updateBlock(sel.id, (b) => ({ ...b, props: { ...b.props, [f.key]: v } }), `${sel.id}.${f.key}`)} />
          ))
        ) : (
          <StyleEditor style={sel.style || {}} defaults={BLOCK_MAP[sel.type]?.style || {}} isHero={sel.type === 'hero'} onChange={(style) => updateBlock(sel.id, (b) => ({ ...b, style }), `${sel.id}.style`)} />
        )}
        {sel.type === 'newsletter' && <p className="text-sm text-bone/50">The signup texts are edited under Texts & translations → Newsletter.</p>}
        {!(sel.type === 'module' && sel.props?.module === 'page') && editable && (
          <div className="flex gap-2 border-t border-bone/10 pt-5">
            <Button size="sm" variant="secondary" onClick={() => action(sel.id, 'duplicate')}>Duplicate</Button>
            <Button size="sm" variant="secondary" onClick={() => action(sel.id, 'hide')}>{sel.hidden ? 'Show' : 'Hide'}</Button>
            <Button size="sm" variant="ghost" onClick={() => action(sel.id, 'delete')} className="ml-auto text-[#E8A598]">Delete</Button>
          </div>
        )}
      </fieldset>
    </div>
  ) : (
    <div className="p-6 text-center">
      <p className="display text-2xl">Select a block</p>
      <p className="mt-3 text-sm leading-relaxed text-bone/50">Click anything in the preview or the layers list to edit it. Drag layers to reorder.</p>
      <div className="mt-6 grid gap-2 text-left text-[0.78rem] text-bone/45">
        <p><kbd className="rounded border border-bone/20 px-1.5">⌘/Ctrl Z</kbd> undo · <kbd className="rounded border border-bone/20 px-1.5">⇧ ⌘/Ctrl Z</kbd> redo</p>
        <p><kbd className="rounded border border-bone/20 px-1.5">⌘/Ctrl S</kbd> save draft</p>
      </div>
      <Button className="mt-8" variant="secondary" onClick={() => setShowPage(true)}>Page settings & SEO</Button>
    </div>
  );

  const preview = (
    <div ref={stage} className="relative h-full w-full overflow-hidden bg-[radial-gradient(circle_at_50%_0%,#1d1b18,#0a0908_70%)]">
      <div className="absolute left-1/2 top-0 origin-top" style={{ width: logical, height: (box.h - (device === 'desktop' ? 0 : 24)) / scale, transform: `translateX(-50%) scale(${scale})`, marginTop: device === 'desktop' ? 0 : 12 }}>
        <iframe
          ref={frame}
          key={lang}
          src={`/${lang}/builder-preview`}
          title="Page preview"
          className={`h-full w-full bg-night ${device === 'desktop' ? '' : 'rounded-[18px] border border-bone/15 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]'}`}
        />
      </div>
      {!ready && <div className="pointer-events-none absolute inset-0 grid place-items-center"><span className="label text-bone/40">Loading preview…</span></div>}
    </div>
  );

  const status =
    saveState === 'saving' ? 'Saving…' : saveState === 'dirty' ? 'Unsaved changes' : saveState === 'error' ? 'Not saved' : hasDraft ? 'Draft saved · not live yet' : published ? 'Live' : 'Not published';

  const hist = { undo: history.current.past.length > 0, redo: history.current.future.length > 0 };

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-[#0b0a09] text-bone">
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-bone/10 bg-[#121110] px-2 sm:px-3">
        <Link href="/admin/pages" className="grid h-10 w-10 place-items-center rounded-sm text-bone/60 hover:bg-bone/5 hover:text-bone" aria-label="Back to pages">←</Link>
        <button type="button" onClick={() => setShowPage(true)} className="min-w-0 rounded-sm px-2 py-1 text-left hover:bg-bone/5">
          <p className="line-clamp-1 text-sm font-medium">{doc.title.en || 'Untitled page'}</p>
          <p className="line-clamp-1 text-[0.68rem] text-bone/40">
            <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle ${saveState === 'error' ? 'bg-[#E8A598]' : hasDraft || saveState !== 'saved' ? 'bg-gold' : published ? 'bg-emerald-400' : 'bg-bone/30'}`} />
            {status}
          </p>
        </button>

        <div className="mx-auto hidden items-center gap-1 rounded-sm border border-bone/10 p-1 md:flex">
          {(['desktop', 'tablet', 'mobile'] as Device[]).map((d) => (
            <button key={d} type="button" onClick={() => setDevice(d)} aria-pressed={device === d} title={d} className={`grid h-8 w-9 place-items-center rounded-[2px] ${device === d ? 'bg-gold text-night' : 'text-bone/55 hover:text-bone'}`}>
              <Icon size={16} d={d === 'desktop' ? 'M3 4h18v12H3zM8 20h8M12 16v4' : d === 'tablet' ? 'M6 3h12v18H6zM11 18h2' : 'M8 3h8v18H8zM11 18h2'} />
            </button>
          ))}
          <span className="mx-1 h-5 w-px bg-bone/10" />
          {locales.map((l) => (
            <button key={l} type="button" onClick={() => { setReady(false); setLang(l); }} aria-pressed={lang === l} className={`h-8 rounded-[2px] px-2 text-[0.7rem] font-medium uppercase tracking-[0.12em] ${lang === l ? 'bg-bone/15 text-bone' : 'text-bone/45 hover:text-bone'}`} title={`Preview in ${localeMeta[l].name}`}>
              {l}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1">
          <button type="button" onClick={undo} disabled={!hist.undo} title="Undo" aria-label="Undo" className="grid h-10 w-9 place-items-center rounded-sm text-bone/60 hover:bg-bone/5 disabled:opacity-30">↶</button>
          <button type="button" onClick={redo} disabled={!hist.redo} title="Redo" aria-label="Redo" className="grid h-10 w-9 place-items-center rounded-sm text-bone/60 hover:bg-bone/5 disabled:opacity-30">↷</button>
          <button type="button" onClick={() => setShowRevisions(true)} title="History" aria-label="History" className="hidden h-10 w-9 place-items-center rounded-sm text-bone/60 hover:bg-bone/5 sm:grid"><Icon size={17} d="M12 7v5l3 3M3 12a9 9 0 103-6.7L3 8M3 3v5h5" /></button>
          {published && <a href={liveUrl} target="_blank" rel="noreferrer" className="hidden h-10 items-center rounded-sm px-3 text-[0.78rem] text-bone/60 hover:bg-bone/5 hover:text-bone lg:flex">View live ↗</a>}
          {editable && (
            <Button size="sm" onClick={publish} busy={publishing}>
              {published && !hasDraft && saveState === 'saved' ? 'Published' : 'Publish'}
            </Button>
          )}
        </div>
      </header>

      {/* Three panes on desktop; one at a time on phones and tablets (bottom tabs). */}
      <div className="flex min-h-0 flex-1">
        <aside className={`${pane === 'add' || pane === 'layers' ? 'flex' : 'hidden'} w-full shrink-0 flex-col border-r border-bone/10 bg-[#121110] lg:flex lg:w-[300px]`}>
          <div className="hidden shrink-0 gap-1 border-b border-bone/10 p-2 lg:flex">
            {(['layers', 'add'] as const).map((t) => (
              <button key={t} type="button" onClick={() => setLeftTab(t)} aria-pressed={leftTab === t} className={`h-9 flex-1 rounded-sm text-[0.75rem] font-medium uppercase tracking-[0.14em] ${leftTab === t ? 'bg-bone/10 text-bone' : 'text-bone/45 hover:text-bone'}`}>
                {t === 'add' ? '+ Add blocks' : `Layers · ${doc.blocks.length}`}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="lg:hidden">{pane === 'add' ? library : layers}</div>
            <div className="hidden lg:block">{leftTab === 'add' ? library : layers}</div>
          </div>
        </aside>
        <main className={`${pane === 'preview' ? 'block' : 'hidden'} min-w-0 flex-1 lg:block`}>{preview}</main>
        <aside className={`${pane === 'edit' ? 'block' : 'hidden'} w-full shrink-0 overflow-y-auto border-l border-bone/10 bg-[#121110] lg:block lg:w-[360px]`}>{editor}</aside>
      </div>
      <nav className="grid shrink-0 grid-cols-4 border-t border-bone/10 bg-[#121110] pb-[env(safe-area-inset-bottom)] lg:hidden">
        {(
          [
            ['preview', 'Preview', 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6z'],
            ['layers', 'Layers', 'M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5'],
            ['add', 'Add', 'M12 5v14M5 12h14'],
            ['edit', 'Edit', 'M4 20h4L20 8l-4-4L4 16v4z'],
          ] as [MobilePane, string, string][]
        ).map(([id, label, d]) => (
          <button key={id} type="button" onClick={() => setPane(id)} aria-pressed={pane === id} className={`flex min-h-[56px] flex-col items-center justify-center gap-1 text-[0.66rem] uppercase tracking-[0.12em] ${pane === id ? 'text-gold' : 'text-bone/50'}`}>
            <Icon d={d} size={18} />
            {label}
          </button>
        ))}
      </nav>
      {pane === 'preview' && (
        <div className="pointer-events-none fixed inset-x-0 bottom-[64px] flex justify-center lg:hidden">
          <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-bone/15 bg-[#121110]/95 p-1 backdrop-blur">
            {(['mobile', 'tablet', 'desktop'] as Device[]).map((d) => (
              <button key={d} type="button" onClick={() => setDevice(d)} className={`h-8 rounded-full px-3 text-[0.68rem] uppercase tracking-[0.12em] ${device === d ? 'bg-gold text-night' : 'text-bone/55'}`}>{d}</button>
            ))}
            {locales.map((l) => (
              <button key={l} type="button" onClick={() => { setReady(false); setLang(l); }} className={`h-8 rounded-full px-2.5 text-[0.68rem] uppercase ${lang === l ? 'bg-bone/15 text-bone' : 'text-bone/45'}`}>{l}</button>
            ))}
          </div>
        </div>
      )}

      <PageSettings
        open={showPage}
        onClose={() => setShowPage(false)}
        doc={doc}
        isSystem={isSystem}
        editable={editable}
        published={published}
        hasDraft={hasDraft}
        onChange={(patch, key) => commit((d) => ({ ...d, ...patch }), key)}
        onSetLive={setLive}
        onDiscard={() => setConfirmDiscard(true)}
      />
      <Revisions open={showRevisions} pageId={initial.id} onClose={() => setShowRevisions(false)} onRestore={(r) => { commit((d) => ({ ...d, title: r.title, seo: r.seo, blocks: r.blocks })); setShowRevisions(false); toast('info', 'Version restored in the editor. Publish to make it live.'); }} />
      <ConfirmDialog open={confirmDiscard} title="Discard unpublished changes?" body="The page goes back to what is live on the website now." confirmLabel="Discard changes" onConfirm={discard} onCancel={() => setConfirmDiscard(false)} />
    </div>
  );
}

/* ——— Page settings & SEO ——— */

function Counter({ n, min, max }: { n: number; min: number; max: number }) {
  return <span className={`text-[0.7rem] ${n === 0 ? 'text-bone/35' : n < min || n > max ? 'text-gold' : 'text-emerald-400'}`}>{n} / {max}</span>;
}

function PageSettings({
  open,
  onClose,
  doc,
  isSystem,
  editable,
  published,
  hasDraft,
  onChange,
  onSetLive,
  onDiscard,
}: {
  open: boolean;
  onClose: () => void;
  doc: Doc;
  isSystem: boolean;
  editable: boolean;
  published: boolean;
  hasDraft: boolean;
  onChange: (patch: Partial<Doc>, key: string) => void;
  onSetLive: (on: boolean) => void;
  onDiscard: () => void;
}) {
  const { codes: locales } = useLanguages();
  const [lang, setLang] = useState<Locale>(SOURCE_LOCALE);
  const title = doc.seo.title?.[lang] || doc.title[lang] || doc.title.en || '';
  const desc = doc.seo.description?.[lang] || '';
  const path = isSystem ? (doc.slug === 'home' ? '' : `/${doc.slug}`) : `/${doc.slug}`;
  return (
    <Modal open={open} title="Page settings & SEO" onClose={onClose} wide>
      <fieldset disabled={!editable} className="grid gap-8 pb-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <I18nInput label="Page name" value={doc.title} onChange={(title) => onChange({ title }, 'title')} maxLength={80} required hint="Used in the panel, menus and as the default search title." />
          <Row label="Web address" hint={isSystem ? 'Built-in pages keep their address.' : 'Lowercase letters, numbers and hyphens. Use a slash for sub-pages, e.g. "services/rendering".'}>
            <div className="flex items-center overflow-hidden rounded-sm border border-bone/15 bg-bone/[0.03] focus-within:border-gold">
              <span className="shrink-0 pl-3 text-sm text-bone/40">vari-studio.com/{'{lang}'}/</span>
              <input
                value={doc.slug}
                disabled={isSystem}
                onChange={(e) => onChange({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9/-]/g, '-').replace(/-{2,}/g, '-').replace(/\/{2,}/g, '/') }, 'slug')}
                className="min-h-[44px] flex-1 bg-transparent px-1 text-sm outline-none disabled:text-bone/50"
                aria-label="Page address"
              />
            </div>
          </Row>
          <div className="space-y-4 rounded-sm border border-bone/10 p-4">
            <p className="font-sans text-[0.72rem] font-medium uppercase tracking-[0.16em] text-gold">Search engines</p>
            <I18nInput label="SEO title" value={doc.seo.title || {}} onChange={(v) => onChange({ seo: { ...doc.seo, title: v } }, 'seo.title')} maxLength={70} hint="Best between 30 and 60 characters. Leave empty to use the page name." />
            <I18nInput label="Meta description" value={doc.seo.description || {}} onChange={(v) => onChange({ seo: { ...doc.seo, description: v } }, 'seo.description')} multiline rows={3} maxLength={170} hint="Best between 120 and 160 characters — the sentence people read in Google." />
            <Switch checked={!!doc.seo.noindex} onChange={(noindex) => onChange({ seo: { ...doc.seo, noindex } }, 'seo.noindex')} label="Hide from search engines" description="For thank-you pages, campaigns or drafts you share by link." />
          </div>
        </div>
        <div className="space-y-6">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="font-sans text-[0.72rem] font-medium uppercase tracking-[0.16em] text-bone/55">Google preview</p>
              <div className="flex gap-1">
                {locales.map((l) => (
                  <button key={l} type="button" onClick={() => setLang(l)} className={`h-7 rounded-sm px-2 text-[0.68rem] uppercase ${lang === l ? 'bg-gold text-night' : 'text-bone/50 hover:text-bone'}`}>{l}</button>
                ))}
              </div>
            </div>
            <div className="rounded-sm bg-white p-4 font-[arial,sans-serif] text-left">
              <p className="text-[12px] text-[#4d5156]">vari-studio.com › {lang}{path.replace(/\//g, ' › ')}</p>
              <p className="mt-1 line-clamp-1 text-[18px] leading-snug text-[#1a0dab]">{title ? `${title} | VARI Studio` : 'Page title | VARI Studio'}</p>
              <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-[#4d5156]">{desc || 'Add a meta description so you control this text.'}</p>
            </div>
            <div className="mt-2 flex justify-between">
              <span className="text-[0.7rem] text-bone/40">Title</span>
              <Counter n={(doc.seo.title?.[lang] || doc.title[lang] || '').length} min={30} max={60} />
            </div>
            <div className="flex justify-between">
              <span className="text-[0.7rem] text-bone/40">Description</span>
              <Counter n={desc.length} min={120} max={160} />
            </div>
          </div>
          <Row label="Social sharing image" hint="Shown when the page is shared on WhatsApp, LinkedIn, Facebook… 1200 × 630 px is ideal.">
            <FieldEditor field={{ key: 'image', kind: 'image', label: '' }} value={doc.seo.image || ''} ctx={{ targets: [], projects: [] }} onChange={(image) => onChange({ seo: { ...doc.seo, image: image as string } }, 'seo.image')} />
          </Row>
          <div className="space-y-3 rounded-sm border border-bone/10 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Status</span>
              <Badge tone={published ? 'green' : 'grey'}>{published ? 'Live' : 'Not published'}</Badge>
            </div>
            {hasDraft && <p className="text-xs text-gold">There are saved changes that are not live yet.</p>}
            <div className="flex flex-wrap gap-2">
              {!isSystem && published && <Button size="sm" variant="secondary" onClick={() => onSetLive(false)}>Unpublish</Button>}
              {!isSystem && !published && !hasDraft && <Button size="sm" variant="secondary" onClick={() => onSetLive(true)}>Publish as is</Button>}
              {hasDraft && <Button size="sm" variant="ghost" onClick={onDiscard}>Discard unpublished changes</Button>}
            </div>
          </div>
        </div>
      </fieldset>
    </Modal>
  );
}

/* ——— Version history ——— */

type Revision = { id: number; created_at: string; title: I18nValue; seo: PageSeo; blocks: Block[]; created_by: string | null };

function Revisions({ open, pageId, onClose, onRestore }: { open: boolean; pageId: string; onClose: () => void; onRestore: (r: Revision) => void }) {
  const db = supabaseBrowser();
  const [rows, setRows] = useState<(Revision & { by?: string })[] | null>(null);
  useEffect(() => {
    if (!open) return;
    setRows(null);
    (async () => {
      const revs = must(await db.from('page_revisions').select('id,created_at,title,seo,blocks,created_by').eq('page_id', pageId).order('created_at', { ascending: false }).limit(30)) as unknown as Revision[];
      const ids = [...new Set(revs.map((r) => r.created_by).filter(Boolean))] as string[];
      const people = ids.length ? must(await db.from('profiles').select('id,full_name,email').in('id', ids)) : [];
      const name = new Map(people.map((p) => [p.id, p.full_name || p.email]));
      setRows(revs.map((r) => ({ ...r, by: r.created_by ? name.get(r.created_by) ?? 'Former member' : undefined })));
    })().catch(() => setRows([]));
  }, [open, pageId, db]);
  return (
    <Modal open={open} title="Version history" onClose={onClose}>
      <div className="pb-6">
        {!rows ? (
          <p className="text-sm text-bone/50">Loading…</p>
        ) : !rows.length ? (
          <p className="text-sm text-bone/50">Every time you publish, a version is kept here (the last 30).</p>
        ) : (
          <ol className="space-y-2">
            {rows.map((r, i) => (
              <li key={r.id} className="flex items-center justify-between gap-3 rounded-sm border border-bone/10 p-3">
                <div>
                  <p className="text-sm">{formatDate(r.created_at, true)} {i === 0 && <Badge tone="green">Latest</Badge>}</p>
                  <p className="text-xs text-bone/45">{r.blocks.length} blocks{r.by ? ` · ${r.by}` : ''}</p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => onRestore(r)}>Restore</Button>
              </li>
            ))}
          </ol>
        )}
      </div>
    </Modal>
  );
}

export function StatusBadge({ page }: { page: { published: boolean; draft: unknown } }): ReactNode {
  if (page.draft) return <Badge tone="gold">Changes not live</Badge>;
  return page.published ? <Badge tone="green">Live</Badge> : <Badge tone="grey">Not published</Badge>;
}
