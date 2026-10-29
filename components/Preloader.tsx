'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { gsap } from '@/lib/gsap';
import { brandAssets } from '@/lib/content';

export const INTRO_EVENT = 'vari:intro-done';

/**
 * Opening sequence: the elevation of a pavilion is drawn in gold line, the VARI
 * emblem emerges in the light, then the curtain lifts onto the hero. Plays once per
 * session; skipped instantly for reduced-motion visitors.
 */
export default function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const finish = () => {
      setDone(true);
      (window as unknown as { __variIntroDone?: boolean }).__variIntroDone = true;
      window.dispatchEvent(new Event(INTRO_EVENT));
    };

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let seen = false;
    try {
      seen = sessionStorage.getItem('vari-intro') === '1';
      sessionStorage.setItem('vari-intro', '1');
    } catch {}

    if (reduced || seen) {
      finish();
      return;
    }

    document.documentElement.style.overflow = 'hidden';
    const el = root.current!;
    const counter = { v: 0 };
    const loaded = new Promise<void>((resolve) => {
      if (document.readyState === 'complete') resolve();
      else window.addEventListener('load', () => resolve(), { once: true });
      window.setTimeout(resolve, 3500); // never hold the visitor hostage to a slow asset
    });

    const ctx = gsap.context(() => {
      const paths = el.querySelectorAll<SVGPathElement>('[data-draw]');
      paths.forEach((p) => {
        const len = p.getTotalLength();
        p.style.strokeDasharray = `${len}`;
        p.style.strokeDashoffset = `${len}`;
      });

      const tl = gsap.timeline();
      tl.to(paths, { strokeDashoffset: 0, duration: 1.8, ease: 'power2.inOut', stagger: 0.05 }, 0)
        .to(counter, { v: 90, duration: 1.9, ease: 'power1.inOut', onUpdate: () => setCount(Math.round(counter.v)) }, 0)
        .fromTo('[data-emblem]', { opacity: 0, scale: 0.86, filter: 'blur(14px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 1.4 }, 1.1)
        .fromTo('[data-sweep]', { xPercent: -120 }, { xPercent: 120, duration: 1.4, ease: 'power2.inOut' }, 1.5);

      loaded.then(() => {
        const out = gsap.timeline({
          delay: Math.max(0, 2.6 - tl.time()),
          onComplete: () => {
            document.documentElement.style.overflow = '';
            finish();
          },
        });
        out
          .to(counter, { v: 100, duration: 0.5, onUpdate: () => setCount(Math.round(counter.v)) })
          .to('[data-drawing]', { opacity: 0, scale: 1.08, duration: 0.9, ease: 'power3.in' }, '+=0.15')
          .to('[data-emblem]', { opacity: 0, y: -30, duration: 0.7, ease: 'power3.in' }, '<')
          .to(el, { clipPath: 'inset(0 0 100% 0)', duration: 1.1, ease: 'expo.inOut' }, '-=0.25');
      });
    }, el);

    return () => {
      ctx.revert();
      document.documentElement.style.overflow = '';
    };
  }, []);

  if (done) return null;

  return (
    <div
      ref={root}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-night"
      style={{ clipPath: 'inset(0 0 0 0)' }}
      role="status"
      aria-live="polite"
      aria-label="Loading VARI Studio"
    >
      <svg data-drawing viewBox="0 0 600 400" className="absolute w-[min(88vw,760px)] text-gold" fill="none" stroke="currentColor" strokeWidth="0.8" aria-hidden>
        {/* ground & datum */}
        <path data-draw d="M20 330 H580" />
        <path data-draw d="M300 40 V360" strokeOpacity="0.25" strokeDasharray="2 4" />
        {/* perspective colonnade */}
        <path data-draw d="M80 330 V110 M140 330 V140 M190 330 V164 M232 330 V182 M266 330 V196" />
        <path data-draw d="M520 330 V110 M460 330 V140 M410 330 V164 M368 330 V182 M334 330 V196" />
        {/* canopy */}
        <path data-draw d="M60 104 L300 200 L540 104" />
        <path data-draw d="M60 96 H540" />
        {/* vanishing frame */}
        <path data-draw d="M282 210 H318 V262 H282 Z" />
        <path data-draw d="M80 330 L282 262 M520 330 L318 262" strokeOpacity="0.4" />
      </svg>

      <div data-emblem className="relative z-10 w-[min(42vw,220px)] overflow-hidden opacity-0">
        <Image src={brandAssets.emblem.id} alt="VARI Studio" width={440} height={440} priority sizes="220px" className="h-auto w-full" />
        <span data-sweep aria-hidden className="pointer-events-none absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent mix-blend-overlay" />
      </div>

      <div className="absolute inset-x-0 bottom-8 flex items-end justify-between px-[var(--gutter)]">
        <span className="label text-bone/50">Architecture · Interiors · Visualization</span>
        <span className="display text-5xl tabular-nums text-gold md:text-7xl">{String(count).padStart(3, '0')}</span>
      </div>
    </div>
  );
}
