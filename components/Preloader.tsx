'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { gsap } from '@/lib/gsap';
import { useDeviceTier } from '@/lib/device';
import { getDictionary } from '@/lib/i18n';
import { localeMeta, locales, localizePath, type Locale } from '@/lib/i18n/config';
import Logo from './Logo';
import { useI18n } from './I18nProvider';
import { LANG_CHOSEN_KEY, rememberLocale } from './LanguageSwitcher';

export const INTRO_EVENT = 'vari:intro-done';
const HANDOFF_KEY = 'vari-intro-handoff';

const PreloaderScene = dynamic(() => import('./three/PreloaderScene'), { ssr: false });

const STAGE_AT = [0, 0.3, 0.62, 0.9];
const DOORS_SHUT = 'polygon(evenodd, 0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, 0% 50%, 100% 50%, 100% 50%, 0% 50%, 0% 50%)';
const DOORS_OPEN = 'polygon(evenodd, 0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, 0% -1%, 100% -1%, 100% 101%, 0% 101%, 0% -1%)';

/**
 * Opening sequence (once per session).
 * 1. In the dark, gold pen strokes set out a grid; a villa rises line by line in 3D.
 * 2. The frame completes and the rooms light up; the VARI wordmark surfaces with a
 *    light sweep across its letterforms.
 * 3. First visit only: three doors — Welcome · Willkommen · Bienvenidos. Hovering one
 *    turns the camera toward it; choosing one sets the site language.
 * 4. The camera walks in through the glass and the screen parts like two doors.
 * Switching language mid-intro hands the sequence over to the new page, which resumes
 * at step 4. No-WebGL devices get the same story as a 2D line drawing.
 */
