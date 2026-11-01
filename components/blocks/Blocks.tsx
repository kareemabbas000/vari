'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { gsap } from '@/lib/gsap';
import { useI18n } from '@/components/I18nProvider';
import ContactForm from '@/components/ContactForm';
import Newsletter from '@/components/Newsletter';
import Lightbox from '@/components/work/Lightbox';
import type { Media } from '@/lib/content';
import { resolveHref, styleOf, tx, type Block, type LinkValue } from '@/lib/blocks/schema';
import { RichText, SmartLink, Title, plain } from './Rich';

/* ——— Shared helpers ——— */

type P = Record<string, unknown>;
const str = (v: unknown) => (typeof v === 'string' ? v : '');
const arr = <T,>(v: unknown) => (Array.isArray(v) ? (v as T[]) : []);
const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d);

function useT() {
  const { locale, href } = useI18n();
  return { locale, href, tr: (v: unknown) => tx(v, locale) };
}

function Btn({ link, primary = false }: { link?: LinkValue; primary?: boolean }) {
  const { tr, href } = useT();
  const label = tr(link?.label);
  const to = resolveHref(link?.href, href);
  if (!label || !to) return null;
  return (
    <SmartLink href={to} localize={(p) => p} className={`btn ${primary ? 'btn-solid' : ''}`}>
      {label}
    </SmartLink>
  );
}

function Eyebrow({ text, className = '' }: { text: string; className?: string }) {
  if (!text) return null;
  return <p className={`label mb-5 flex items-center gap-4 text-gold ${className}`}><span className="h-px w-8 bg-gold/70" />{text}</p>;
}

function Img({ src, alt, sizes, className = '', priority = false }: { src: string; alt: string; sizes: string; className?: string; priority?: boolean }) {
  if (!src) return <div className={`absolute inset-0 bg-gradient-to-br from-charcoal to-night ${className}`} aria-hidden />;
  return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={`object-cover ${className}`} />;
}

/* ——— Section shell: background, spacing, width, visibility, reveal ——— */

const BG: Record<string, string> = {
  night: 'bg-night text-bone',
  ink: 'bg-ink text-bone',
  charcoal: 'bg-charcoal text-bone',
  bone: 'bg-bone text-night',
  gold: 'bg-gold text-night',
  image: 'text-bone',
};
const PAD: Record<string, string> = { none: '', sm: 'py-10 md:py-14', md: 'py-16 md:py-24', lg: 'py-20 md:py-32', xl: 'py-28 md:py-44' };
const MAXW: Record<string, string> = { narrow: 'max-w-3xl', normal: 'max-w-6xl', wide: '', full: '' };

function Shell({ block, children, label }: { block: Block; children: ReactNode; label?: string }) {
  const s = styleOf(block);
  const hide = s.hideOn === 'mobile' ? 'hidden md:block' : s.hideOn === 'desktop' ? 'md:hidden' : '';
  const inner = s.width === 'full' ? '' : `wrap`;
  const center = s.align === 'center' ? 'text-center [&_.label]:justify-center' : '';
  return (
    <section
      id={s.anchor || undefined}
      aria-label={label || undefined}
      data-block={block.type}
      className={`relative isolate overflow-hidden ${BG[s.bg] || BG.night} ${PAD[s.pad] ?? PAD.lg} ${hide}`}
    >
      {s.bg === 'image' && (
        <>
          <Img src={s.bgImage || ''} alt="" sizes="100vw" className="-z-20" />
          <div className="absolute inset-0 -z-10 bg-night" style={{ opacity: (s.overlay ?? 55) / 100 }} aria-hidden />
        </>
      )}
      <div className={inner}>
        <div className={`${MAXW[s.width] || ''} ${s.width === 'narrow' || s.width === 'normal' ? 'mx-auto' : ''} ${center}`} data-reveal={s.reveal ? '' : undefined}>
          {children}
        </div>
      </div>
    </section>
  );
}

