'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { gsap } from '@/lib/gsap';
import { interiors } from '@/lib/content';

/**
 * "More rooms, more souls" — an enfilade.
 * The remaining interiors stand side by side like a row of doors. Each door shows a
 * sliver of its room; the one you approach (hover, focus or tap) swings open to the
 * full render. Desktop: vertical doors in a row. Mobile: stacked horizontal bands.
 */
export default function MoreRooms({ exclude }: { exclude: string[] }) {
  const rooms = interiors.filter((p) => !exclude.includes(p.slug));
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const touch = useRef(false);

  useEffect(() => {
    touch.current = window.matchMedia('(hover: none)').matches;
    const el = root.current!;
    const mm = gsap.matchMedia(el);
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo(
        '[data-door-leaf]',
        { clipPath: 'inset(100% 0% 0% 0%)' },
        {
          clipPath: 'inset(0% 0% 0% 0%)',
          duration: 1.4,
          ease: 'expo.out',
          stagger: 0.07,
          scrollTrigger: { trigger: '[data-enfilade]', start: 'top 80%', once: true },
        },
      );
    });
    return () => mm.revert();
  }, []);

  const onClick = (i: number) => (e: MouseEvent) => {
    // On touch screens the first tap opens the door, the second enters the room.
    if (touch.current && i !== active) {
      e.preventDefault();
      setActive(i);
    }
  };

  const current = rooms[active];

  return (
    <div ref={root} className="relative z-10 bg-night py-24 md:py-36">
      <div className="wrap">
        <div className="mb-12 grid gap-6 md:mb-16 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <p className="label text-gold">Enfilade · {String(rooms.length).padStart(2, '0')} rooms</p>
            <h3 className="display h-lg mt-4 max-w-[14ch]">
              More rooms, <span className="display-italic text-gold">more souls</span>
            </h3>
          </div>
          <div className="flex flex-col gap-4 md:col-span-5 md:items-end md:text-right">
            <p className="max-w-sm text-bone/60" aria-live="polite">
              <span className="label mr-3 text-gold">{String(active + 1).padStart(2, '0')}</span>
              {current.title}
              {current.location ? <span className="text-bone/40"> — {current.location}</span> : null}
            </p>
            <Link href="/work?filter=interior" className="label link-line self-start text-gold md:self-end">
              All {interiors.length} interiors →
            </Link>
          </div>
        </div>

        <ul data-enfilade className="flex flex-col gap-2 md:h-[min(78svh,760px)] md:flex-row md:gap-3">
          {rooms.map((p, i) => {
            const m = p.media[0];
            const open = i === active;
            return (
              <li
                key={p.slug}
                className={`relative min-w-0 transition-[flex-grow,height] duration-[900ms] ease-expo md:h-full ${
                  open ? 'h-[56svh] md:h-full md:grow-[7]' : 'h-[68px] md:h-full md:grow'
                } md:basis-0`}
              >
                <Link
                  href={`/work/${p.slug}`}
                  onMouseEnter={() => !touch.current && setActive(i)}
                  onFocus={() => setActive(i)}
                  onClick={onClick(i)}
                  aria-label={`${p.title}${p.location ? `, ${p.location}` : ''} — view project`}
                  className="group block h-full outline-none"
                >
                  <div data-door-leaf className="relative h-full overflow-hidden border border-gold/15 bg-charcoal group-focus-visible:border-gold">
                    <Image
                      src={m.id}
                      alt={m.alt}
                      fill
                      sizes="(max-width: 768px) 100vw, 60vw"
                      className={`object-cover transition-[transform,filter] duration-[1.4s] ease-expo ${
                        open ? 'scale-100 brightness-100 saturate-100' : 'scale-110 brightness-[0.45] saturate-[0.6]'
                      }`}
                    />
                    <div
                      className={`absolute inset-0 bg-gradient-to-t from-night/90 via-night/10 to-transparent transition-opacity duration-700 ${
                        open ? 'opacity-100' : 'opacity-0'
                      }`}
                    />

                    {/* Closed door: number + vertical title */}
                    <div
                      className={`absolute inset-0 flex items-center justify-between gap-4 px-4 transition-opacity duration-500 md:flex-col md:justify-between md:px-0 md:py-6 ${
                        open ? 'pointer-events-none opacity-0' : 'opacity-100 delay-200'
                      }`}
                    >
                      <span className="label text-gold">{String(i + 1).padStart(2, '0')}</span>
                      <span className="display truncate text-lg text-bone/85 md:max-h-[80%] md:text-xl md:[writing-mode:vertical-rl] md:rotate-180">
                        {p.title}
                      </span>
                    </div>

                    {/* Open door: room card */}
                    <div
                      className={`absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 p-5 transition-[opacity,transform] duration-700 ease-expo md:p-8 ${
                        open ? 'translate-y-0 opacity-100 delay-300' : 'pointer-events-none translate-y-4 opacity-0'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="label text-gold">
                          {String(i + 1).padStart(2, '0')} · {p.location ?? p.label}
                        </p>
                        <h4 className="display mt-2 text-2xl md:text-4xl">{p.title}</h4>
                        <p className="mt-3 hidden max-w-lg text-sm text-bone/70 md:line-clamp-2 md:block">{p.description[0]}</p>
                      </div>
                      <span className="label hidden shrink-0 items-center gap-3 text-bone sm:flex">
                        Enter
                        <span className="block h-px w-8 bg-gold transition-[width] duration-700 ease-expo group-hover:w-16" />
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
        <p className="label mt-5 text-bone/35 md:hidden">Tap a door to open it · tap again to enter</p>
      </div>
    </div>
  );
}