export default function Preloader() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const root = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const exit = useRef(0);
  const look = useRef(0);
  const [count, setCount] = useState(0);
  const [stage, setStage] = useState(0);
  const [active, setActive] = useState(true);
  const [done, setDone] = useState(false);
  const [gate, setGate] = useState(false);
  const skip = useRef<() => void>(() => undefined);
  const choose = useRef<(l: Locale) => void>(() => undefined);
  const tier = useDeviceTier();

  useEffect(() => {
    const finish = () => {
      document.documentElement.style.overflow = '';
      setDone(true);
      (window as unknown as { __variIntroDone?: boolean }).__variIntroDone = true;
      window.dispatchEvent(new Event(INTRO_EVENT));
    };

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let seen = false;
    let handoff = false;
    let chosen = false;
    try {
      handoff = sessionStorage.getItem(HANDOFF_KEY) === '1';
      sessionStorage.removeItem(HANDOFF_KEY);
      seen = sessionStorage.getItem('vari-intro') === '1';
      sessionStorage.setItem('vari-intro', '1');
      chosen = !!localStorage.getItem(LANG_CHOSEN_KEY);
    } catch {}

    if (!handoff && (reduced || seen)) {
      setActive(false);
      finish();
      return;
    }

    document.documentElement.style.overflow = 'hidden';
    const el = root.current!;
    const state = { p: handoff ? 1 : 0 };
    let timer: gsap.core.Tween | undefined;
    const loaded = new Promise<void>((resolve) => {
      if (document.readyState === 'complete') resolve();
      else window.addEventListener('load', () => resolve(), { once: true });
      window.setTimeout(resolve, 4000); // never hold the visitor hostage to a slow asset
    });

    const ctx = gsap.context(() => {
      // 2D fallback drawing (only rendered without WebGL)
      const paths = el.querySelectorAll<SVGPathElement>('[data-draw]');
      paths.forEach((p) => {
        const len = p.getTotalLength();
        p.style.strokeDasharray = `${len}`;
        p.style.strokeDashoffset = handoff ? '0' : `${len}`;
      });

      const update = () => {
        progress.current = state.p;
        setCount(Math.round(state.p * 96));
        let s = 0;
        STAGE_AT.forEach((at, i) => {
          if (state.p >= at) s = i;
        });
        setStage(s);
      };

      const build = gsap.timeline({ paused: handoff });
      build
        .fromTo('[data-chrome]', { opacity: 0 }, { opacity: 1, duration: 1, stagger: 0.1, ease: 'power2.out' }, 0)
        .to(state, { p: 1, duration: 3.1, ease: 'power1.inOut', onUpdate: update }, 0.15)
        .to(paths, { strokeDashoffset: 0, duration: 2.4, ease: 'power2.inOut', stagger: 0.06 }, 0.2)
        .fromTo('[data-bar]', { scaleX: 0 }, { scaleX: 0.96, duration: 3.1, ease: 'power1.inOut' }, 0.15)
        .fromTo(
          '[data-mark]',
          { opacity: 0, y: 24, scale: 0.94, filter: 'blur(12px)' },
          { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 1.6, ease: 'expo.out' },
          2.3,
        )
        .fromTo('[data-shine]', { backgroundPosition: '160% 0' }, { backgroundPosition: '-60% 0', duration: 1.8, ease: 'power2.inOut' }, 2.7)
        .fromTo('[data-tagline] span', { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.05, ease: 'power2.out' }, 2.9);
      if (handoff) {
        build.progress(1);
        update();
      }

      let leaving = false;
      const leave = (fast = false) => {
        if (leaving) return;
        leaving = true;
        if (fast) build.progress(1);
        const tail = { c: 96 };
        ctx.add(() => {
          gsap
            .timeline({ onComplete: finish })
            .to('[data-gate]', { opacity: 0, y: 20, duration: 0.5, ease: 'power2.in' })
            .to('[data-bar]', { scaleX: 1, duration: 0.4, ease: 'power2.out' }, '<')
            .to(tail, { c: 100, duration: 0.4, onUpdate: () => setCount(Math.round(tail.c)) }, '<')
            .to(look, { current: 0, duration: 0.8, ease: 'power2.inOut' }, '<')
            .to(exit, { current: 1, duration: 1.5, ease: 'power2.inOut' }, '+=0.2')
            .to('[data-mark]', { scale: 1.08, opacity: 0, filter: 'blur(8px)', duration: 0.9, ease: 'power3.in' }, '<')
            .to('[data-tagline]', { opacity: 0, y: -12, duration: 0.7, ease: 'power3.in' }, '<')
            .to('[data-chrome]', { opacity: 0, duration: 0.5 }, '<')
            .to('[data-drawing]', { opacity: 0, scale: 1.1, duration: 0.9, ease: 'power3.in' }, '<')
            .to('[data-seam]', { scaleX: 1, opacity: 1, duration: 0.6, ease: 'expo.out' }, '-=0.5')
            // The doors part: a hole opens along the seam and widens to the edges.
            .fromTo(el, { clipPath: DOORS_SHUT }, { clipPath: DOORS_OPEN, duration: 1.3, ease: 'expo.inOut' }, '-=0.1');
        });
      };

      const openGate = () => {
        setGate(true);
        // Wait one frame so the gate is in the DOM before animating it.
        requestAnimationFrame(() =>
          ctx.add(() => {
            gsap
              .timeline()
              .to('[data-mark]', { y: () => -Math.min(window.innerHeight * 0.17, 150), scale: 0.78, duration: 1.2, ease: 'expo.inOut' })
              .to('[data-tagline]', { opacity: 0, duration: 0.4 }, '<')
              .fromTo('[data-gate-title]', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power2.out' }, '-=0.6')
              .fromTo(
                '[data-door]',
                { clipPath: 'inset(100% 0% 0% 0%)', y: 30 },
                { clipPath: 'inset(0% 0% 0% 0%)', y: 0, duration: 1.2, stagger: 0.12, ease: 'expo.out' },
                '-=0.5',
              )
              .fromTo('[data-gate-hint]', { opacity: 0 }, { opacity: 1, duration: 0.8 }, '-=0.4');
          }),
        );
        // Move focus into the dialog (without highlighting a door) so Tab reaches the choices.
        window.setTimeout(() => el.querySelector<HTMLElement>('[data-gate-group]')?.focus({ preventScroll: true }), 1000);
      };

      choose.current = (l: Locale) => {
        rememberLocale(l);
        if (l === locale) return leave();
        // Hand the intro over to the page in the chosen language; it resumes at the fly-in.
        try {
          sessionStorage.setItem(HANDOFF_KEY, '1');
        } catch {}
        ctx.add(() => gsap.to('[data-gate]', { opacity: 0, duration: 0.4 }));
        router.replace(localizePath(l, '/'), { scroll: false });
      };
      skip.current = () => {
        if (!chosen) rememberLocale(locale);
        leave(true);
      };

      if (handoff) {
        timer = gsap.delayedCall(0.6, () => leave());
        return;
      }
      loaded.then(() => {
        if (leaving) return;
        timer = gsap.delayedCall(Math.max(0, 4.2 - build.time()), () => (chosen ? leave() : openGate()));
      });
    }, el);

    return () => {
      timer?.kill();
      ctx.revert();
      document.documentElement.style.overflow = '';
    };
  }, [locale, router]);

  if (done || !active) return null;

  const webgl = tier === 'high' || tier === 'low';
  const prompts = locales.map((l) => ({ l, text: getDictionary(l).language.choose }));

  return (
    <div
      ref={root}
      className="fixed inset-0 z-[90] overflow-hidden bg-night"
      style={{ clipPath: DOORS_SHUT }}
      role={gate ? 'dialog' : 'status'}
      aria-modal={gate || undefined}
      aria-live="polite"
      aria-label={gate ? t.language.choose : t.preloader.loading}
    >
      {/* Stage */}
      <div className="absolute inset-0">
        {webgl ? (
          <PreloaderScene progress={progress} exit={exit} look={look} />
        ) : tier === 'none' ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg data-drawing viewBox="0 0 600 400" className="w-[min(88vw,760px)] text-gold" fill="none" stroke="currentColor" strokeWidth="0.8" aria-hidden>
              <path data-draw d="M20 330 H580" />
              <path data-draw d="M300 40 V360" strokeOpacity="0.25" strokeDasharray="2 4" />
              <path data-draw d="M80 330 V110 M140 330 V140 M190 330 V164 M232 330 V182 M266 330 V196" />
              <path data-draw d="M520 330 V110 M460 330 V140 M410 330 V164 M368 330 V182 M334 330 V196" />
              <path data-draw d="M60 104 L300 200 L540 104" />
              <path data-draw d="M60 96 H540" />
              <path data-draw d="M282 210 H318 V262 H282 Z" />
              <path data-draw d="M80 330 L282 262 M520 330 L318 262" strokeOpacity="0.4" />
            </svg>
          </div>
        ) : null}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,transparent_35%,rgba(12,11,10,0.85)_100%)]" />
        <div className={`pointer-events-none absolute inset-0 bg-night/40 transition-opacity duration-1000 ${gate ? 'opacity-100' : 'opacity-0'}`} />
      </div>

      {/* Wordmark with a light sweep masked to the letterforms */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <div data-mark className="relative w-[min(58vw,320px)] opacity-0 [filter:drop-shadow(0_0_50px_rgba(212,175,55,0.25))]">
          {/* soft dark halo keeps the mark legible over the lit renders */}
          <span aria-hidden className="pointer-events-none absolute -inset-x-[45%] -inset-y-[70%] -z-10 bg-[radial-gradient(ellipse_at_center,rgba(12,11,10,0.78)_0%,rgba(12,11,10,0.45)_40%,transparent_70%)]" />
          <Logo priority sizes="320px" className="h-auto w-full" />
          <span
            data-shine
            aria-hidden
            className="absolute inset-0"
            style={{
              backgroundImage: 'linear-gradient(105deg, transparent 38%, rgba(255,248,226,0.95) 50%, transparent 62%)',
              backgroundSize: '250% 100%',
              backgroundPosition: '160% 0',
              WebkitMaskImage: 'url(/brand/vari-logo-light.png)',
              maskImage: 'url(/brand/vari-logo-light.png)',
              WebkitMaskSize: '100% 100%',
              maskSize: '100% 100%',
              mixBlendMode: 'overlay',
            }}
          />
        </div>
        <p data-tagline className="display-italic mt-8 px-6 text-center text-lg text-bone/80 md:text-2xl" aria-label={t.preloader.tagline}>
          {t.preloader.tagline.split(' ').map((w, i) => (
            <span key={i} aria-hidden className="inline-block opacity-0">
              {w}&nbsp;
            </span>
          ))}
        </p>
      </div>

      {/* Language gate */}
      {gate && (
        <div data-gate className="absolute inset-x-0 top-[47%] flex flex-col items-center px-[var(--gutter)] sm:top-1/2">
          <p data-gate-title className="label text-center text-[0.6rem] leading-relaxed text-bone/70 opacity-0 sm:text-xs">
            {prompts.map((g, i) => (
              <span key={g.l} lang={g.l} className="inline-block">
                {i > 0 && <span className="mx-2 text-gold/60 sm:mx-3">·</span>}
                {g.text}
              </span>
            ))}
          </p>
          <div className="mt-5 grid w-full max-w-[760px] grid-cols-1 gap-2 sm:mt-8 sm:grid-cols-3 sm:gap-4" role="group" aria-label={t.language.choose} data-gate-group tabIndex={-1} style={{ outline: 'none' }}>
            {locales.map((l, i) => (
              <button
                key={l}
                type="button"
                data-door={l}
                lang={l}
                onClick={() => choose.current(l)}
                onPointerEnter={() => (look.current = i - 1)}
                onFocus={() => (look.current = i - 1)}
                onPointerLeave={() => (look.current = 0)}
                aria-label={`${localeMeta[l].welcome} — ${localeMeta[l].name}`}
                className="group relative flex items-center justify-between gap-4 overflow-hidden border border-gold/30 bg-night/55 px-5 py-4 text-left backdrop-blur-md transition-[border-color,background-color] duration-500 hover:border-gold focus-visible:border-gold focus-visible:outline-none sm:aspect-[5/6] sm:flex-col sm:items-start sm:p-6"
                style={{ clipPath: 'inset(100% 0% 0% 0%)' }}
              >
                {/* light rising inside the door */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 origin-bottom scale-y-0 bg-gradient-to-t from-gold/25 via-gold/5 to-transparent transition-transform duration-700 ease-expo group-hover:scale-y-100 group-focus-visible:scale-y-100"
                />
                <span className="label relative shrink-0 text-gold/80">{String(i + 1).padStart(2, '0')}</span>
                <span className="display relative flex-1 text-[1.65rem] leading-none text-bone transition-colors duration-500 group-hover:text-gold group-focus-visible:text-gold sm:flex-none sm:text-[clamp(1.5rem,2.5vw,2.3rem)]">
                  {localeMeta[l].welcome}
                </span>
                <span className="relative flex shrink-0 items-center gap-3">
                  <span className="label text-bone/70">
                    <span className="sm:hidden">{localeMeta[l].short}</span>
                    <span className="hidden sm:inline">{localeMeta[l].name}</span>
                  </span>
                  <span aria-hidden className="block h-px w-6 bg-gold transition-[width] duration-700 ease-expo group-hover:w-12 group-focus-visible:w-12" />
                </span>
              </button>
            ))}
          </div>
          <p data-gate-hint className="mt-5 text-center text-xs text-bone/40 opacity-0">
            {t.language.hint}
          </p>
        </div>
      )}

      {/* Drafting chrome: corner marks, stage, counter, progress */}
      <div aria-hidden className="pointer-events-none absolute inset-4 md:inset-8">
        {['left-0 top-0 border-l border-t', 'right-0 top-0 border-r border-t', 'left-0 bottom-0 border-l border-b', 'right-0 bottom-0 border-r border-b'].map((c) => (
          <span key={c} data-chrome className={`absolute h-6 w-6 border-gold/50 opacity-0 ${c}`} />
        ))}
      </div>

      <div data-chrome className="absolute left-[var(--gutter)] top-8 opacity-0 md:top-12">
        <p className="label text-gold">VARI Studio</p>
        <p className="label mt-2 text-bone/40">{t.preloader.disciplines}</p>
      </div>

      <button
        type="button"
        data-chrome
        onClick={() => skip.current()}
        className="label link-line absolute right-[var(--gutter)] top-8 text-bone/50 opacity-0 transition-colors hover:text-gold md:top-12"
      >
        {t.preloader.skip}
      </button>

      <div data-chrome className={`absolute inset-x-[var(--gutter)] bottom-8 opacity-0 transition-[visibility] md:bottom-12 ${gate ? 'max-sm:invisible' : ''}`}>
        <div className="flex items-end justify-between gap-6">
          <p className="label min-h-[1em] text-bone/60">
            <span className="mr-3 text-gold">{String(stage + 1).padStart(2, '0')}</span>
            <span key={stage} className="inline-block animate-[fadein_0.6s_ease-out]">
              {t.preloader.stages[stage]}
            </span>
          </p>
          <span className="display text-5xl leading-none tabular-nums text-gold md:text-7xl">{String(count).padStart(3, '0')}</span>
        </div>
        <span className="mt-4 block h-px w-full bg-bone/10">
          <span data-bar className="block h-px w-full origin-left scale-x-0 bg-gold" />
        </span>
      </div>

      {/* The seam the doors open along */}
      <span data-seam aria-hidden className="absolute inset-x-0 top-1/2 h-px origin-center scale-x-0 bg-gold opacity-0 shadow-[0_0_24px_2px_rgba(212,175,55,0.6)]" />
    </div>
  );
}
