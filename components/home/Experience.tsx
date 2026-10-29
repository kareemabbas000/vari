'use client';

import { useEffect, useRef } from 'react';
import { gsap } from '@/lib/gsap';
import { copy } from '@/lib/content';

/** "Delivering Exceptional Design Experiences" — two counter-moving bands of type driven by scroll. */
export default function Experience() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current!;
    const mm = gsap.matchMedia(el);
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo('[data-band-a]', { xPercent: 0 }, { xPercent: -30, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
      gsap.fromTo('[data-band-b]', { xPercent: -30 }, { xPercent: 0, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    return () => mm.revert();
  }, []);

  const a = Array(4).fill(copy.experienceTitle);
  const b = Array(4).fill(copy.experienceSub);

  return (
    <section ref={root} aria-label={copy.experienceTitle} className="relative overflow-hidden border-y border-gold/10 py-20 md:py-28">
      <p className="sr-only">
        {copy.experienceTitle}. {copy.experienceSub}.
      </p>
      <div aria-hidden data-band-a className="flex w-max gap-12 whitespace-nowrap">
        {a.map((t, i) => (
          <span key={i} className="display text-[clamp(3rem,9vw,9rem)] leading-none text-bone/90">
            {t} <span className="text-gold">✦</span>
          </span>
        ))}
      </div>
      <div aria-hidden data-band-b className="mt-6 flex w-max gap-12 whitespace-nowrap">
        {b.map((t, i) => (
          <span key={i} className="display-italic gold-text text-[clamp(2.5rem,7vw,7rem)] leading-tight">
            {t} —
          </span>
        ))}
      </div>
    </section>
  );
}
