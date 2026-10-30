'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { useDeviceTier, useIsMobile } from '@/lib/device';
import { fmt } from '@/lib/i18n';
import { useI18n } from '../I18nProvider';
import RevealText from '../RevealText';
import { useLenis } from '../SmoothScroll';

type Drawing = 'product' | 'tour' | 'interior' | 'design' | 'walk' | 'bim' | 'render' | 'draft';

/** Line drawings in the language of a construction set — one per service. */
function ServiceDrawing({ kind }: { kind: Drawing }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1 };
  const paths: Record<Drawing, string[]> = {
    product: ['M100 40 L160 72 L160 140 L100 172 L40 140 L40 72 Z', 'M40 72 L100 104 L160 72', 'M100 104 V172', 'M70 56 L130 88 M130 56 L70 88'],
    tour: ['M20 160 L100 120 L180 160', 'M60 140 V60 L100 40 L140 60 V140', 'M100 40 V120', 'M84 150 Q100 132 116 150', 'M100 150 m-6 0 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0'],
    interior: ['M30 40 H170 V170 H30 Z', 'M30 40 L70 80 H130 L170 40', 'M70 80 V140 H130 V80', 'M30 170 L70 140 M170 170 L130 140', 'M86 140 V112 H114 V140'],
    design: ['M100 30 V170', 'M30 100 H170', 'M100 100 m-56 0 a56 56 0 1 0 112 0 a56 56 0 1 0 -112 0', 'M100 30 L60 170 M100 30 L140 170', 'M72 128 H128'],
    walk: ['M20 170 L80 110 L120 110 L180 50', 'M80 110 V170 M120 110 V170', 'M150 50 H180 V80', 'M40 60 m-14 0 a14 14 0 1 0 28 0 a14 14 0 1 0 -28 0', 'M36 54 L48 60 L36 66 Z'],
    bim: ['M40 150 L100 120 L160 150 L100 180 Z', 'M40 120 L100 90 L160 120 L100 150 Z', 'M40 90 L100 60 L160 90 L100 120 Z', 'M40 60 L100 30 L160 60 L100 90 Z', 'M40 60 V150 M160 60 V150 M100 90 V180'],
    render: ['M100 100 m-34 0 a34 34 0 1 0 68 0 a34 34 0 1 0 -68 0', 'M100 30 V50 M100 150 V170 M30 100 H50 M150 100 H170', 'M50 50 L64 64 M136 136 L150 150 M150 50 L136 64 M64 136 L50 150', 'M84 100 L100 84 L116 100 L100 116 Z'],
    draft: ['M30 40 H170 V170 H30 Z', 'M30 100 H110 V170', 'M110 40 V70', 'M110 100 H170', 'M140 100 V130 M140 150 V170', 'M30 30 H170 M30 26 V34 M170 26 V34', 'M180 40 V170 M176 40 H184 M176 170 H184'],
  };
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full" aria-hidden>
      {paths[kind].map((d, i) => (
        <path key={i} d={d} data-line {...common} />
      ))}
    </svg>
  );
}

const ServicesModel = dynamic(() => import('../three/ServicesModel'), { ssr: false });


/**
 * "Unleashing the Power of 3D Visualization".
 * One live architectural model shows each service: hover / focus a service (or, on
 * touch, scroll it into the middle of the screen) and the model transforms — object
 * study, walk-in, cut-away, exploded BIM layers, night render, back to the 2D plan.
 */
const DESIGN_DRAWINGS = ['interior', 'design', 'draft'];
/** The live model's poses, by service key; services added in the panel show the full building. */
const MODEL_STATE: Record<string, number> = { product: 0, tour: 1, interior: 2, design: 3, walk: 4, bim: 5, render: 6, draft: 7 };
const DRAWINGS = ['product', 'tour', 'interior', 'design', 'walk', 'bim', 'render', 'draft'] as const;

