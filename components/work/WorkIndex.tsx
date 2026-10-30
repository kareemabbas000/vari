'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { gsap } from '@/lib/gsap';
import { type Discipline } from '@/lib/content';
import { useI18n } from '../I18nProvider';

type Filter = 'all' | 'exterior' | 'interior';
const FILTERS: Filter[] = ['all', 'exterior', 'interior'];

/**
 * Index of every project. Desktop: a typographic list where hovering a title projects
 * its render into a floating viewer that follows the pointer. Mobile: image cards.
 */
export default function WorkIndex() {
  const { t, href, projects } = useI18n();
  const params = useSearchParams();
  const router = useRouter();
  const initial = (params.get('filter') as Filter) || 'all';
  const [filter, setFilter] = useState<Filter>(FILTERS.includes(initial) ? initial : 'all');
  const [hover, setHover] = useState<number | null>(null);
  const viewer = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLOListElement>(null);

  const items = useMemo(
    () => projects.filter((p) => filter === 'all' || p.discipline === ((filter === 'exterior' ? 'Exterior' : 'Interior') as Discipline)),
    [filter, projects],
  );

  useEffect(() => {
    const v = viewer.current;
    if (!v) return;
    const xTo = gsap.quickTo(v, 'x', { duration: 0.8, ease: 'expo.out' });
    const yTo = gsap.quickTo(v, 'y', { duration: 0.8, ease: 'expo.out' });
    const onMove = (e: PointerEvent) => {
      xTo(e.clientX);
      yTo(e.clientY);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  useEffect(() => {
    if (!list.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rows = list.current.querySelectorAll('[data-row]');
    const t = gsap.fromTo(rows, { opacity: 0, y: 24 }, { opacity: 1, y: 0, stagger: 0.04, duration: 1 });
    return () => {
      t.kill();
    };
  }, [filter]);

  const select = (f: Filter) => {
    setFilter(f);
    router.replace(href(f === 'all' ? '/work' : `/work?filter=${f}`), { scroll: false });
  };

  return (
    <>
      <div className="flex flex-wrap gap-3" role="tablist" aria-label={t.work.filterAria}>
        {FILTERS.map((key) => {
          const count = key === 'all' ? projects.length : projects.filter((p) => p.discipline.toLowerCase() === key).length;
          return (
            <button
              key={key}
              role="tab"
              aria-selected={filter === key}
              onClick={() => select(key)}
              className={`label border px-5 py-3 transition-colors duration-500 ${
                filter === key ? 'border-gold bg-gold text-night' : 'border-bone/20 text-bone/70 hover:border-gold hover:text-gold'
              }`}
            >
              {t.work.filters[key]} <span className="opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      <ol ref={list} className="mt-14 border-t border-bone/10" onMouseLeave={() => setHover(null)}>
        {items.map((p, i) => (
          <li key={p.slug} data-row>
            <Link
              href={href(`/work/${p.slug}`)}
              onMouseEnter={() => setHover(projects.indexOf(p))}
              onFocus={() => setHover(projects.indexOf(p))}
              className="group grid grid-cols-[2.5rem_1fr] items-center gap-x-4 gap-y-4 border-b border-bone/10 py-6 md:grid-cols-[4rem_1fr_14rem_10rem] md:py-7"
            >
              <span className="label text-bone/40 group-hover:text-gold">{String(i + 1).padStart(2, '0')}</span>
              <span className="display text-[1.8rem] leading-tight transition-[transform,color] duration-700 ease-expo group-hover:translate-x-3 group-hover:text-gold md:text-[3.2rem]">
                {p.title}
              </span>
              <div className="frame col-span-2 aspect-[16/10] md:hidden">
                <Image src={p.media[0].id} alt={p.media[0].alt} fill sizes="100vw" className="object-cover" />
              </div>
              <span className="label col-start-2 text-bone/50 md:col-start-auto">{p.location ?? p.label}</span>
              <span className="label col-start-2 text-gold/80 md:col-start-auto md:text-right">{t.disciplines[p.discipline]}</span>
            </Link>
          </li>
        ))}
      </ol>

      {/* Floating viewer (pointer devices) */}
      <div
        ref={viewer}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-30 hidden [@media(hover:hover)]:md:block"
        style={{ transform: 'translate(-9999px,-9999px)' }}
      >
        <div
          className={`frame -translate-x-1/2 -translate-y-1/2 transition-[opacity,clip-path] duration-700 ease-expo ${
            hover !== null ? 'opacity-100 [clip-path:inset(0_0_0_0)]' : 'opacity-0 [clip-path:inset(50%_50%_50%_50%)]'
          }`}
          style={{ width: 'min(32vw, 460px)', aspectRatio: '4 / 3' }}
        >
          {projects.map((p, i) => (
            <Image
              key={p.slug}
              src={p.media[0].id}
              alt=""
              fill
              sizes="460px"
              className={`object-cover transition-opacity duration-500 ${hover === i ? 'opacity-100' : 'opacity-0'}`}
            />
          ))}
        </div>
      </div>
    </>
  );
}
