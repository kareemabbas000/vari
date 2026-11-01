'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { gsap } from '@/lib/gsap';
import { useI18n } from '../I18nProvider';
import MoreRooms from './MoreRooms';


/**
 * "Interiors With Soul Connect".
 * A doorway opens onto a sequence of rooms: each featured interior grows from a
 * window into the whole viewport while the room behind recedes. The remaining
 * interiors follow as an enfilade of doors (see MoreRooms).
 */
export default function InteriorRooms() {
  const root = useRef<HTMLElement>(null);
  const { t, href, projects } = useI18n();
  // Rooms marked "featured" in the panel (up to four), else the first interiors.
  const interiors = projects.filter((p) => p.category === 'interior');
  const picked = interiors.filter((p) => p.featured);
  const featured = (picked.length ? picked : interiors).slice(0, 4);
  const FEATURED = featured.map((p) => p.slug);

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

    });
    return () => mm.revert();
  }, []);

  if (!featured.length) return null;
  const first = featured[0].media[0];

  return (
    <section ref={root} id="interiors" aria-labelledby="interiors-title" className="relative bg-night">
      {/* Threshold */}
      <div data-threshold className="relative h-[180vh]">
        <div className="sticky top-0 h-[100svh] overflow-hidden">
          <div data-door className="absolute inset-0" style={{ clipPath: 'inset(0% 0% 0% 0%)' }}>
            <Image src={first.id} alt={first.alt} fill sizes="100vw" className="object-cover" />
            <div className="absolute inset-0 bg-night/45" />
          </div>
          <div data-door-title className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-[var(--gutter)] text-center">
            <p className="label mb-6 text-gold">{t.interiors.chapter}</p>
            <h2 id="interiors-title" className="display h-xl max-w-[16ch]">
              {t.interiors.titleA} <span className="display-italic text-gold">{t.interiors.titleItalic}</span>
              {t.interiors.titleB}
            </h2>
            <p className="label mt-8 text-bone/60">{t.interiors.stepInside}</p>
          </div>
        </div>
      </div>

      {/* Rooms */}
      <div className="relative">
        {featured.map((p, i) => {
          const m = p.media[0];
          return (
            <article key={p.slug} data-room className="pointer-events-none sticky top-0 h-[100svh] overflow-hidden" aria-label={p.title}>
              <div data-room-inner className="relative h-full w-full origin-center">
                <div data-room-frame className="pointer-events-auto absolute inset-0 overflow-hidden">
                  <div data-room-img className="absolute inset-0">
                    <Image src={m.id} alt={m.alt} fill sizes="100vw" className="object-cover" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-night via-night/20 to-night/30" />
                </div>
                <div className="wrap relative flex h-full flex-col justify-end pb-[10vh]">
                  <p data-room-text className="label text-gold">
                    {t.interiors.room} {String(i + 1).padStart(2, '0')} / {String(featured.length).padStart(2, '0')}
                    {p.location ? ` · ${p.location}` : ''}
                  </p>
                  <h3 data-room-text className="display h-lg mt-4 max-w-[18ch]">
                    {p.title}
                  </h3>
                  <p data-room-text className="mt-5 max-w-xl text-bone/75 md:text-lg">
                    {p.description[0]}
                  </p>
                  <Link data-room-text href={href(`/work/${p.slug}`)} className="btn pointer-events-auto mt-8 self-start">
                    <span>{t.interiors.enter}</span>
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <MoreRooms exclude={FEATURED} />
    </section>
  );
}