export default function Services({ standalone = false }: { standalone?: boolean }) {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(3);
  const activeRef = useRef(3);
  const tier = useDeviceTier();
  const { t, href, services } = useI18n();
  const modelState = useRef(3);
  const plate = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const lenis = useLenis();
  // Desktop: the section holds while scroll walks through the eight services.
  const desk = useIsMobile('(min-width: 1024px) and (min-height: 600px)');

  // Stable selector for scroll/observer callbacks; reads the CMS list through a ref.
  const servicesRef = useRef(services);
  servicesRef.current = services;
  const select = useCallback((i: number) => {
    activeRef.current = i;
    modelState.current = MODEL_STATE[servicesRef.current[i]?.key] ?? 3;
    setActive(i);
  }, []);

  // Static fallback plate (no WebGL / reduced motion): draw the sheet's lines.
  useEffect(() => {
    const el = plate.current;
    if (!el) return;
    const lines = el.querySelectorAll<SVGPathElement>('[data-line]');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    lines.forEach((p) => {
      const len = p.getTotalLength();
      p.style.strokeDasharray = `${len}`;
      p.style.strokeDashoffset = reduce ? '0' : `${len}`;
    });
    if (reduce) return;
    const t = gsap.to(lines, { strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut', stagger: 0.08 });
    return () => {
      t.kill();
    };
  }, [active, tier]);

  useEffect(() => {
    const el = root.current!;
    const ctx = gsap.context(() => {
      gsap.fromTo('[data-row]', { opacity: 0, y: 30 }, { opacity: 1, y: 0, stagger: 0.07, duration: 1.2, scrollTrigger: { trigger: '[data-rows]', start: 'top 85%', once: true } });
      if (window.matchMedia('(hover: none)').matches) {
        gsap.utils.toArray<HTMLElement>('[data-row]').forEach((row, i) => {
          ScrollTrigger.create({ trigger: row, start: 'top 70%', end: 'bottom 70%', onEnter: () => select(i), onEnterBack: () => select(i) });
        });
      }
    }, el);
    return () => ctx.revert();
  }, [desk, select]);

  // Desktop: map the pinned scroll distance onto the services, one step per service.
  useEffect(() => {
    const tr = track.current;
    if (!desk || !tr) return;
    const steps = servicesRef.current.length;
    // The sequence starts at the first service (the mobile layout defaults to the full building).
    if (window.scrollY < tr.getBoundingClientRect().top + window.scrollY) select(0);
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: tr,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => {
          const i = Math.min(steps - 1, Math.floor(self.progress * steps));
          if (i !== activeRef.current) select(i);
        },
      });
      gsap.fromTo('[data-svc-rail]', { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: tr, start: 'top top', end: 'bottom bottom', scrub: true } });
    }, tr);
    // The desktop layout is taller than the server-rendered one: re-measure everything below.
    const raf = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => {
      cancelAnimationFrame(raf);
      ctx.revert();
    };
  }, [desk, select]);

  /** Desktop: clicking a service scrolls to its point in the sequence. */
  const goTo = (i: number) => {
    const tr = track.current;
    if (!tr) return select(i);
    const top = tr.getBoundingClientRect().top + window.scrollY;
    const range = tr.offsetHeight - window.innerHeight;
    const y = top + ((i + 0.5) / services.length) * range;
    if (lenis) lenis.scrollTo(y, { duration: 1.2 });
    else window.scrollTo({ top: y, behavior: 'smooth' });
  };

  if (!services.length) return null;
  const svc = services[active] ?? services[0];
  const drawing: Drawing = (DRAWINGS as readonly string[]).includes(svc?.key) ? (svc.key as Drawing) : 'design';
  const current = { drawing, title: svc?.title ?? '', body: svc?.body ?? '' };
  const live = tier === 'high' || tier === 'low';

  const Stage = (
    <div className="relative h-full w-full overflow-hidden border border-gold/25 bg-night/80">
      {live ? (
        <ServicesModel active={modelState} tier={tier} />
      ) : (
        <div ref={plate} key={current.drawing} className="h-full w-full p-10 text-gold">
          <ServiceDrawing kind={current.drawing} />
        </div>
      )}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between bg-gradient-to-b from-night/85 to-transparent p-4 pb-10">
        <span className="label text-gold">{t.services.sheet} {String(active + 1).padStart(2, '0')} / {String(services.length).padStart(2, '0')}</span>
        <span className="label hidden text-bone/40 sm:block">{t.services.live}</span>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-night via-night/70 to-transparent p-4 pt-10">
        <p className="label text-bone/80">{current.title}</p>
        <p className="mt-1 text-xs text-bone/50 sm:text-sm">{t.services.notes[active]}</p>
      </div>
    </div>
  );

  const cta = (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
      <Link href={href(`/contact?intent=${DESIGN_DRAWINGS.includes(current.drawing) ? 'design' : 'visualize'}`)} className="btn btn-solid">
        <span>{fmt(t.services.discuss, { service: current.title })}</span>
      </Link>
      {!standalone && (
        <Link href={href('/services')} className="label link-line text-gold">
          {t.services.all}
        </Link>
      )}
    </div>
  );

  if (desk) {
    return (
      <section ref={root} id="services" aria-labelledby="services-title" className="blueprint relative border-y border-gold/10">
        {/* The track gives each service ~half a screen of scroll; the frame inside stays put. */}
        <div ref={track} className="relative" style={{ height: `calc(100svh + ${services.length} * 50svh)` }}>
          <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden pb-[3svh] pt-[calc(var(--header-h)+2svh)]">
            <div className="wrap grid w-full grid-cols-12 items-center gap-10 xl:gap-16">
              <div className="col-span-6">
                <p className="label text-gold">{standalone ? t.services.sheets : t.services.chapter}</p>
                <RevealText
                  as="h2"
                  text={t.services.title}
                  className="display mt-[1.6svh] max-w-[18ch] text-[clamp(2rem,3.4svh+1.2vw,3.6rem)] leading-[1.02]"
                  italic={t.services.italic}
                />
                <div className="relative mt-[3svh] pl-6">
                  {/* progress rail */}
                  <span aria-hidden className="absolute bottom-0 left-0 top-0 w-px bg-bone/10" />
                  <span aria-hidden data-svc-rail className="absolute left-0 top-0 h-full w-px origin-top scale-y-0 bg-gold" />
                  <ol aria-label={t.services.listAria}>
                    {t.services.items.map((s, i) => (
                      <li key={services[i]?.key ?? i}>
                        <button
                          type="button"
                          onClick={() => goTo(i)}
                          aria-current={active === i ? 'step' : undefined}
                          className={`group grid w-full grid-cols-[2.6rem_1fr] items-baseline gap-x-2 border-b border-bone/10 py-[clamp(0.3rem,1.05svh,0.85rem)] text-left transition-colors duration-500 ${
                            active === i ? 'text-bone' : 'text-bone/40 hover:text-bone/75'
                          }`}
                        >
                          <span className={`label transition-colors ${active === i ? 'text-gold' : ''}`}>{String(i + 1).padStart(2, '0')}</span>
                          <span className="display text-[clamp(1.15rem,2.55svh,2rem)] leading-tight">
                            <span className={`inline-block transition-transform duration-700 ease-expo ${active === i ? 'translate-x-2' : ''}`}>{s.title}</span>
                          </span>
                          <span className={`col-start-2 grid transition-[grid-template-rows,opacity] duration-700 ease-expo ${active === i ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                            <span className="overflow-hidden">
                              <span className="block pl-2 pt-1 text-[clamp(0.85rem,1.7svh,1.05rem)] text-bone/65">{s.body}</span>
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ol>
                </div>
                <div className="mt-[3svh]">{cta}</div>
              </div>
              <div className="col-span-6 h-[min(74svh,760px)]">{Stage}</div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={root} id="services" aria-labelledby="services-title" className="blueprint relative scroll-mt-20 border-y border-gold/10 py-24 md:py-40">
      <div className="wrap">
        <div className="mb-12 grid gap-6 md:mb-24 md:grid-cols-12 md:gap-8">
          <p className="label text-gold md:col-span-3">{standalone ? t.services.sheets : t.services.chapter}</p>
          <div className="md:col-span-9">
            <RevealText as="h2" text={t.services.title} className="display h-xl max-w-[16ch]" italic={t.services.italic} />
          </div>
        </div>

        {/* Mobile: the model docks under the header while the list scrolls */}
        <div className="sticky top-[calc(var(--header-h)-8px)] z-10 -mx-[var(--gutter)] mb-6 h-[34svh] px-[var(--gutter)] md:hidden">{Stage}</div>

        <div className="grid gap-12 md:grid-cols-12">
          <ol data-rows className="md:col-span-6 lg:col-span-7" aria-label={t.services.listAria}>
            {t.services.items.map((s, i) => (
              <li key={services[i]?.key ?? i} data-row>
                <button
                  type="button"
                  onMouseEnter={() => select(i)}
                  onFocus={() => select(i)}
                  onClick={() => select(i)}
                  aria-pressed={active === i}
                  className={`group grid w-full grid-cols-[2.5rem_1fr] items-baseline gap-x-3 border-b border-bone/10 py-5 text-left transition-colors duration-500 md:grid-cols-[4rem_1fr] md:py-7 ${
                    active === i ? 'text-bone' : 'text-bone/45 hover:text-bone/80'
                  }`}
                >
                  <span className={`label transition-colors ${active === i ? 'text-gold' : ''}`}>{String(i + 1).padStart(2, '0')}</span>
                  <span className="display text-[1.55rem] leading-tight sm:text-[2rem] lg:text-[2.6rem]">
                    <span className={`inline-block transition-transform duration-700 ease-expo ${active === i ? 'md:translate-x-3' : ''}`}>{s.title}</span>
                  </span>
                  <span className={`col-start-2 grid transition-[grid-template-rows,opacity] duration-700 ease-expo ${active === i ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <span className="overflow-hidden">
                      <span className="block pt-3 text-base text-bone/70 md:pl-3 md:text-lg">{s.body}</span>
                    </span>
                  </span>
                </button>
              </li>
            ))}
            <li className="pt-8">{cta}</li>
          </ol>

          <div className="hidden md:col-span-6 md:block lg:col-span-5">
            <div className="sticky top-28 aspect-[4/5] w-full">{Stage}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
