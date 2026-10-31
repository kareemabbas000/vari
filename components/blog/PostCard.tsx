import Image from 'next/image';
import Link from 'next/link';
import { fmt, type Dictionary } from '@/lib/i18n';
import { localizePath, type Locale } from '@/lib/i18n/config';
import { formatDate, type PostCard as Card } from '@/lib/blog';
import { readingMinutes } from '@/lib/blog-html';

export function Meta({ post, t, locale, className = '' }: { post: Card; t: Dictionary; locale: Locale; className?: string }) {
  return (
    <p className={`label flex flex-wrap items-center gap-x-3 gap-y-1 ${className}`}>
      {post.category && <span className="text-gold">{post.category.name}</span>}
      {post.category && <span aria-hidden className="h-px w-4 bg-current opacity-40" />}
      <time dateTime={post.publishedAt} className="opacity-60">{formatDate(post.publishedAt, locale)}</time>
      <span aria-hidden className="opacity-40">·</span>
      <span className="opacity-60">{fmt(t.blog.minRead, { n: readingMinutes(post.words) })}</span>
    </p>
  );
}

export default function PostCard({ post, t, locale, size = 'normal', priority = false }: { post: Card; t: Dictionary; locale: Locale; size?: 'normal' | 'large'; priority?: boolean }) {
  const href = localizePath(locale, `/blog/${post.slug}`);
  if (size === 'large') {
    return (
      <article className="group grid items-center gap-8 md:grid-cols-12 md:gap-12">
        <Link href={href} className="frame relative block aspect-[4/3] md:col-span-7 md:aspect-[16/11]" tabIndex={-1} aria-hidden>
          {post.cover && <Image src={post.cover} alt={post.coverAlt} fill priority={priority} sizes="(min-width: 768px) 58vw, 100vw" className="object-cover transition-transform duration-[1.6s] ease-expo group-hover:scale-105" />}
          <span className="label absolute left-4 top-4 bg-gold px-3 py-1.5 text-night">{t.blog.featured}</span>
        </Link>
        <div className="md:col-span-5">
          <Meta post={post} t={t} locale={locale} />
          <h2 className="display mt-5 text-[clamp(2rem,3.6vw,3.4rem)] leading-[1.05]">
            <Link href={href} className="transition-colors hover:text-gold">{post.title}</Link>
          </h2>
          <p className="body-lg mt-6 text-bone/70">{post.excerpt}</p>
          <Link href={href} className="label link-line mt-8 inline-block text-gold">{t.blog.readMore} →</Link>
        </div>
      </article>
    );
  }
  return (
    <article className="group flex flex-col">
      <Link href={href} className="frame relative block aspect-[4/3]" tabIndex={-1} aria-hidden>
        {post.cover && <Image src={post.cover} alt={post.coverAlt} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition-transform duration-[1.6s] ease-expo group-hover:scale-105" />}
      </Link>
      <Meta post={post} t={t} locale={locale} className="mt-5 text-[0.62rem]" />
      <h3 className="display mt-3 text-[1.65rem] leading-[1.15] md:text-[1.85rem]">
        <Link href={href} className="transition-colors hover:text-gold">{post.title}</Link>
      </h3>
      <p className="mt-3 line-clamp-3 text-[0.95rem] leading-relaxed text-bone/60">{post.excerpt}</p>
    </article>
  );
}

export function BlogCta({ t, locale }: { t: Dictionary; locale: Locale }) {
  return (
    <section className="blueprint border-y border-gold/15 py-24 text-center md:py-32">
      <div className="wrap">
        <h2 className="display h-lg mx-auto max-w-3xl">
          <GoldTitle text={t.blog.ctaTitle} />
        </h2>
        <p className="body-lg mx-auto mt-6 max-w-2xl text-bone/70">{t.blog.ctaBody}</p>
        <Link href={localizePath(locale, '/contact')} className="btn btn-solid mt-10">{t.blog.ctaButton}</Link>
      </div>
    </section>
  );
}

/** "Ideas on *design*" → title with the gold italic word. */
export function GoldTitle({ text }: { text: string }) {
  const parts = text.split(/(\*[^*]+\*)/g).filter(Boolean);
  return (
    <>
      {parts.map((p, i) => (p.startsWith('*') && p.endsWith('*') ? <span key={i} className="display-italic text-gold">{p.slice(1, -1)}</span> : <span key={i}>{p}</span>))}
    </>
  );
}
