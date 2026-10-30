'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLayoutEffect, useRef } from 'react';
import { gsap } from '@/lib/gsap';
import { fmt } from '@/lib/i18n';
import { useI18n } from '../I18nProvider';
import RevealText from '../RevealText';

/**
 * "Exteriors With Nature Connect" — a horizontal exhibition hall.
 * Desktop: the section pins and vertical scroll walks the visitor along the wall,
 * each render sliding against its frame for depth.
 * Touch: a native, snap-aligned swipe gallery (no scroll hijacking).
 */
export default function ExteriorReel() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const { t, href, projects } = useI18n();
  const exteriors = projects.filter((p) => p.discipline === 'Exterior');

  // Layout effect: the pin must be reverted before React removes the DOM on navigation,
  // otherwise React tries to detach a node GSAP has moved into its pin-spacer.
  useLayoutEffect(() => {
    const el = root.current!;
    const mm = gsap.matchMedia(el);
    mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
      const t = track.current!;
      const distance = () => t.scrollWidth - window.innerWidth;
      const tween = gsap.to(t, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
          anticipatePin: 1,
        },
      });
      t.querySelectorAll<HTMLElement>('[data-parallax]').forEach((img) => {
        gsap.fromTo(img, { xPercent: -8 }, {
          xPercent: 8,
          ease: 'none',
          scrollTrigger: { trigger: img.parentElement, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true },
        });
      });
      gsap.fromTo('[data-progress]', { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: el, start: 'top top', end: () => `+=${distance()}`, scrub: true } });
    });
    return () => mm.revert();
  }, []);

  return (
    // React-owned wrapper: GSAP inserts its pin-spacer inside it, never around a React root node.
    <div>
      <section ref={root} id="exteriors" className="relative overflow-hidden bg-night md:h-[100svh]" aria-labelledby="exteriors-title">
        <div className="flex h-full flex-col justify-center py-20 md:py-0">
          <div
            ref={track}
            className="flex snap-x snap-mandatory items-center gap-6 overflow-x-auto px-[var(--gutter)] pb-6 [scrollbar-width:none] md:snap-none md:gap-[6vw] md:overflow-visible md:pb-0 [&::-webkit-scrollbar]:hidden"
          >
            {/* Title panel */}
            <div className="w-[82vw] shrink-0 snap-start md:w-[34vw]">
              <p className="label mb-6 text-gold">{t.exteriors.chapter}</p>
              <RevealText as="h2" text={t.exteriors.title} italic={t.exteriors.italic} className="display h-xl" />
              <p className="mt-8 max-w-sm text-bone/60">
                {fmt(t.exteriors.count, { n: exteriors.length })} <span className="hidden md:inline">{t.exteriors.scrollHint}</span>
                <span className="md:hidden">{t.exteriors.swipeHint}</span>
              </p>
            </div>

            {exteriors.map((p, i) => {
              const m = p.media[0];
              const tall = m.height >= m.width;
              return (
                <Link
                  key={p.slug}
                  href={href(`/work/${p.slug}`)}
                  className={`group relative block shrink-0 snap-center ${tall ? 'w-[72vw] md:w-[30vw]' : 'w-[86vw] md:w-[48vw]'}`}
                >
                  <div className={`frame grain ${tall ? 'aspect-[4/5]' : 'aspect-[16/10]'}`}>
                    <div data-parallax className="absolute inset-y-0 -left-[10%] w-[120%]">
                      <Image
                        src={m.id}
                        alt={m.alt}
                        fill
                        sizes="(max-width: 768px) 86vw, 50vw"
                        className="object-cover transition-transform duration-[1.6s] ease-expo group-hover:scale-[1.04]"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-night/70 via-transparent to-transparent" />
                    <span className="display absolute right-4 top-2 text-[clamp(3rem,7vw,7rem)] leading-none text-bone/15">{String(i + 1).padStart(2, '0')}</span>
                  </div>
                  <div className="mt-5 flex items-start justify-between gap-6">
                    <div>
                      <h3 className="display text-2xl md:text-3xl">{p.title}</h3>
                      <p className="label mt-2 text-bone/50">
                        {p.label}
                        {p.location ? ` · ${p.location}` : ''}
                      </p>
                    </div>
                    <span className="label mt-2 whitespace-nowrap text-gold opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100">{t.exteriors.view}</span>
                  </div>
                </Link>
              );
            })}
            <div className="w-[4vw] shrink-0" aria-hidden />
          </div>

          <div className="wrap mt-10 hidden md:block">
            <div className="h-px w-full bg-bone/10">
              <div data-progress className="h-px origin-left bg-gold" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
