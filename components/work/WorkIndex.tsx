'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { gsap } from '@/lib/gsap';
import { useI18n } from '../I18nProvider';

/** 'all' or a category slug from the CMS. */
type Filter = string;
type View = 'gallery' | 'index';

/** Editorial rhythm for the gallery: column spans (12-col desktop grid) and image ratios. */
const RHYTHM = [
  { span: 'lg:col-span-7', ratio: 'aspect-[16/11]' },
  { span: 'lg:col-span-5 lg:mt-24', ratio: 'aspect-[4/5]' },
  { span: 'lg:col-span-5', ratio: 'aspect-[4/5]' },
  { span: 'lg:col-span-7 lg:mt-32', ratio: 'aspect-[16/11]' },
  { span: 'lg:col-span-4', ratio: 'aspect-[4/5]' },
  { span: 'lg:col-span-4 lg:mt-20', ratio: 'aspect-[4/5]' },
  { span: 'lg:col-span-4', ratio: 'aspect-[4/5]' },
  { span: 'lg:col-span-6', ratio: 'aspect-[4/3]' },
  { span: 'lg:col-span-6 lg:mt-24', ratio: 'aspect-[4/3]' },
];

/**
 * Every project, two ways.
 * Gallery (default): an editorial grid of the renders, revealed as they enter the view.
 * Index: a typographic list where hovering a title projects its render into a floating
 * viewer that follows the pointer (image cards on touch screens).
 */
export default function WorkIndex() {
  const { t, href, projects, categories } = useI18n();
  const FILTERS: Filter[] = ['all', ...categories.filter((c) => projects.some((p) => p.category === c.slug)).map((c) => c.slug)];
  const filterName = (key: Filter) => (key === 'all' ? t.work.filters.all : categories.find((c) => c.slug === key)?.name ?? key);
  const router = useRouter();
  // The server renders every project (crawlable links, no layout jump). A shared
  // ?filter= link is applied after mount: useSearchParams() here would make Next.js skip
  // server rendering of the whole grid (docs/seo/TECHNICAL-AUDIT.md T2).
  const [filter, setFilter] = useState<Filter>('all');
  useEffect(() => {
    const f = new URLSearchParams(window.location.search).get('filter');
    if (f && FILTERS.includes(f)) setFilter(f);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [view, setView] = useState<View>('gallery');
  const [hover, setHover] = useState<number | null>(null);
  const grid = useRef<HTMLUListElement>(null);
  const viewer = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLOListElement>(null);

  const items = useMemo(
    () => projects.filter((p) => filter === 'all' || p.category === filter),
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
  }, [filter, view]);

  // Gallery: each card's frame opens from the bottom as it scrolls into view.
  useEffect(() => {
    const g = grid.current;
    if (!g || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cards = Array.from(g.querySelectorAll<HTMLElement>('[data-card]'));
    gsap.set(cards, { clipPath: 'inset(100% 0% 0% 0%)', y: 40 });
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          gsap.to(e.target, { clipPath: 'inset(0% 0% 0% 0%)', y: 0, duration: 1.4, ease: 'expo.out' });
          io.unobserve(e.target);
        });
      },
      { rootMargin: '0px 0px -8% 0px' },
    );
    cards.forEach((c) => io.observe(c));
    return () => {
      io.disconnect();
      gsap.killTweensOf(cards);
      gsap.set(cards, { clearProps: 'clipPath,transform' });
    };
  }, [filter, view]);

  const select = (f: Filter) => {
    setFilter(f);
    router.replace(href(f === 'all' ? '/work' : `/work?filter=${f}`), { scroll: false });
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div className="flex flex-wrap gap-3" role="tablist" aria-label={t.work.filterAria}>
          {FILTERS.map((key) => {
            const count = key === 'all' ? projects.length : projects.filter((p) => p.category === key).length;
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
                {filterName(key)} <span className="opacity-60">({count})</span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-1 border border-bone/15 p-1" role="group" aria-label={t.work.views.label}>
          {(['gallery', 'index'] as View[]).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={`label flex items-center gap-2 px-4 py-2 transition-colors duration-500 ${view === v ? 'bg-bone/10 text-gold' : 'text-bone/50 hover:text-bone'}`}
            >
              {v === 'gallery' ? (
                <svg aria-hidden width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor">
                  <rect x="0.5" y="0.5" width="6" height="6" />
                  <rect x="7.5" y="0.5" width="4" height="4" />
                  <rect x="0.5" y="7.5" width="4" height="4" />
                  <rect x="5.5" y="7.5" width="6" height="4" />
                </svg>
              ) : (
                <svg aria-hidden width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor">
                  <path d="M0 2h12M0 6h12M0 10h12" />
                </svg>
              )}
              {t.work.views[v]}
            </button>
          ))}
        </div>
      </div>

      {view === 'gallery' ? (
        <ul ref={grid} className="mt-14 grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-12 lg:gap-x-8 lg:gap-y-20">
          {items.map((p, i) => {
            const r = RHYTHM[i % RHYTHM.length];
            const m = p.media[0];
            return (
              <li key={p.slug} className={`${r.span} min-w-0`}>
                <Link href={href(`/work/${p.slug}`)} className="group block">
                  <div data-card className={`frame grain relative ${r.ratio}`}>
                    <Image
                      src={m.id}
                      alt={m.alt}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 58vw"
                      className="object-cover transition-transform duration-[1.6s] ease-expo group-hover:scale-[1.05]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-night/70 via-transparent to-transparent opacity-60 transition-opacity duration-700 group-hover:opacity-100" />
                    <span className="display absolute right-4 top-2 text-[clamp(2.5rem,5vw,5rem)] leading-none text-bone/20">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    {p.media.length > 1 && (
                      <span className="label absolute left-4 top-4 border border-gold/50 bg-night/50 px-2 py-1 text-[0.6rem] text-gold backdrop-blur">
                        {p.media.length} ×
                      </span>
                    )}
                    <span className="label absolute bottom-4 left-4 translate-y-2 text-bone opacity-0 transition-[opacity,transform] duration-500 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:opacity-100">
                      {t.exteriors.view}
                    </span>
                  </div>
                  <div className="mt-5 flex items-start justify-between gap-6">
                    <div className="min-w-0">
                      <h2 className="display text-2xl leading-tight transition-colors duration-500 group-hover:text-gold md:text-3xl">{p.title}</h2>
                      <p className="label mt-2 text-bone/50">{p.location ?? p.label}</p>
                    </div>
                    <span className="label mt-2 shrink-0 text-gold/80">{p.categoryName ?? t.disciplines[p.discipline]}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <>
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
                  <span className="label col-start-2 text-gold/80 md:col-start-auto md:text-right">{p.categoryName ?? t.disciplines[p.discipline]}</span>
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
      )}
    </>
  );
}
