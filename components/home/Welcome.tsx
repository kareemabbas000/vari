'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { gsap } from '@/lib/gsap';
import { brandAssets, copy } from '@/lib/content';

/** "Welcome to Our Design Studio" — the emblem floats in light while the statement illuminates word by word. */
export default function Welcome() {
  const root = useRef<HTMLElement>(null);
  const emblem = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current!;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = gsap.context(() => {
      if (reduced) return;
      gsap.fromTo(
        '[data-word]',
        { opacity: 0.12 },
        { opacity: 1, stagger: 0.04, ease: 'none', scrollTrigger: { trigger: '[data-statement]', start: 'top 80%', end: 'bottom 45%', scrub: true } },
      );
      gsap.fromTo('[data-pattern]', { rotate: -25, scale: 0.8 }, { rotate: 35, scale: 1.1, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
      gsap.fromTo('[data-emblem-wrap]', { yPercent: 15 }, { yPercent: -15, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
    }, el);

    // Pointer tilt — the emblem behaves like a physical object catching light.
    const box = emblem.current;
    const onMove = (e: PointerEvent) => {
      if (!box || reduced) return;
      const r = box.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) / r.width;
      const y = (e.clientY - (r.top + r.height / 2)) / r.height;
      gsap.to(box, { rotateY: x * 18, rotateX: -y * 18, duration: 1.2, ease: 'expo.out' });
      box.style.setProperty('--lx', `${50 + x * 60}%`);
      box.style.setProperty('--ly', `${50 + y * 60}%`);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      ctx.revert();
      window.removeEventListener('pointermove', onMove);
    };
  }, []);

  const words = copy.welcome.body.split(' ');

  return (
    <section ref={root} className="relative overflow-hidden py-28 md:py-44" aria-labelledby="welcome-title">
      <div className="wrap grid items-center gap-16 md:grid-cols-12">
        <div data-emblem-wrap className="relative mx-auto aspect-square w-[70vw] max-w-[460px] md:col-span-5 md:w-full" style={{ perspective: '1000px' }}>
          <div data-pattern className="absolute inset-[-18%] opacity-30">
            <Image src={brandAssets.pattern.id} alt="" fill sizes="(max-width: 768px) 90vw, 560px" className="object-contain" />
          </div>
          <div
            ref={emblem}
            className="relative h-full w-full [transform-style:preserve-3d]"
            style={{ ['--lx' as string]: '50%', ['--ly' as string]: '40%' }}
          >
            <Image src={brandAssets.emblem.id} alt={brandAssets.emblem.alt} fill sizes="(max-width: 768px) 70vw, 460px" className="object-contain drop-shadow-[0_30px_60px_rgba(212,175,55,0.25)]" />
            <div className="pointer-events-none absolute inset-0 rounded-full mix-blend-overlay [background:radial-gradient(circle_at_var(--lx)_var(--ly),rgba(255,255,255,0.45),transparent_45%)]" />
          </div>
        </div>

        <div className="md:col-span-7 md:pl-10">
          <h2 id="welcome-title" className="display h-xl">
            <span className="display-italic text-gold">{copy.welcome.eyebrow}</span>
            <br />
            {copy.welcome.title}
          </h2>
          <span className="hairline my-10 max-w-[120px] !bg-gold" />
          <p data-statement className="body-lg max-w-[38ch] text-bone md:text-[1.55rem] md:leading-[1.55]">
            {words.map((w, i) => (
              <span key={i} data-word className="inline">
                {w}{' '}
              </span>
            ))}
          </p>
          <Link href="/studio" className="btn mt-12">
            <span>{copy.welcome.cta}</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
