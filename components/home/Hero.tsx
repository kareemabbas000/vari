'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { useDeviceTier } from '@/lib/device';
import { useI18n } from '../I18nProvider';
import RevealText from '../RevealText';
import { INTRO_EVENT } from '../Preloader';

const HeroTiles = dynamic(() => import('../three/HeroTiles'), { ssr: false });

export default function Hero() {
  const section = useRef<HTMLElement>(null);
  const progress = useRef(0);
  const [started, setStarted] = useState(false);
  const [live, setLive] = useState(true);
  const tier = useDeviceTier();
  const { t, href, projects } = useI18n();
  // The Urban Nest by default; falls back to a featured exterior if it was removed in the panel.
  const feature =
    projects.find((p) => p.slug === 'the-urban-nest') ??
    projects.find((p) => p.featured && p.category === 'exterior') ??
    projects.find((p) => p.category === 'exterior') ??
    projects[0];
  const featureMedia = feature.media[0];

  useEffect(() => {
    const go = () => setStarted(true);
    if ((window as unknown as { __variIntroDone?: boolean }).__variIntroDone) go();
    else window.addEventListener(INTRO_EVENT, go, { once: true });
    return () => window.removeEventListener(INTRO_EVENT, go);
  }, []);

  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: el,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        onUpdate: (self) => {
          progress.current = self.progress;
          // The 3D façade is fully dispersed past ~80%: stop rendering it.
          const next = self.progress < 0.82;
          setLive((prev) => (prev === next ? prev : next));
        },
      });

      // Headline drifts back into the space as the camera moves in.
      gsap.to('[data-hero-copy]', {
        opacity: 0,
        y: -80,
        scale: 0.94,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top top', end: '30% top', scrub: true },
      });
      gsap.fromTo(
        '[data-hero-caption]',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, ease: 'none', scrollTrigger: { trigger: el, start: '55% bottom', end: '75% bottom', scrub: true } },
      );
      // As the façade disperses, the finished render resolves behind it — the scroll ends
      // on the real building (where the caption belongs), never on an empty screen.
      // Positions are fractions of the hero's whole scroll (top top → bottom bottom).
      gsap
        .timeline({ scrollTrigger: { trigger: el, start: 'top top', end: 'bottom bottom', scrub: true } })
        .fromTo('[data-hero-resolve]', { opacity: 0, scale: 1.12 }, { opacity: 1, scale: 1, duration: 0.35, ease: 'none' }, 0.22)
        .fromTo('[data-hero-canvas]', { opacity: 1 }, { opacity: 0, duration: 0.3, ease: 'none' }, 0.38)
        .set({}, {}, 1);
      // Static fallback composition gets a slow push-in instead of the 3D dolly.
      gsap.to('[data-hero-still]', {
        scale: 1.18,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top top', end: 'bottom bottom', scrub: true },
      });
    }, el);
    return () => ctx.revert();
  }, [tier]);

  return (
    <section ref={section} className="relative h-[240vh] md:h-[260vh]" aria-label={t.hero.aria}>
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
        {/* Stage: real-time 3D for capable devices, a still render otherwise */}
        <div className="absolute inset-0">
          {tier === 'none' || tier === null ? (
            <div className="absolute inset-0 overflow-hidden">
              <Image
                data-hero-still
                src={featureMedia.id}
                alt={featureMedia.alt}
                fill
                priority
                sizes="100vw"
                className="object-cover opacity-70"
              />
            </div>
          ) : (
            <>
              <div data-hero-resolve className="absolute inset-0 opacity-0">
                <Image src={featureMedia.id} alt={featureMedia.alt} fill sizes="100vw" className="object-cover" />
              </div>
              <div data-hero-canvas className="absolute inset-0">
                <HeroTiles
                  progress={progress}
                  started={started}
                  tier={tier}
                  imageId={featureMedia.id}
                  imageAspect={featureMedia.width / featureMedia.height}
                  live={live}
                />
              </div>
            </>
          )}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(12,11,10,0.75)_100%)]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-night to-transparent" />
        </div>

        {/* Legibility veil: a soft, directional shade behind the copy only (fades with it), so the
            gold and light type read on any image without dimming the whole render. */}
        <div data-hero-copy aria-hidden className="hero-veil pointer-events-none absolute inset-0" />

        {/* Headline */}
        <div data-hero-copy className="wrap relative flex h-full flex-col justify-center pb-[max(11vh,5rem)] pt-[calc(var(--header-h)+2vh)]">
          <p className="hero-eyebrow label mb-5 self-start text-gold md:mb-7">{t.hero.label}</p>
          <RevealText
            as="h1"
            trigger="event"
            eventName={INTRO_EVENT}
            className="display h-hero max-w-[16ch] text-bone [text-shadow:0_2px_24px_rgba(12,11,10,0.45),0_4px_60px_rgba(12,11,10,0.35)]"
            text={`${t.hero.line1}\n${t.hero.line2}`}
            italic={t.hero.italic}
          />
          <div className={`mt-8 flex flex-wrap gap-3 sm:gap-4 md:mt-10 transition-[opacity,transform] delay-700 duration-1000 ease-expo ${started ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}>
            <Link href={href('/contact?intent=design')} className="btn btn-glass">
              <span>{t.hero.ctaDesign}</span>
            </Link>
            <Link href={href('/contact?intent=visualize')} className="btn btn-solid">
              <span>{t.hero.ctaVisualize}</span>
            </Link>
          </div>
        </div>

        {/* Arrival caption once the camera reaches the render */}
        <Link
          href={href(`/work/${feature.slug}`)}
          data-hero-caption
          className="absolute bottom-8 left-[var(--gutter)] right-[var(--gutter)] flex items-end justify-between gap-6 opacity-0"
        >
          <span>
            <span className="label block text-gold">{t.hero.caption} · {feature.categoryName ?? t.disciplines[feature.discipline]}</span>
            <span className="display h-md mt-2 block">
              {feature.title} — {feature.location}
            </span>
          </span>
          <span className="label link-line hidden text-bone/70 sm:block">{t.hero.enter}</span>
        </Link>

        {/* Scroll cue */}
        <div className={`pointer-events-none absolute bottom-8 right-[var(--gutter)] flex flex-col items-center gap-3 transition-opacity duration-1000 ${started ? 'opacity-100' : 'opacity-0'}`} data-hero-copy>
          <span className="label [writing-mode:vertical-rl] text-bone/50">{t.hero.scroll}</span>
          <span className="relative block h-16 w-px overflow-hidden bg-bone/15">
            <span className="absolute inset-x-0 top-0 h-1/2 animate-[scrollcue_2.2s_cubic-bezier(0.83,0,0.17,1)_infinite] bg-gold" />
          </span>
        </div>
      </div>
    </section>
  );
}
