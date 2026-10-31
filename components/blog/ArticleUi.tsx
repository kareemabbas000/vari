'use client';

import { useEffect, useState } from 'react';
import type { TocItem } from '@/lib/blog-html';

/** Thin gold bar showing how far the reader is. */
export function ReadingProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const on = () => {
      const el = document.querySelector('[data-article]');
      if (!el) return;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight * 0.6;
      setP(Math.min(1, Math.max(0, -r.top / Math.max(1, total))));
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => {
      window.removeEventListener('scroll', on);
      window.removeEventListener('resize', on);
    };
  }, []);
  return <div aria-hidden className="fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-gold" style={{ transform: `scaleX(${p})` }} />;
}

/** Table of contents that follows the reader. */
export function Toc({ items, title }: { items: TocItem[]; title: string }) {
  const [active, setActive] = useState(items[0]?.id);
  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver((entries) => {
      const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]) setActive(visible[0].target.id);
    }, { rootMargin: '-15% 0px -70% 0px' });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [items]);
  if (items.length < 2) return null;
  return (
    <nav aria-label={title}>
      <p className="label mb-5 text-gold">{title}</p>
      <ol className="space-y-1 border-l border-bone/10">
        {items.map((i) => (
          <li key={i.id}>
            <a
              href={`#${i.id}`}
              aria-current={active === i.id ? 'true' : undefined}
              className={`-ml-px block border-l py-1.5 text-[0.85rem] leading-snug transition-colors ${i.level === 3 ? 'pl-7' : 'pl-4'} ${active === i.id ? 'border-gold text-bone' : 'border-transparent text-bone/45 hover:text-bone/80'}`}
            >
              {i.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

const ICONS: Record<string, string> = {
  linkedin: 'M4 9h3v11H4zM5.5 4a1.8 1.8 0 110 3.6 1.8 1.8 0 010-3.6zM10 9h3v1.6c.5-.9 1.7-1.9 3.5-1.9 3.6 0 4.3 2.4 4.3 5.4V20h-3v-5.2c0-1.3 0-2.9-1.8-2.9s-2 1.4-2 2.8V20h-3z',
  x: 'M4 4l7.2 9.6L4.3 20H6l6-5.4 4.2 5.4H20l-7.5-10L19 4h-1.7l-5.5 4.9L8 4z',
  facebook: 'M14 8h3V4h-3c-2.8 0-4 1.8-4 4.3V10H7v4h3v7h4v-7h3l.5-4H14V8.6c0-.4.2-.6.6-.6z',
  whatsapp: 'M12 3a9 9 0 00-7.8 13.5L3 21l4.6-1.2A9 9 0 1012 3zm4.6 12.4c-.2.6-1.2 1.1-1.7 1.2-.4 0-.9.2-3-.6-2.5-1-4.1-3.6-4.2-3.8-.1-.2-1-1.3-1-2.5s.6-1.8.9-2.1c.2-.2.5-.3.6-.3h.5c.2 0 .4 0 .6.5l.8 1.9c.1.2.1.3 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.2.3.7 1.2 1.6 1.9 1.1.9 2 1.2 2.3 1.4.3.1.5.1.6-.1l.8-1c.2-.2.4-.2.6-.1l1.8.9c.3.1.4.2.5.3 0 .2 0 .8-.1 1.4z',
  email: 'M3 6h18v12H3zM3 7l9 7 9-7',
};

export function ShareBar({ url, title, labels }: { url: string; title: string; labels: { share: string; copy: string; copied: string } }) {
  const [copied, setCopied] = useState(false);
  const u = encodeURIComponent(url);
  const tt = encodeURIComponent(title);
  const links: [string, string][] = [
    ['linkedin', `https://www.linkedin.com/sharing/share-offsite/?url=${u}`],
    ['x', `https://twitter.com/intent/tweet?url=${u}&text=${tt}`],
    ['facebook', `https://www.facebook.com/sharer/sharer.php?u=${u}`],
    ['whatsapp', `https://wa.me/?text=${tt}%20${u}`],
    ['email', `mailto:?subject=${tt}&body=${u}`],
  ];
  return (
    <div className="flex flex-wrap items-center gap-2 lg:flex-col lg:items-start">
      <p className="label mr-2 text-bone/45 lg:mb-2 lg:mr-0">{labels.share}</p>
      {links.map(([k, href]) => (
        <a key={k} href={href} target={k === 'email' ? undefined : '_blank'} rel="noopener noreferrer" aria-label={`${labels.share}: ${k}`} className="grid h-10 w-10 place-items-center border border-bone/15 text-bone/60 transition-colors hover:border-gold hover:text-gold">
          <svg width="16" height="16" viewBox="0 0 24 24" fill={k === 'email' ? 'none' : 'currentColor'} stroke={k === 'email' ? 'currentColor' : 'none'} strokeWidth="1.5" aria-hidden>
            <path d={ICONS[k]} />
          </svg>
        </a>
      ))}
      <button
        type="button"
        onClick={() => navigator.clipboard?.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); })}
        className="grid h-10 min-w-10 place-items-center border border-bone/15 px-2 text-[0.7rem] text-bone/60 transition-colors hover:border-gold hover:text-gold"
        aria-label={labels.copy}
      >
        {copied ? labels.copied : '⧉'}
      </button>
    </div>
  );
}
