'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { gsap } from '@/lib/gsap';
import Logo from './Logo';
import { contact } from '@/lib/content';
import { useI18n } from './I18nProvider';

/**
 * The footer's brand moment: every architectural drawing ends with a title block
 * that carries the studio's mark. The VARI wordmark sits on a drafting plate —
 * crop marks, a dimension line drawn to its exact width, a gold lamp that follows
 * the pointer across the blueprint — and is "inked" in when it scrolls into view.
 */
export default function FooterSignature() {
  const root = useRef<HTMLDivElement>(null);
  const { t, href } = useI18n();

  useEffect(() => {
    const el = root.current!;
    const mm = gsap.matchMedia(el);
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 75%', once: true } });
      tl.fromTo('[data-sig-mark]', { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.8, stagger: 0.06, ease: 'expo.out' })
        .fromTo('[data-sig-scan]', { left: '0%', opacity: 1 }, { left: '100%', duration: 1.6, ease: 'power2.inOut' }, 0.2)
        .fromTo('[data-sig-logo]', { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'power2.inOut' }, 0.2)
        .to('[data-sig-scan]', { opacity: 0, duration: 0.4 }, 1.8)
        .fromTo('[data-sig-dim]', { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: 'expo.out' }, 1.2)
        .fromTo('[data-sig-meta]', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 1, stagger: 0.08 }, 1.4);
    });

    // Lamp: a soft gold light that follows the pointer over the plate.
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--lx', `${((e.clientX - r.left) / r.width) * 100}%`);
      el.style.setProperty('--ly', `${((e.clientY - r.top) / r.height) * 100}%`);
    };
    el.addEventListener('pointermove', onMove);
    return () => {
      mm.revert();
      el.removeEventListener('pointermove', onMove);
    };
  }, []);

  const corner = 'absolute h-5 w-5 border-gold/70';

  return (
    <div
      ref={root}
      className="group/sig blueprint relative isolate overflow-hidden border border-gold/20"
      style={{ ['--lx' as string]: '50%', ['--ly' as string]: '45%' }}
    >
      {/* Lamp */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-60 transition-opacity duration-700 group-hover/sig:opacity-100"
        style={{ background: 'radial-gradient(circle 32rem at var(--lx) var(--ly), rgba(212,175,55,0.16), transparent 70%)' }}
      />

      <div className="relative flex flex-col items-center px-6 py-7 text-center md:py-9">
        {/* Crop marks around the mark */}
        <div className="relative px-4 py-3 sm:px-8 sm:py-4">
          <span data-sig-mark aria-hidden className={`${corner} left-0 top-0 border-l border-t`} />
          <span data-sig-mark aria-hidden className={`${corner} right-0 top-0 border-r border-t`} />
          <span data-sig-mark aria-hidden className={`${corner} bottom-0 left-0 border-b border-l`} />
          <span data-sig-mark aria-hidden className={`${corner} bottom-0 right-0 border-b border-r`} />

          <Link href={href('/')} aria-label={t.footer.homeAria} className="relative block">
            <span data-sig-logo className="block w-[min(52vw,260px)] [filter:drop-shadow(0_0_40px_rgba(212,175,55,0.18))]">
              <Logo className="h-auto w-full" sizes="(max-width: 768px) 52vw, 260px" />
            </span>
            <span data-sig-scan aria-hidden className="pointer-events-none absolute -bottom-3 -top-3 w-px bg-gold opacity-0 shadow-[0_0_18px_4px_rgba(212,175,55,0.6)]" />
          </Link>
        </div>

        {/* Dimension line drawn to the width of the mark */}
        <div aria-hidden className="mt-3 flex w-[min(52vw,260px)] items-center gap-3 text-gold/70">
          <span className="h-3 w-px bg-current" />
          <span data-sig-dim className="h-px flex-1 origin-center bg-current" />
          <span className="label text-[0.6rem] tracking-[0.3em]">VARI · 1:1</span>
          <span data-sig-dim className="h-px flex-1 origin-center bg-current" />
          <span className="h-3 w-px bg-current" />
        </div>

        <p data-sig-meta className="display-italic mt-4 max-w-[34ch] text-lg text-bone/85 sm:text-xl">
          {t.footer.tagline}
        </p>
      </div>

      {/* Title block strip */}
      <dl className="grid grid-cols-2 border-t border-gold/20 text-left md:grid-cols-4">
        {[
          [t.footer.tbStudio, t.footer.tbStudioValue],
          [t.footer.tbDisciplines, t.footer.tbDisciplinesValue],
          [t.footer.tbLocation, contact.address.replace(/\.$/, '')],
          [t.footer.tbSheet, t.footer.tbSheetValue],
        ].map(([k, v], i) => (
          <div
            key={k}
            data-sig-meta
            className={`border-gold/20 px-5 py-2.5 md:px-6 md:py-3 ${i % 2 === 0 ? 'border-r' : ''} ${i < 2 ? 'border-b md:border-b-0' : ''} ${i === 1 ? 'md:border-r' : ''}`}
          >
            <dt className="label text-[0.6rem] text-gold/80">{k}</dt>
            <dd className="mt-1.5 text-xs leading-relaxed text-bone/70 sm:text-sm">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
