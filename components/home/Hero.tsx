'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { useDeviceTier } from '@/lib/device';
import { copy, projects } from '@/lib/content';
import RevealText from '../RevealText';
import { INTRO_EVENT } from '../Preloader';

const HeroTiles = dynamic(() => import('../three/HeroTiles'), { ssr: false });

const feature = projects.find((p) => p.slug === 'the-urban-nest')!;
const featureMedia = feature.media[0];

export default function Hero() {
  const section = useRef<HTMLElement>(null);
  const progress = useRef(0);
  const [started, setStarted] = useState(false);
  const tier = useDeviceTier();

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
        onUpdate: (self) => (progress.current = self.progress),
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
      // Static fallback composition gets a slow push-in instead of the 3D dolly.
      gsap.to('[data-hero-still]', {
        scale: 1.18,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top top', end: 'bottom bottom', scrub: true },
      });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={section} className="relative h-[240vh] md:h-[260vh]" aria-label="Introduction">
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
        {/* Stage: real-time 3D for capable devices, a still render otherwise */}
        <div className="absolute inset-0">
          {tier === 'none' || tier === null ? (
            <div className="absolute inset-0 overflow-hidden">
              <Image
                data-hero-still
                src={featureMedia.id}
                alt=""
                fill
                priority
                sizes="100vw"
                className="object-cover opacity-70"
              />
            </div>
          ) : (
            <HeroTiles progress={progress} started={started} tier={tier} imageId={featureMedia.id} imageAspect={featureMedia.width / featureMedia.height} />
          )}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(12,11,10,0.75)_100%)]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-night to-transparent" />
        </div>

        {/* Headline */}
        <div data-hero-copy className="wrap relative flex h-full flex-col justify-end pb-[max(9vh,4.5rem)] pt-[calc(var(--header-h)+1.5rem)]">
          <p className="label mb-5 text-gold md:mb-7">Architecture · Interior Design · 3D Visualization</p>
          <RevealText
            as="h1"
            trigger="event"
            eventName={INTRO_EVENT}
            className="display h-hero max-w-[16ch] text-bone [text-shadow:0_4px_40px_rgba(12,11,10,0.55)]"
            text={`Where Elegant ${copy.hero.italicWord}\nMeet Elemental Harmony`}
            italic={[copy.hero.italicWord]}
          />
          <div className={`mt-8 flex flex-wrap gap-3 sm:gap-4 md:mt-10 transition-[opacity,transform] delay-700 duration-1000 ease-expo ${started ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}>
            <Link href="/contact?intent=design" className="btn">
              <span>{copy.hero.ctaDesign}</span>
            </Link>
            <Link href="/contact?intent=visualize" className="btn btn-solid">
              <span>{copy.hero.ctaVisualize}</span>
            </Link>
          </div>
        </div>

        {/* Arrival caption once the camera reaches the render */}
        <Link
          href={`/work/${feature.slug}`}
          data-hero-caption
          className="absolute bottom-8 left-[var(--gutter)] right-[var(--gutter)] flex items-end justify-between gap-6 opacity-0"
        >
          <span>
            <span className="label block text-gold">On the façade · {feature.discipline}</span>
            <span className="display h-md mt-2 block">
              {feature.title} — {feature.location}
            </span>
          </span>
          <span className="label link-line hidden text-bone/70 sm:block">Enter project</span>
        </Link>

        {/* Scroll cue */}
        <div className={`pointer-events-none absolute bottom-8 right-[var(--gutter)] flex flex-col items-center gap-3 transition-opacity duration-1000 ${started ? 'opacity-100' : 'opacity-0'}`} data-hero-copy>
          <span className="label [writing-mode:vertical-rl] text-bone/50">Scroll to enter</span>
          <span className="relative block h-16 w-px overflow-hidden bg-bone/15">
            <span className="absolute inset-x-0 top-0 h-1/2 animate-[scrollcue_2.2s_cubic-bezier(0.83,0,0.17,1)_infinite] bg-gold" />
          </span>
        </div>
      </div>
    </section>
  );
}
