'use client';

import { useEffect, useRef, useState } from 'react';
import { useI18n } from '@/components/I18nProvider';
import { consultState } from './state';
import { useConsult, type ProjectType } from './ConsultProvider';

/**
 * The reminder on articles: offered once a visitor has shown real interest, never on arrival.
 *
 * When it appears (whichever comes first, never before 15 s on the page):
 *   - reading:   40 s of actual reading (tab visible, recent scroll or touch) and half the article
 *   - the end:   the visitor reaches the end of the article
 *   - leaving:   on desktop, the pointer heads for the tabs or address bar (after 20 s)
 * When it does not: after a request was sent (ever), for 7 days after "Not now" (30 after the
 * second time), more than once per visit, while the cookie banner, the form or the in-article
 * offer is on screen.
 * Desktop shows it bottom-left, clear of the sidebar's own offer; tablets and phones at the bottom.
 * After it was shown, scrolling on without using it folds it into a small "free call" tab, so
 * it never sits over the text. Everything runs in the browser: no server cost while reading.
 */
const READ_SECONDS = 40;
const MIN_SECONDS = 15;

export default function ConsultNudge({ title, projectType }: { title: string; projectType?: ProjectType }) {
  const { t } = useI18n();
  const c = t.consult;
  const { open, preload, isOpen } = useConsult();
  const [mode, setMode] = useState<'hidden' | 'card' | 'pill'>('hidden');
  const [entered, setEntered] = useState(false);
  const shownAtY = useRef(0);
  const modeRef = useRef(mode);
  modeRef.current = mode;

  const heading = projectType === 'interior' ? c.nudgeInterior : projectType === 'visualization' ? c.nudgeVisual : c.nudgeGeneral;

  useEffect(() => {
    if (consultState.submitted() || consultState.snoozed() || consultState.shownThisVisit()) return;
    const article = document.querySelector<HTMLElement>('[data-article]');
    if (!article) return;
    let seconds = 0;
    let lastActivity = Date.now();
    let done = false;

    const blocked = () =>
      !!document.getElementById('consent-title') ||
      [...document.querySelectorAll<HTMLElement>('[data-consult-inline]')].some((el) => {
        const r = el.getBoundingClientRect();
        return r.top < innerHeight && r.bottom > 0;
      });
    const progress = () => {
      const r = article.getBoundingClientRect();
      return Math.min(1, Math.max(0, (innerHeight - r.top) / Math.max(1, r.height)));
    };
    const show = () => {
      if (done || seconds < MIN_SECONDS || blocked()) return;
      done = true;
      consultState.markShown();
      shownAtY.current = scrollY;
      setMode('card');
      preload();
      requestAnimationFrame(() => requestAnimationFrame(() => setEntered(true)));
    };

    const activity = () => {
      lastActivity = Date.now();
    };
    const tick = setInterval(() => {
      if (document.visibilityState === 'visible' && Date.now() - lastActivity < 30_000) seconds++;
      const p = progress();
      if ((seconds >= READ_SECONDS && p >= 0.5) || (p >= 0.92 && seconds >= MIN_SECONDS)) show();
    }, 1000);
    const onLeave = (e: MouseEvent) => {
      if (!e.relatedTarget && e.clientY <= 0 && seconds >= 20 && matchMedia('(pointer: fine)').matches) show();
    };
    const onScroll = () => {
      activity();
      // Shown and ignored: fold it away once the visitor scrolls on by more than a screen.
      if (modeRef.current === 'card' && Math.abs(scrollY - shownAtY.current) > innerHeight * 1.2) setMode('pill');
    };
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('pointermove', activity, { passive: true });
    addEventListener('touchstart', activity, { passive: true });
    addEventListener('keydown', activity);
    document.addEventListener('mouseout', onLeave);
    return () => {
      clearInterval(tick);
      removeEventListener('scroll', onScroll);
      removeEventListener('pointermove', activity);
      removeEventListener('touchstart', activity);
      removeEventListener('keydown', activity);
      document.removeEventListener('mouseout', onLeave);
    };
  }, [preload]);

  // The form is open (from here or any other button): step aside.
  useEffect(() => {
    if (isOpen && mode === 'card') setMode('pill');
  }, [isOpen, mode]);

  if (mode === 'hidden' || (isOpen && mode === 'pill')) return null;

  const book = () => {
    open({ trigger: mode === 'pill' ? 'reminder-tab' : 'reminder', title, projectType });
  };

  if (mode === 'pill') {
    return (
      <div className="fixed bottom-4 right-4 z-[60] flex items-center sm:bottom-6 sm:right-6">
        <button
          type="button"
          onClick={book}
          onPointerEnter={preload}
          aria-haspopup="dialog"
          className="group flex min-h-[46px] items-center gap-2.5 border border-gold/40 bg-[#11100e]/95 py-2.5 pl-4 pr-5 text-[0.8rem] text-bone shadow-[0_18px_50px_-12px_rgba(0,0,0,0.85)] backdrop-blur-md transition-colors hover:border-gold hover:text-gold"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold/50 motion-reduce:animate-none" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
          </span>
          {c.sideTitle}
        </button>
        <button
          type="button"
          aria-label={c.close}
          onClick={() => {
            consultState.dismiss();
            setMode('hidden');
          }}
          className="grid h-[46px] w-10 place-items-center border border-l-0 border-gold/40 bg-[#11100e]/95 text-bone/50 backdrop-blur-md hover:text-gold"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <aside
      aria-label={c.nudgeEyebrow}
      className={`fixed inset-x-3 bottom-3 z-[60] border border-gold/30 bg-[#11100e]/[0.97] text-bone shadow-[0_30px_80px_-20px_rgba(0,0,0,0.95)] backdrop-blur-md transition-[transform,opacity] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[24rem] lg:left-6 lg:right-auto ${
        entered ? 'translate-y-0 opacity-100' : 'translate-y-[120%] opacity-0'
      }`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <span aria-hidden className={`absolute left-0 top-0 h-px bg-gold transition-[width] delay-300 duration-[1200ms] ease-out ${entered ? 'w-full' : 'w-0'}`} />
      <div className="flex gap-4 p-5 sm:p-6">
        {/* A small "30-minute" dial: the offer at a glance. */}
        <div aria-hidden className="relative hidden h-14 w-14 shrink-0 sm:block">
          <svg viewBox="0 0 56 56" className="h-14 w-14 -rotate-90 text-gold">
            <circle cx="28" cy="28" r="26" fill="none" stroke="currentColor" strokeOpacity="0.18" strokeWidth="1.2" />
            <circle cx="28" cy="28" r="26" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="163.4" strokeDashoffset={entered ? 81.7 : 163.4} className="transition-[stroke-dashoffset] delay-500 duration-[1400ms] ease-out" />
          </svg>
          <span className="absolute inset-0 grid place-items-center font-display text-xl leading-none text-gold">
            30<span className="sr-only">min</span>
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p className="label text-gold">{c.nudgeEyebrow}</p>
            <button
              type="button"
              aria-label={c.close}
              onClick={() => {
                consultState.dismiss();
                setEntered(false);
                setTimeout(() => setMode('hidden'), 500);
              }}
              className="-mr-2 -mt-2 grid h-9 w-9 shrink-0 place-items-center text-bone/45 hover:text-gold"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
          <p className="display mt-2 text-[1.35rem] leading-[1.15] sm:text-[1.5rem]">{heading}</p>
          <p className="mt-2 text-[0.88rem] leading-relaxed text-bone/65">{c.nudgeBody}</p>
          <div className="mt-4 flex items-center gap-4">
            <button type="button" onClick={book} aria-haspopup="dialog" className="btn btn-solid min-h-[44px] flex-1 px-5 py-3 sm:flex-none">
              {c.nudgeCta}
            </button>
            <button
              type="button"
              onClick={() => {
                consultState.dismiss();
                setEntered(false);
                setTimeout(() => setMode('hidden'), 500);
              }}
              className="text-xs text-bone/45 underline-offset-4 hover:text-bone hover:underline"
            >
              {c.nudgeLater}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
