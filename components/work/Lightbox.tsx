'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { createPortal } from 'react-dom';
import type { Media } from '@/lib/content';
import { useLenis } from '../SmoothScroll';
import { useI18n } from '../I18nProvider';

/**
 * Full-screen viewer for a project's renders (the original Wix galleries opened items
 * the same way). Click / tap to zoom into a point and move to inspect it; arrows,
 * swipe or keys to step through; Esc or ✕ to close.
 */
export default function Lightbox({
  images,
  index,
  title,
  onClose,
  onIndex,
}: {
  images: Media[];
  index: number;
  title: string;
  onClose: () => void;
  onIndex: (i: number) => void;
}) {
  const { t } = useI18n();
  const lenis = useLenis();
  const [shown, setShown] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState('50% 50%');
  const closeBtn = useRef<HTMLButtonElement>(null);
  const start = useRef<{ x: number; y: number; t: number } | null>(null);
  const moved = useRef(false);
  const count = images.length;
  const img = images[index];

  const go = (d: number) => {
    setZoom(false);
    onIndex((index + d + count) % count);
  };

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    lenis?.stop();
    document.documentElement.style.overflow = 'hidden';
    requestAnimationFrame(() => setShown(true));
    closeBtn.current?.focus();
    return () => {
      lenis?.start();
      document.documentElement.style.overflow = '';
      previous?.focus?.();
    };
  }, [lenis]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (count > 1 && e.key === 'ArrowRight') go(1);
      if (count > 1 && e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const pointAt = (e: ReactPointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100));
    const y = Math.min(100, Math.max(0, ((e.clientY - r.top) / r.height) * 100));
    setOrigin(`${x}% ${y}%`);
  };

  const onDown = (e: ReactPointerEvent<HTMLElement>) => {
    start.current = { x: e.clientX, y: e.clientY, t: Date.now() };
    moved.current = false;
  };
  const onMove = (e: ReactPointerEvent<HTMLElement>) => {
    if (zoom) pointAt(e);
    if (start.current && Math.abs(e.clientX - start.current.x) > 8) moved.current = true;
  };
  const onUp = (e: ReactPointerEvent<HTMLElement>) => {
    const s = start.current;
    start.current = null;
    if (!s) return;
    const dx = e.clientX - s.x;
    // Swipe between images (only when not inspecting a zoomed point)
    if (!zoom && count > 1 && Math.abs(dx) > 60 && Date.now() - s.t < 600) return go(dx < 0 ? 1 : -1);
    if (moved.current && zoom) return;
    if (!zoom) pointAt(e);
    setZoom((z) => !z);
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${t.viewer.label} — ${title}`}
      className={`fixed inset-0 z-[80] flex flex-col bg-night/95 backdrop-blur-sm transition-opacity duration-500 ${shown ? 'opacity-100' : 'opacity-0'}`}
    >
      <div className="wrap flex h-[var(--header-h)] shrink-0 items-center justify-between gap-6">
        <p className="label min-w-0 truncate text-bone/70">
          <span className="text-gold">{title}</span>
          {count > 1 && (
            <span className="ml-3 tabular-nums">
              {String(index + 1).padStart(2, '0')} {t.viewer.of} {String(count).padStart(2, '0')}
            </span>
          )}
        </p>
        <button ref={closeBtn} type="button" onClick={onClose} className="label flex shrink-0 items-center gap-3 text-bone hover:text-gold">
          {t.viewer.close}
          <span aria-hidden className="relative block h-4 w-4">
            <span className="absolute left-0 top-1/2 h-px w-full rotate-45 bg-current" />
            <span className="absolute left-0 top-1/2 h-px w-full -rotate-45 bg-current" />
          </span>
        </button>
      </div>

      <div className="relative min-h-0 flex-1 px-[var(--gutter)] pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div
          className={`relative h-full w-full touch-none select-none overflow-hidden ${zoom ? 'cursor-zoom-out' : 'cursor-zoom-in'} transition-[transform,opacity] duration-700 ease-expo ${shown ? 'scale-100' : 'scale-95'}`}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          title={zoom ? t.viewer.zoomOut : t.viewer.zoomIn}
        >
          <Image
            key={img.id}
            src={img.id}
            alt={img.alt}
            fill
            sizes="100vw"
            quality={92}
            priority
            draggable={false}
            className="object-contain transition-transform duration-500 ease-expo"
            style={{ transform: zoom ? 'scale(2.4)' : 'scale(1)', transformOrigin: origin }}
          />
        </div>

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label={t.viewer.prev}
              className="absolute left-[var(--gutter)] top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center border border-gold/40 bg-night/60 text-gold backdrop-blur hover:bg-gold hover:text-night"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label={t.viewer.next}
              className="absolute right-[var(--gutter)] top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center border border-gold/40 bg-night/60 text-gold backdrop-blur hover:bg-gold hover:text-night"
            >
              →
            </button>
          </>
        )}
      </div>
      <p className="label pb-4 text-center text-bone/35">{zoom ? t.viewer.zoomOut : t.viewer.zoomIn}</p>
    </div>,
    document.body,
  );
}
