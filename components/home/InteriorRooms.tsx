'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { gsap } from '@/lib/gsap';
import { getProject, interiors } from '@/lib/content';

const FEATURED = ['hearthstone-haven', 'sophisticated-home-office', 'penthouse-in-dark-mood', 'timeless-english-roof-architecture'];
const featured = FEATURED.map((s) => getProject(s)!);
const rest = interiors.filter((p) => !FEATURED.includes(p.slug));

/** Layout recipe for the floating gallery: column span, start column, depth speed. */
const LAYOUT = [
  { cls: 'md:col-span-5 md:col-start-1', ratio: 'aspect-[4/3]', speed: -12 },
  { cls: 'md:col-span-4 md:col-start-8 md:mt-40', ratio: 'aspect-[4/5]', speed: 10 },
  { cls: 'md:col-span-4 md:col-start-2 md:-mt-10', ratio: 'aspect-[1/1]', speed: 6 },
  { cls: 'md:col-span-6 md:col-start-7 md:mt-24', ratio: 'aspect-[16/10]', speed: -8 },
  { cls: 'md:col-span-5 md:col-start-1 md:mt-10', ratio: 'aspect-[3/2]', speed: 12 },
  { cls: 'md:col-span-4 md:col-start-8 md:mt-32', ratio: 'aspect-[3/4]', speed: -10 },
  { cls: 'md:col-span-6 md:col-start-3 md:mt-16', ratio: 'aspect-[16/9]', speed: 8 },
  { cls: 'md:col-span-4 md:col-start-9 md:-mt-24', ratio: 'aspect-[4/5]', speed: -6 },
];

/**
 * "Interiors With Soul Connect".
 * A doorway opens onto a sequence of rooms: each featured interior grows from a
 * window into the whole viewport while the room behind recedes. The remaining
 * interiors then float past at different depths.
 */
