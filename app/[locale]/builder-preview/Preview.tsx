'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import BlockRenderer from '@/components/blocks/Blocks';
import { BLOCK_MAP, MODULES, type Block } from '@/lib/blocks/schema';

/**
 * The builder's canvas. It only ever renders what the panel window (same origin) posts to
 * it, so it is harmless on its own. Messages:
 *   panel → canvas  { type: 'vari:render', blocks, selected, scroll? }
 *   canvas → panel  { type: 'vari:ready' } · { type: 'vari:select', id } · { type: 'vari:action', id, action }
 */
type Msg = { type: 'vari:render'; blocks: Block[]; selected: string | null; scroll?: boolean; system?: boolean };

export default function Preview() {
  const [blocks, setBlocks] = useState<Block[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const pendingScroll = useRef<string | null>(null);

  const post = useCallback((data: object) => {
    if (window.parent !== window) window.parent.postMessage(data, window.location.origin);
  }, []);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== window.parent) return;
      const m = e.data as Msg;
      if (m?.type !== 'vari:render') return;
      setBlocks(Array.isArray(m.blocks) ? m.blocks : []);
      setSelected(m.selected);
      if (m.scroll && m.selected) pendingScroll.current = m.selected;
    };
    window.addEventListener('message', onMsg);
    post({ type: 'vari:ready' });
    // Links inside the canvas would navigate the preview away: keep it in place.
    const stopLinks = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest('a');
      if (a) e.preventDefault();
    };
    document.addEventListener('click', stopLinks, true);
    return () => {
      window.removeEventListener('message', onMsg);
      document.removeEventListener('click', stopLinks, true);
    };
  }, [post]);

  useEffect(() => {
    const id = pendingScroll.current;
    if (!id) return;
    pendingScroll.current = null;
    requestAnimationFrame(() => document.querySelector(`[data-builder-id="${CSS.escape(id)}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }, [blocks, selected]);

  if (!blocks) {
    return <div className="grid min-h-[100svh] place-items-center text-bone/40"><span className="label">Loading preview…</span></div>;
  }

  const placeholder = (b: Block): ReactNode => {
    const m = MODULES[String(b.props?.module)];
    return (
      <div className="blueprint relative border-y border-gold/15 py-20 text-center md:py-28">
        <p className="label text-gold">Built-in section</p>
        <p className="display mt-4 text-[clamp(2rem,4vw,3.5rem)]">{m?.label ?? 'Section'}</p>
        <p className="mx-auto mt-4 max-w-md text-sm text-bone/55">{m?.about}</p>
        <p className="mt-6 text-xs text-bone/35">Shown with its full design and animation on the live site.</p>
      </div>
    );
  };

  const wrap = (b: Block, node: ReactNode) => {
    const isSel = selected === b.id;
    const isHover = hover === b.id;
    const name = b.type === 'module' ? MODULES[String(b.props?.module)]?.label ?? 'Section' : BLOCK_MAP[b.type]?.label ?? b.type;
    const locked = b.type === 'module' && b.props?.module === 'page';
    return (
      <div
        key={b.id}
        data-builder-id={b.id}
        className={`relative ${b.hidden ? 'opacity-35' : ''}`}
        onMouseEnter={() => setHover(b.id)}
        onMouseLeave={() => setHover((h) => (h === b.id ? null : h))}
        onClickCapture={(e) => {
          if ((e.target as HTMLElement).closest('[data-builder-toolbar]')) return;
          if (!isSel) {
            e.preventDefault();
            e.stopPropagation();
          }
          post({ type: 'vari:select', id: b.id });
        }}
      >
        {node}
        <div aria-hidden className={`pointer-events-none absolute inset-0 z-[60] transition-[box-shadow] duration-200 ${isSel ? 'shadow-[inset_0_0_0_2px_#D4AF37]' : isHover ? 'shadow-[inset_0_0_0_1px_rgba(212,175,55,0.6)]' : ''}`} />
        {(isSel || isHover) && (
          <div data-builder-toolbar className="absolute left-2 top-2 z-[61] flex items-center gap-px overflow-hidden rounded-sm bg-gold text-night shadow-lg">
            <span className="px-2.5 py-1.5 font-sans text-[0.68rem] font-semibold uppercase tracking-[0.14em]">
              {name}
              {b.hidden ? ' · hidden' : ''}
            </span>
            {isSel &&
              (
                [
                  ['up', '↑', 'Move up'],
                  ['down', '↓', 'Move down'],
                  ...(b.type === 'module' ? [] : [['duplicate', '⧉', 'Duplicate']]),
                  ...(locked ? [] : [['hide', b.hidden ? '◉' : '◌', b.hidden ? 'Show' : 'Hide']]),
                  ...(b.type === 'module' ? [] : [['delete', '✕', 'Delete']]),
                ] as [string, string, string][]
              ).map(([action, icon, label]) => (
                <button
                  key={action}
                  type="button"
                  title={label}
                  aria-label={label}
                  onClick={(e) => {
                    e.stopPropagation();
                    post({ type: 'vari:action', id: b.id, action });
                  }}
                  className="grid h-7 w-8 place-items-center bg-gold text-sm hover:bg-gold-light"
                >
                  {icon}
                </button>
              ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={blocks[0]?.type === 'hero' || blocks[0]?.type === 'module' ? '' : 'pt-[var(--header-h)]'}>
      {blocks.length === 0 ? (
        <div className="grid min-h-[70svh] place-items-center p-10 text-center">
          <div>
            <p className="display h-md">An empty canvas</p>
            <p className="mt-4 text-bone/50">Add your first block from the panel on the left.</p>
          </div>
        </div>
      ) : (
        <BlockRenderer blocks={blocks} renderModule={placeholder} wrap={wrap} />
      )}
    </div>
  );
}