/* ——— Blocks ——— */

function Hero({ p, first }: { p: P; first: boolean }) {
  const { tr } = useT();
  const height = str(p.height) === 'screen' ? 'min-h-[100svh]' : str(p.height) === 'medium' ? 'min-h-[60svh]' : 'min-h-[82svh]';
  const center = str(p.align) === 'center';
  const title = tr(p.title);
  return (
    <div className={`relative flex ${height} items-end`}>
      <Img src={str(p.image)} alt={plain(title)} sizes="100vw" priority={first} />
      <div className="absolute inset-0 bg-gradient-to-t from-night via-night/40 to-transparent" aria-hidden />
      <div className="absolute inset-0 bg-night" style={{ opacity: num(p.overlay, 45) / 100 }} aria-hidden />
      <div className={`wrap relative pb-16 pt-40 md:pb-24 ${center ? 'text-center' : ''}`}>
        <div className={center ? 'mx-auto max-w-5xl [&_.label]:justify-center' : 'max-w-5xl'} data-reveal="">
          <Eyebrow text={tr(p.eyebrow)} />
          {title && <h1 className="display h-xl text-bone"><Title text={title} /></h1>}
          {tr(p.subtitle) && <p className={`body-lg mt-8 max-w-2xl text-bone/75 ${center ? 'mx-auto' : ''}`}>{tr(p.subtitle)}</p>}
          {arr<{ link?: LinkValue }>(p.buttons).length > 0 && (
            <div className={`mt-10 flex flex-wrap gap-4 ${center ? 'justify-center' : ''}`}>
              {arr<{ link?: LinkValue }>(p.buttons).map((b, i) => <Btn key={i} link={b.link} primary={i === 0} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Heading({ p }: { p: P }) {
  const { tr } = useT();
  const Tag = (['h1', 'h2', 'h3'].includes(str(p.level)) ? str(p.level) : 'h2') as 'h1' | 'h2' | 'h3';
  const size = str(p.size) === 'xl' ? 'h-xl' : str(p.size) === 'md' ? 'h-md' : 'h-lg';
  return (
    <>
      <Eyebrow text={tr(p.eyebrow)} />
      {tr(p.title) && <Tag className={`display ${size}`}><Title text={tr(p.title)} /></Tag>}
      {tr(p.intro) && <p className="body-lg mt-6 max-w-2xl opacity-75 [.text-center_&]:mx-auto">{tr(p.intro)}</p>}
    </>
  );
}

function Text({ p }: { p: P }) {
  const { tr, href } = useT();
  return <RichText text={tr(p.body)} localize={href} className={`${p.large ? 'body-lg' : 'text-[1.02rem] leading-relaxed'} opacity-90 ${str(p.columns) === '2' ? 'md:columns-2 md:gap-14 [&>*]:break-inside-avoid' : ''}`} />;
}

function ImageBlock({ p }: { p: P }) {
  const { tr } = useT();
  const box = useRef<HTMLDivElement>(null);
  const aspect = str(p.aspect) || '16/9';
  useEffect(() => {
    if (!p.parallax || !box.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const img = box.current.querySelector('img');
    if (!img) return;
    const tw = gsap.fromTo(img, { yPercent: -6, scale: 1.14 }, { yPercent: 6, scale: 1.14, ease: 'none', scrollTrigger: { trigger: box.current, start: 'top bottom', end: 'bottom top', scrub: true } });
    return () => {
      tw.scrollTrigger?.kill();
      tw.kill();
    };
  }, [p.parallax, p.image]);
  const alt = tr(p.alt) || tr(p.caption);
  return (
    <figure>
      {aspect === 'auto' && str(p.image) ? (
        <div ref={box} className="frame">
          <Image src={str(p.image)} alt={alt} width={1800} height={1200} sizes="(min-width: 1600px) 1600px, 100vw" className="h-auto w-full" />
        </div>
      ) : (
        <div ref={box} className="frame" style={{ aspectRatio: aspect === 'auto' ? '16/9' : aspect }}>
          <Img src={str(p.image)} alt={alt} sizes="(min-width: 1600px) 1600px, 100vw" />
        </div>
      )}
      {tr(p.caption) && <figcaption className="label mt-4 opacity-60">{tr(p.caption)}</figcaption>}
    </figure>
  );
}

function ImageText({ p }: { p: P }) {
  const { tr, href } = useT();
  const right = str(p.side) === 'right';
  return (
    <div className="grid items-center gap-10 md:grid-cols-2 md:gap-20">
      <div className={`frame aspect-[4/5] ${right ? 'md:order-2' : ''}`}>
        <Img src={str(p.image)} alt={plain(tr(p.title))} sizes="(min-width: 768px) 50vw, 100vw" />
      </div>
      <div className="text-left">
        <Eyebrow text={tr(p.eyebrow)} />
        {tr(p.title) && <h2 className="display h-lg"><Title text={tr(p.title)} /></h2>}
        {tr(p.body) && <RichText text={tr(p.body)} localize={href} className="mt-8 leading-relaxed opacity-80" />}
        {(p.link as LinkValue)?.href && <div className="mt-10"><Btn link={p.link as LinkValue} /></div>}
      </div>
    </div>
  );
}

function Gallery({ p }: { p: P }) {
  const images = arr<string>(p.images).filter(Boolean);
  const [open, setOpen] = useState<number | null>(null);
  const cols = str(p.columns) || '3';
  const layout = str(p.layout) || 'masonry';
  const { projects } = useI18n();
  // Gallery blocks store image ids only; reuse the alt text the same image has in the portfolio.
  const altOf = useMemo(() => {
    const known = new Map(projects.flatMap((pr) => pr.media.map((m) => [m.id, m.alt] as const)));
    return (id: string) => known.get(id) || '';
  }, [projects]);
  const media: Media[] = useMemo(() => images.map((id) => ({ id, width: 1600, height: 1000, file: id, alt: altOf(id) })), [images, altOf]);
  const scroller = useRef<HTMLDivElement>(null);
  if (!images.length) return <p className="label opacity-50">Gallery — add images in the panel.</p>;
  const tile = (src: string, i: number, cls: string, aspect?: string) => (
    <button key={`${src}-${i}`} type="button" onClick={() => p.lightbox !== false && setOpen(i)} className={`frame group block w-full ${cls}`} style={aspect ? { aspectRatio: aspect } : undefined} aria-label={`Open image ${i + 1}`}>
      {aspect ? (
        <Img src={src} alt={altOf(src)} sizes={`(min-width: 768px) ${Math.round(100 / Number(cols))}vw, 100vw`} className="transition-transform duration-[1.4s] ease-expo group-hover:scale-105" />
      ) : (
        <Image src={src} alt={altOf(src)} width={1200} height={900} sizes={`(min-width: 768px) ${Math.round(100 / Number(cols))}vw, 100vw`} className="h-auto w-full transition-transform duration-[1.4s] ease-expo group-hover:scale-105" />
      )}
    </button>
  );
  return (
    <>
      {layout === 'slider' ? (
        <div className="relative">
          <div ref={scroller} className="-mx-[var(--gutter)] flex snap-x snap-mandatory gap-4 overflow-x-auto px-[var(--gutter)] pb-4 [scrollbar-width:none]">
            {images.map((src, i) => <div key={i} className="w-[82%] shrink-0 snap-start md:w-[46%]">{tile(src, i, '', '4/3')}</div>)}
          </div>
          <div className="mt-6 flex justify-end gap-3">
            {[-1, 1].map((d) => (
              <button key={d} type="button" aria-label={d < 0 ? 'Previous' : 'Next'} onClick={() => scroller.current?.scrollBy({ left: d * scroller.current.clientWidth * 0.6, behavior: 'smooth' })} className="grid h-12 w-12 place-items-center border border-gold/40 text-gold transition hover:bg-gold hover:text-night">
                {d < 0 ? '←' : '→'}
              </button>
            ))}
          </div>
        </div>
      ) : layout === 'grid' ? (
        <div className={`grid grid-cols-2 gap-3 md:gap-5 ${cols === '4' ? 'md:grid-cols-4' : cols === '2' ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>{images.map((src, i) => tile(src, i, '', '1/1'))}</div>
      ) : (
        <div className={`columns-2 gap-3 md:gap-5 ${cols === '4' ? 'md:columns-4' : cols === '2' ? 'md:columns-2' : 'md:columns-3'} [&>*]:mb-3 md:[&>*]:mb-5`}>{images.map((src, i) => tile(src, i, 'break-inside-avoid'))}</div>
      )}
      {open !== null && <Lightbox images={media} index={open} title="" onClose={() => setOpen(null)} onIndex={setOpen} />}
    </>
  );
}

function Cards({ p }: { p: P }) {
  const { tr, href } = useT();
  const items = arr<P>(p.items);
  const cols = str(p.columns) === '2' ? 'md:grid-cols-2' : str(p.columns) === '4' ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-3';
  return (
    <>
      <Eyebrow text={tr(p.eyebrow)} />
      {tr(p.title) && <h2 className="display h-lg mb-12 md:mb-16"><Title text={tr(p.title)} /></h2>}
      <div className={`grid gap-px bg-current/10 ${cols} text-left`} style={{ backgroundColor: 'color-mix(in srgb, currentColor 12%, transparent)' }}>
        {items.map((it, i) => {
          const link = it.link as LinkValue | undefined;
          const body = (
            <div className="group flex h-full flex-col bg-[inherit] p-7 md:p-9" style={{ background: 'var(--card-bg, transparent)' }}>
              {str(it.image) && (
                <div className="frame -mx-7 -mt-7 mb-8 aspect-[4/3] md:-mx-9 md:-mt-9">
                  <Img src={str(it.image)} alt={tr(it.title)} sizes="(min-width: 768px) 33vw, 100vw" className="transition-transform duration-[1.4s] ease-expo group-hover:scale-105" />
                </div>
              )}
              {p.numbered ? <span className="label mb-6 text-gold">{String(i + 1).padStart(2, '0')}</span> : null}
              <h3 className="display text-[1.7rem] leading-tight">{tr(it.title)}</h3>
              {tr(it.body) && <p className="mt-4 leading-relaxed opacity-70">{tr(it.body)}</p>}
              {link?.href && tr(link.label) && <span className="label mt-auto pt-8 text-gold">{tr(link.label)} →</span>}
            </div>
          );
          return (
            <div key={i} className="[--card-bg:theme(colors.night)] [.bg-bone_&]:[--card-bg:theme(colors.bone)] [.bg-charcoal_&]:[--card-bg:theme(colors.charcoal)] [.bg-ink_&]:[--card-bg:theme(colors.ink)] [.bg-gold_&]:[--card-bg:theme(colors.gold.DEFAULT)]">
              {link?.href ? <SmartLink href={link.href} localize={href} className="block h-full">{body}</SmartLink> : body}
            </div>
          );
        })}
      </div>
    </>
  );
}

function CountUp({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const m = value.match(/^(\D*)(\d+(?:[.,]\d+)?)(.*)$/);
  const [shown, setShown] = useState(m ? `${m[1]}0${m[3]}` : value);
  useEffect(() => {
    if (!m || !ref.current) return setShown(value);
    const target = parseFloat(m[2].replace(',', '.'));
    const decimals = (m[2].split(/[.,]/)[1] || '').length;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return setShown(value);
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const o = { v: 0 };
      gsap.to(o, { v: target, duration: 2, ease: 'expo.out', onUpdate: () => setShown(`${m[1]}${o.v.toFixed(decimals)}${m[3]}`) });
    });
    io.observe(ref.current);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return <span ref={ref}>{shown}</span>;
}

const STAT_COLS: Record<number, string> = { 1: 'md:grid-cols-1', 2: 'md:grid-cols-2', 3: 'md:grid-cols-3', 4: 'md:grid-cols-4' };

function Stats({ p }: { p: P }) {
  const { tr } = useT();
  const items = arr<P>(p.items);
  return (
    <dl className={`grid grid-cols-2 gap-x-6 gap-y-12 text-left ${STAT_COLS[Math.min(items.length, 4)] || 'md:grid-cols-3'}`}>
      {items.map((it, i) => (
        <div key={i} className="flex flex-col border-l border-gold/30 pl-6">
          <dt className="label mt-3 opacity-60">{tr(it.label)}</dt>
          <dd className="display order-first text-[clamp(3rem,7vw,6rem)] leading-none text-gold">
            <CountUp value={str(it.value)} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Quote({ p }: { p: P }) {
  const { tr } = useT();
  return (
    <figure>
      <span aria-hidden className="display block text-[6rem] leading-[0.5] text-gold/60">“</span>
      <blockquote className="display-italic mt-4 text-[clamp(1.7rem,3.4vw,3rem)] leading-[1.2]">{tr(p.quote)}</blockquote>
      {(str(p.author) || tr(p.role)) && (
        <figcaption className="mt-10 flex items-center gap-4 [.text-center_&]:justify-center">
          {str(p.image) && <span className="relative h-14 w-14 overflow-hidden rounded-full"><Img src={str(p.image)} alt={str(p.author)} sizes="56px" /></span>}
          <span className="text-left">
            <span className="block font-medium">{str(p.author)}</span>
            <span className="label opacity-60">{tr(p.role)}</span>
          </span>
        </figcaption>
      )}
    </figure>
  );
}

function Cta({ p }: { p: P }) {
  const { tr } = useT();
  return (
    <>
      {tr(p.title) && <h2 className="display h-xl mx-auto max-w-4xl"><Title text={tr(p.title)} /></h2>}
      {tr(p.body) && <p className="body-lg mx-auto mt-8 max-w-2xl opacity-75">{tr(p.body)}</p>}
      <div className="mt-12 flex flex-wrap gap-4 [.text-center_&]:justify-center">
        <Btn link={p.primary as LinkValue} primary />
        <Btn link={p.secondary as LinkValue} />
      </div>
    </>
  );
}

export function parseVideo(url: string): { kind: 'youtube' | 'vimeo' | 'file'; id: string } | null {
  const u = url.trim();
  let m = u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  if (m) return { kind: 'youtube', id: m[1] };
  m = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (m) return { kind: 'vimeo', id: m[1] };
  if (/^https:\/\/\S+\.(mp4|webm)(\?\S*)?$/i.test(u)) return { kind: 'file', id: u };
  return null;
}

function Video({ p }: { p: P }) {
  const { tr } = useT();
  const v = parseVideo(str(p.url));
  const [playing, setPlaying] = useState(false);
  const title = tr(p.title) || 'Video';
  if (!v) return <p className="label opacity-50">Video — paste a YouTube, Vimeo or MP4 link in the panel.</p>;
  const ambient = v.kind === 'file' && !!p.ambient;
  return (
    <figure>
      <div className="frame aspect-video">
        {ambient ? (
          <video src={v.id} poster={str(p.poster) || undefined} autoPlay muted loop playsInline className="h-full w-full object-cover" aria-label={title} />
        ) : playing ? (
          v.kind === 'file' ? (
            <video src={v.id} controls autoPlay playsInline className="h-full w-full bg-night" aria-label={title} />
          ) : (
            <iframe
              title={title}
              src={v.kind === 'youtube' ? `https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&rel=0` : `https://player.vimeo.com/video/${v.id}?autoplay=1&dnt=1`}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
            />
          )
        ) : (
          <button type="button" onClick={() => setPlaying(true)} className="group absolute inset-0 grid place-items-center" aria-label={`Play: ${title}`}>
            <Img src={str(p.poster)} alt="" sizes="100vw" className="transition-transform duration-[1.4s] ease-expo group-hover:scale-105" />
            <span className="relative grid h-20 w-20 place-items-center rounded-full border border-gold bg-night/40 text-gold backdrop-blur transition group-hover:bg-gold group-hover:text-night md:h-24 md:w-24">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M8 5v14l11-7z" /></svg>
            </span>
          </button>
        )}
      </div>
      {tr(p.caption) && <figcaption className="label mt-4 opacity-60">{tr(p.caption)}</figcaption>}
      {!playing && v.kind !== 'file' && <p className="mt-2 text-xs opacity-40">{v.kind === 'youtube' ? 'YouTube' : 'Vimeo'} loads when you press play.</p>}
    </figure>
  );
}

function Faq({ p }: { p: P }) {
  const { tr } = useT();
  const items = arr<P>(p.items).filter((it) => tr(it.q));
  const ld = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items.map((it) => ({ '@type': 'Question', name: tr(it.q), acceptedAnswer: { '@type': 'Answer', text: tr(it.a) } })) };
  return (
    <>
      {tr(p.title) && <h2 className="display h-lg mb-12"><Title text={tr(p.title)} /></h2>}
      <div className="border-t border-current/15 text-left" style={{ borderColor: 'color-mix(in srgb, currentColor 15%, transparent)' }}>
        {items.map((it, i) => (
          <details key={i} className="group border-b py-6" style={{ borderColor: 'color-mix(in srgb, currentColor 15%, transparent)' }}>
            <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-[1.15rem] md:text-[1.3rem] [&::-webkit-details-marker]:hidden">
              <span>{tr(it.q)}</span>
              <span aria-hidden className="mt-1 text-gold transition-transform duration-500 group-open:rotate-45">+</span>
            </summary>
            <div className="pt-5 leading-relaxed opacity-75 whitespace-pre-line">{tr(it.a)}</div>
          </details>
        ))}
      </div>
      {items.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />}
    </>
  );
}

function Projects({ p }: { p: P }) {
  const { tr, href } = useT();
  const { projects } = useI18n();
  const limit = num(p.limit, 6);
  const source = str(p.source) || 'featured';
  let list = projects;
  if (source === 'featured') list = projects.filter((x) => x.featured).concat(projects.filter((x) => !x.featured));
  else if (source === 'exterior' || source === 'interior') list = projects.filter((x) => x.category === source);
  else if (source === 'manual') list = arr<string>(p.slugs).map((s) => projects.find((x) => x.slug === s)).filter((x): x is (typeof projects)[number] => !!x);
  list = list.slice(0, limit);
  const wide = str(p.layout) === 'wide';
  return (
    <>
      <Eyebrow text={tr(p.eyebrow)} />
      {tr(p.title) && <h2 className="display h-lg mb-12 md:mb-16"><Title text={tr(p.title)} /></h2>}
      <div className={wide ? 'space-y-16 md:space-y-28' : 'grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3'}>
        {list.map((x, i) => (
          <Link key={x.slug} href={href(`/work/${x.slug}`)} className={`group block text-left ${wide ? `md:w-[78%] ${i % 2 ? 'md:ml-auto' : ''}` : ''}`}>
            <div className={`frame ${wide ? 'aspect-[16/9]' : 'aspect-[4/5]'}`}>
              <Img src={x.media[0]?.id || ''} alt={x.media[0]?.alt || x.title} sizes={wide ? '80vw' : '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw'} className="transition-transform duration-[1.6s] ease-expo group-hover:scale-105" />
            </div>
            <div className="mt-5 flex items-baseline justify-between gap-4">
              <h3 className="display text-[1.6rem] leading-tight md:text-[2rem]">{x.title}</h3>
              <span className="label shrink-0 text-gold">{x.categoryName}</span>
            </div>
            {x.label && <p className="mt-2 text-sm opacity-60">{x.label}</p>}
          </Link>
        ))}
      </div>
    </>
  );
}

function ServicesList({ p }: { p: P }) {
  const { tr } = useT();
  const { services } = useI18n();
  return (
    <>
      {tr(p.title) && <h2 className="display h-lg mb-12 md:mb-16"><Title text={tr(p.title)} /></h2>}
      <ol className="text-left">
        {services.map((s, i) => (
          <li key={s.key} className="grid gap-3 border-t border-gold/20 py-7 md:grid-cols-[6rem_1fr_1.2fr] md:gap-10 md:py-9">
            <span className="label pt-2 text-gold">{String(i + 1).padStart(2, '0')}</span>
            <h3 className="display text-[1.8rem] leading-tight md:text-[2.3rem]">{s.title}</h3>
            <p className="leading-relaxed opacity-70">{s.body}</p>
          </li>
        ))}
      </ol>
      {(p.link as LinkValue)?.href && <div className="mt-12"><Btn link={p.link as LinkValue} /></div>}
    </>
  );
}

function Marquee({ p }: { p: P }) {
  const { tr } = useT();
  const words = arr<P>(p.items).map((w) => tr(w.text)).filter(Boolean);
  const dur = str(p.speed) === 'slow' ? '60s' : str(p.speed) === 'fast' ? '18s' : '34s';
  const row = (hidden: boolean) => (
    <div aria-hidden={hidden || undefined} className="flex shrink-0 items-center gap-12 pr-12">
      {words.map((w, i) => (
        <span key={i} className={`display whitespace-nowrap text-[clamp(3rem,9vw,8.5rem)] leading-none ${p.outline ? 'text-transparent [-webkit-text-stroke:1px_theme(colors.gold.DEFAULT)]' : ''}`}>
          {w} <span className="text-gold">✦</span>
        </span>
      ))}
    </div>
  );
  return (
    <div className="flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
      <p className="sr-only">{words.join(' · ')}</p>
      <div className="vari-marquee flex" style={{ animationDuration: dur }}>
        {row(true)}
        {row(true)}
      </div>
    </div>
  );
}

function Logos({ p }: { p: P }) {
  const { tr } = useT();
  const images = arr<string>(p.images).filter(Boolean);
  return (
    <>
      {tr(p.title) && <p className="label mb-10 text-center opacity-60">{tr(p.title)}</p>}
      <div className="flex flex-wrap items-center justify-center gap-x-14 gap-y-8">
        {images.map((src, i) => (
          <span key={i} className="relative h-12 w-32 opacity-60 grayscale transition hover:opacity-100 hover:grayscale-0 md:h-14 md:w-40">
            <Image src={src} alt="" fill sizes="160px" className="object-contain" />
          </span>
        ))}
      </div>
    </>
  );
}

function ContactBlock({ p }: { p: P }) {
  const { tr } = useT();
  return (
    <div className="grid gap-12 md:grid-cols-[1fr_1.3fr] md:gap-20">
      <div className="text-left">
        <Eyebrow text={tr(p.eyebrow)} />
        {tr(p.title) && <h2 className="display h-lg"><Title text={tr(p.title)} /></h2>}
        {tr(p.intro) && <p className="body-lg mt-8 opacity-75">{tr(p.intro)}</p>}
      </div>
      <div className="text-left">
        <ContactForm compact />
      </div>
    </div>
  );
}

function MapBlock({ p }: { p: P }) {
  const [on, setOn] = useState(false);
  const address = str(p.address);
  if (!address) return <p className="label opacity-50">Map — enter an address in the panel.</p>;
  return (
    <div className="frame aspect-[16/9] md:aspect-[21/9]">
      {on ? (
        <iframe title={address} src={`https://maps.google.com/maps?q=${encodeURIComponent(address)}&z=${num(p.zoom, 14)}&output=embed`} className="absolute inset-0 h-full w-full grayscale-[0.6] invert-[0.92] hue-rotate-180" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
      ) : (
        <button type="button" onClick={() => setOn(true)} className="blueprint absolute inset-0 grid place-items-center p-6 text-center">
          <span>
            <span className="display block text-[1.6rem] text-bone">{address}</span>
            <span className="label mt-4 inline-block text-gold">Show map · loads Google Maps</span>
          </span>
        </button>
      )}
    </div>
  );
}

function Spacer({ p }: { p: P }) {
  const h = str(p.size) === 'sm' ? 'h-10' : str(p.size) === 'lg' ? 'h-40' : 'h-20';
  return <div className={`${h} flex items-center`} aria-hidden>{p.line ? <span className="hairline" /> : null}</div>;
}

/* ——— Renderer ——— */

const RENDER: Record<string, (p: P, first: boolean) => ReactNode> = {
  hero: (p, first) => <Hero p={p} first={first} />,
  heading: (p) => <Heading p={p} />,
  text: (p) => <Text p={p} />,
  image: (p) => <ImageBlock p={p} />,
  imageText: (p) => <ImageText p={p} />,
  gallery: (p) => <Gallery p={p} />,
  cards: (p) => <Cards p={p} />,
  stats: (p) => <Stats p={p} />,
  quote: (p) => <Quote p={p} />,
  cta: (p) => <Cta p={p} />,
  video: (p) => <Video p={p} />,
  faq: (p) => <Faq p={p} />,
  projects: (p) => <Projects p={p} />,
  services: (p) => <ServicesList p={p} />,
  marquee: (p) => <Marquee p={p} />,
  logos: (p) => <Logos p={p} />,
  contactForm: (p) => <ContactBlock p={p} />,
  newsletter: () => <div className="mx-auto max-w-xl text-left"><Newsletter /></div>,
  map: (p) => <MapBlock p={p} />,
  spacer: (p) => <Spacer p={p} />,
};

/** Fades blocks in as they enter the viewport (CSS only; respects reduced motion). */
function useReveal(root: React.RefObject<HTMLDivElement | null>, dep: unknown) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const targets = Array.from(el.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-in)'));
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      targets.forEach((t) => t.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        }),
      { rootMargin: '0px 0px -8% 0px' },
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, [root, dep]);
}

export function renderBlock(block: Block, index: number) {
  const r = RENDER[block.type];
  if (!r) return null;
  const full = block.type === 'hero';
  const content = r(block.props || {}, index === 0);
  return full ? (
    <section key={block.id} id={block.style?.anchor || undefined} data-block="hero" className={`relative bg-night text-bone ${block.style?.hideOn === 'mobile' ? 'hidden md:block' : block.style?.hideOn === 'desktop' ? 'md:hidden' : ''}`}>
      {content}
    </section>
  ) : (
    <Shell key={block.id} block={block}>
      {content}
    </Shell>
  );
}

/**
 * Renders a run of blocks (client side). On the public site, server pages interleave these
 * runs with the built-in sections (see PageBlocks); in the builder preview, `renderModule`
 * draws a placeholder for built-in sections and `wrap` adds the selection frame.
 */
export default function BlockRenderer({
  blocks,
  renderModule,
  wrap,
}: {
  blocks: Block[];
  renderModule?: (block: Block, index: number) => ReactNode;
  wrap?: (block: Block, node: ReactNode, index: number) => ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);
  useReveal(root, blocks);
  return (
    <div ref={root} className="contents">
      {blocks.map((b, i) => {
        if (b.hidden && !wrap) return null;
        const node = b.type === 'module' ? renderModule?.(b, i) ?? null : renderBlock(b, i);
        return wrap ? wrap(b, node, i) : <div key={b.id} className="contents">{node}</div>;
      })}
    </div>
  );
}
