'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { gsap } from '@/lib/gsap';
import { copy, getProject } from '@/lib/content';

/** Three real renders used as layers of an "exploded" spatial composition. */
const LAYERS = [
  { p: getProject('hearthstone-haven')!, m: 0, cls: 'left-[4%] top-[2%] w-[58%] aspect-[4/5]', z: -260 },
  { p: getProject('light-in-the-dark')!, m: 0, cls: 'right-[2%] top-[18%] w-[50%] aspect-square', z: -40 },
  { p: getProject('rustic-chic-oasis')!, m: 0, cls: 'left-[16%] bottom-[2%] w-[54%] aspect-[3/2]', z: 180 },
];

/**
 * "Welcome to Our Design Studio".
 * Left: an exploded composition — three VARI renders stacked like the layers of a
 * section drawing. Scroll pulls the layers apart in depth; the pointer orbits them.
 * Right: the studio statement illuminates word by word.
 */
export default function Welcome() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current!;
    const mm = gsap.matchMedia(el);
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo(
        '[data-word]',
        { opacity: 0.14 },
        { opacity: 1, stagger: 0.04, ease: 'none', scrollTrigger: { trigger: '[data-statement]', start: 'top 80%', end: 'bottom 45%', scrub: true } },
      );

      // Explode: layers start flat (collapsed) and separate along Z as the section crosses the screen.
      gsap.utils.toArray<HTMLElement>('[data-layer]').forEach((layer) => {
        const z = Number(layer.dataset.z);
        gsap.fromTo(
          layer,
          { z: 0, opacity: 0.0, scale: 0.92 },
          { z, opacity: 1, scale: 1, ease: 'none', scrollTrigger: { trigger: el, start: 'top 85%', end: 'center center', scrub: true } },
        );
      });
      gsap.fromTo(stage.current, { rotateX: 32, rotateY: -28 }, { rotateX: 14, rotateY: -14, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
      gsap.fromTo('[data-axis]', { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: el, start: 'top 70%', end: 'center center', scrub: true } });
    });

    const s = stage.current;
    const onMove = (e: PointerEvent) => {
      if (!s) return;
      const x = e.clientX / window.innerWidth - 0.5;
      const y = e.clientY / window.innerHeight - 0.5;
      gsap.to(s, { x: x * 30, y: y * 20, duration: 1.4, ease: 'expo.out' });
    };
    if (window.matchMedia('(hover: hover)').matches) window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      mm.revert();
      window.removeEventListener('pointermove', onMove);
    };
  }, []);

  const words = copy.welcome.body.split(' ');

  return (
    <section ref={root} className="relative overflow-hidden py-24 md:py-40" aria-labelledby="welcome-title">
      <div className="wrap grid items-center gap-14 md:grid-cols-12 md:gap-10">
        <div className="relative mx-auto aspect-square w-full max-w-[560px] md:col-span-6" style={{ perspective: '1400px' }} aria-hidden>
          <div ref={stage} className="relative h-full w-full [transform-style:preserve-3d]" style={{ transform: 'rotateX(14deg) rotateY(-14deg)' }}>
            {/* Datum axis through the layers */}
            <span data-axis className="absolute left-1/2 top-[-6%] h-[112%] w-px origin-top bg-gradient-to-b from-transparent via-gold/70 to-transparent" />
            {LAYERS.map(({ p, m, cls, z }, i) => (
              <div key={p.slug} data-layer data-z={z} className={`absolute ${cls}`} style={{ transform: `translateZ(${z}px)` }}>
                <div className="frame h-full w-full shadow-[0_40px_80px_rgba(0,0,0,0.6)]">
                  <Image src={p.media[m].id} alt="" fill sizes="(max-width: 768px) 60vw, 320px" className="object-cover" />
                </div>
                <span className="pointer-events-none absolute -inset-2 border border-gold/40" />
                <span className="label absolute -bottom-6 left-0 whitespace-nowrap text-[0.6rem] text-gold/80">
                  L{i + 1} — {p.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-6 md:pl-8">
          <h2 id="welcome-title" className="display h-xl">
            <span className="display-italic text-gold">{copy.welcome.eyebrow}</span>
            <br />
            {copy.welcome.title}
          </h2>
          <span className="my-8 block h-px w-24 bg-gold md:my-10" />
          <p data-statement className="body-lg max-w-[40ch] text-bone md:text-[1.4rem] md:leading-[1.6]">
            {words.map((w, i) => (
              <span key={i} data-word>
                {w}{' '}
              </span>
            ))}
          </p>
          <Link href="/studio" className="btn mt-10 md:mt-12">
            <span>{copy.welcome.cta}</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
