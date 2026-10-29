'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { gsap } from '@/lib/gsap';
import { copy } from '@/lib/content';

/**
 * The studio's positioning, told as five chapters. Desktop: the imagery is held in a
 * sticky frame and each chapter wipes in like a new elevation; mobile: image and text
 * travel together.
 */
export default function Story() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current!;
    const mm = gsap.matchMedia(el);
    mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
      const chapters = gsap.utils.toArray<HTMLElement>('[data-chapter]');
      const images = gsap.utils.toArray<HTMLElement>('[data-story-img]');
      images.forEach((img, i) => {
        if (i === 0) return;
        gsap.fromTo(
          img,
          { clipPath: 'inset(100% 0% 0% 0%)' },
          { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: { trigger: chapters[i], start: 'top 85%', end: 'top 35%', scrub: true } },
        );
        gsap.fromTo(img.querySelector('img'), { scale: 1.25 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: chapters[i], start: 'top 85%', end: 'top 35%', scrub: true } });
      });
      chapters.forEach((c) => {
        gsap.fromTo(c.querySelectorAll('[data-fade]'), { opacity: 0.15 }, { opacity: 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: c, start: 'top 75%', end: 'top 40%', scrub: true } });
      });
    });
    mm.add('(max-width: 767px) and (prefers-reduced-motion: no-preference)', () => {
      gsap.utils.toArray<HTMLElement>('[data-mobile-img]').forEach((img) => {
        gsap.fromTo(img, { clipPath: 'inset(15% 15% 15% 15%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: { trigger: img, start: 'top 95%', end: 'top 45%', scrub: true } });
      });
    });
    return () => mm.revert();
  }, []);

  return (
    <section ref={root} aria-labelledby="story-title" className="relative py-28 md:py-0">
      <h2 id="story-title" className="sr-only">
        The VARI approach
      </h2>
      <div className="wrap grid gap-10 md:grid-cols-12">
        {/* Sticky frame (desktop) */}
        <div className="hidden md:col-span-6 md:block">
          <div className="sticky top-0 flex h-[100svh] items-center">
            <div className="frame grain relative aspect-[4/5] w-full">
              {copy.pillars.map((p, i) => (
                <div key={i} data-story-img className="absolute inset-0 overflow-hidden" style={{ zIndex: i }}>
                  <Image src={p.media.id} alt={p.media.alt} fill sizes="50vw" className="object-cover" />
                </div>
              ))}
              <div className="pointer-events-none absolute inset-0 z-20 border border-gold/20" />
            </div>
          </div>
        </div>

        <div className="md:col-span-5 md:col-start-8">
          {copy.pillars.map((p, i) => (
            <article key={i} data-chapter className="flex min-h-0 flex-col justify-center py-14 md:min-h-[100svh] md:py-0">
              <div data-mobile-img className="frame mb-8 aspect-[4/3] md:hidden">
                <Image src={p.media.id} alt={p.media.alt} fill sizes="100vw" className="object-cover" />
              </div>
              <p data-fade className="label text-gold">
                {String(i + 1).padStart(2, '0')} — {p.sub}
              </p>
              <h3 data-fade className="display h-lg mt-6">
                {p.title}
              </h3>
              <p data-fade className="body-lg mt-6 text-bone/70">
                {p.body}
              </p>
              {'extra' in p && p.extra ? (
                <div data-fade className="mt-10 border-l border-gold/50 pl-6">
                  <p className="display text-2xl text-gold">{p.extra.sub}</p>
                  <p className="mt-3 text-bone/70">{p.extra.body}</p>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