export default function InteriorRooms() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current!;
    const mm = gsap.matchMedia(el);
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      // Threshold: the doorway outline expands into the first room.
      gsap.fromTo(
        '[data-door]',
        { clipPath: 'inset(22% 36% 0% 36%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: { trigger: '[data-threshold]', start: 'top top', end: 'bottom top', scrub: true } },
      );
      gsap.to('[data-door-title]', {
        opacity: 0,
        scale: 1.4,
        ease: 'none',
        scrollTrigger: { trigger: '[data-threshold]', start: 'top top', end: '55% top', scrub: true },
      });

      const rooms = gsap.utils.toArray<HTMLElement>('[data-room]');
      rooms.forEach((room, i) => {
        const frame = room.querySelector('[data-room-frame]');
        const img = room.querySelector('[data-room-img]');
        const text = room.querySelectorAll('[data-room-text]');
        if (i > 0) {
          gsap.fromTo(
            frame,
            { clipPath: 'inset(28% 22% 28% 22%)' },
            { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: { trigger: room, start: 'top bottom', end: 'top top', scrub: true } },
          );
          gsap.fromTo(img, { scale: 1.35 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: room, start: 'top bottom', end: 'top top', scrub: true } });
        }
        gsap.fromTo(text, { opacity: 0, y: 40 }, { opacity: 1, y: 0, stagger: 0.08, duration: 1.2, scrollTrigger: { trigger: room, start: 'top 30%', toggleActions: 'play none none reverse' } });
        // The room we are leaving recedes into darkness.
        if (i < rooms.length - 1) {
          gsap.to(room.querySelector('[data-room-inner]'), {
            scale: 0.9,
            opacity: 0.35,
            ease: 'none',
            scrollTrigger: { trigger: rooms[i + 1], start: 'top bottom', end: 'top top', scrub: true },
          });
        }
      });

      gsap.utils.toArray<HTMLElement>('[data-depth]').forEach((card) => {
        const speed = Number(card.dataset.depth);
        gsap.fromTo(card, { yPercent: speed }, { yPercent: -speed, ease: 'none', scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: true } });
        gsap.fromTo(
          card.querySelector('[data-reveal]'),
          { clipPath: 'inset(100% 0% 0% 0%)' },
          { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: card, start: 'top 88%', once: true } },
        );
      });
    });
    return () => mm.revert();
  }, []);

  const first = featured[0].media[0];

  return (
    <section ref={root} id="interiors" aria-labelledby="interiors-title" className="relative bg-night">
      {/* Threshold */}
      <div data-threshold className="relative h-[180vh]">
        <div className="sticky top-0 h-[100svh] overflow-hidden">
          <div data-door className="absolute inset-0" style={{ clipPath: 'inset(0% 0% 0% 0%)' }}>
            <Image src={first.id} alt="" fill sizes="100vw" className="object-cover" />
            <div className="absolute inset-0 bg-night/45" />
          </div>
          <div data-door-title className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-[var(--gutter)] text-center">
            <p className="label mb-6 text-gold">Chapter II — Interiors</p>
            <h2 id="interiors-title" className="display h-xl max-w-[16ch]">
              Interiors With <span className="display-italic text-gold">Soul</span> Connect
            </h2>
            <p className="label mt-8 text-bone/60">Step inside</p>
          </div>
        </div>
      </div>

      {/* Rooms */}
      <div className="relative">
        {featured.map((p, i) => {
          const m = p.media[0];
          return (
            <article key={p.slug} data-room className="sticky top-0 h-[100svh] overflow-hidden" aria-label={p.title}>
              <div data-room-inner className="relative h-full w-full origin-center">
                <div data-room-frame className="absolute inset-0 overflow-hidden">
                  <div data-room-img className="absolute inset-0">
                    <Image src={m.id} alt={m.alt} fill sizes="100vw" className="object-cover" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-night via-night/20 to-night/30" />
                </div>
                <div className="wrap relative flex h-full flex-col justify-end pb-[10vh]">
                  <p data-room-text className="label text-gold">
                    Room {String(i + 1).padStart(2, '0')} / {String(featured.length).padStart(2, '0')}
                    {p.location ? ` · ${p.location}` : ''}
                  </p>
                  <h3 data-room-text className="display h-lg mt-4 max-w-[18ch]">
                    {p.title}
                  </h3>
                  <p data-room-text className="mt-5 max-w-xl text-bone/75 md:text-lg">
                    {p.description[0]}
                  </p>
                  <Link data-room-text href={`/work/${p.slug}`} className="btn mt-8 self-start">
                    <span>Enter the room</span>
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Floating gallery */}
      <div className="relative z-10 bg-night py-28 md:py-40">
        <div className="wrap">
          <div className="mb-16 flex flex-col justify-between gap-6 md:mb-24 md:flex-row md:items-end">
            <h3 className="display h-lg max-w-[14ch]">
              More rooms, <span className="display-italic text-gold">more souls</span>
            </h3>
            <Link href="/work?filter=interior" className="label link-line self-start text-gold md:self-auto">
              All {interiors.length} interiors →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-14 md:grid-cols-12 md:gap-x-6 md:gap-y-0">
            {rest.map((p, i) => {
              const m = p.media[0];
              const l = LAYOUT[i % LAYOUT.length];
              return (
                <Link key={p.slug} href={`/work/${p.slug}`} data-depth={l.speed} className={`group block ${l.cls}`}>
                  <div data-reveal className={`frame grain ${l.ratio}`}>
                    <Image
                      src={m.id}
                      alt={m.alt}
                      fill
                      sizes="(max-width: 768px) 100vw, 45vw"
                      className="object-cover transition-transform duration-[1.6s] ease-expo group-hover:scale-105"
                    />
                  </div>
                  <div className="mt-4 flex items-baseline justify-between gap-4">
                    <h4 className="display text-xl md:text-2xl">{p.title}</h4>
                    <span className="label text-bone/40">{p.location ?? p.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
