'use client';

import { createElement, useEffect, useRef, type ElementType } from 'react';
import { gsap } from '@/lib/gsap';

type Props = {
  text: string;
  as?: ElementType;
  className?: string;
  /** Words rendered in the italic display cut, like the original "Spaces" / "Welcome". */
  italic?: string[];
  delay?: number;
  /** Animate when scrolled into view (default) or immediately on mount. */
  trigger?: 'scroll' | 'mount' | 'event';
  eventName?: string;
  gold?: string[];
};

/** Word-by-word masked reveal. Text stays real, selectable and readable without JS. */
export default function RevealText({ text, as = 'h2', className = '', italic = [], gold = [], delay = 0, trigger = 'scroll', eventName }: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const words = el.querySelectorAll<HTMLElement>('.line-inner');
    gsap.set(words, { yPercent: 115, rotate: 4 });

    const play = () => gsap.to(words, { yPercent: 0, rotate: 0, duration: 1.4, ease: 'expo.out', stagger: 0.05, delay });

    if (trigger === 'mount') {
      const t = play();
      return () => {
        t.kill();
      };
    }
    if (trigger === 'event' && eventName) {
      if ((window as unknown as { __variIntroDone?: boolean }).__variIntroDone) play();
      else window.addEventListener(eventName, play, { once: true });
      return () => window.removeEventListener(eventName, play);
    }
    const ctx = gsap.context(() => {
      gsap.to(words, {
        yPercent: 0,
        rotate: 0,
        duration: 1.4,
        stagger: 0.05,
        delay,
        scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      });
    }, el);
    return () => ctx.revert();
  }, [delay, trigger, eventName]);

  const parts = text.split(/(\n)/);
  return createElement(
    as,
    { ref, className, 'aria-label': text.replace(/\n/g, ' ') },
    parts.map((part, i) =>
      part === '\n' ? (
        <br key={i} />
      ) : (
        part
          .split(' ')
          .filter(Boolean)
          .map((w, j) => {
            const bare = w.replace(/[^\p{L}\p{N}'-]/gu, '');
            const cls = italic.includes(bare) ? 'display-italic' : gold.includes(bare) ? 'gold-text' : '';
            return (
              <span key={`${i}-${j}`} className="line-mask inline-block align-top" style={{ marginRight: '0.14em' }} aria-hidden>
                <span className={`line-inner ${cls}`}>{w}</span>
              </span>
            );
          })
      ),
    ),
  );
}
