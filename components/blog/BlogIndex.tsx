import Link from 'next/link';
import type { Dictionary } from '@/lib/i18n';
import { fmt } from '@/lib/i18n';
import { localizePath, type Locale } from '@/lib/i18n/config';
import type { BlogCategory, PostCard as Card } from '@/lib/blog';
import PostCard, { BlogCta, GoldTitle } from './PostCard';

export const PER_PAGE = 12;

/** Journal listing: header, category filter, featured story, grid, pagination. */
export default function BlogIndex({
  t,
  locale,
  posts,
  categories,
  active,
  page,
  basePath,
  heading,
  intro,
  label,
}: {
  t: Dictionary;
  locale: Locale;
  posts: Card[];
  categories: BlogCategory[];
  active?: string;
  page: number;
  basePath: string;
  heading?: string;
  intro?: string;
  label?: string;
}) {
  const pages = Math.max(1, Math.ceil(posts.length / PER_PAGE));
  const showFeature = page === 1 && !active && posts.length > 2;
  const featured = showFeature ? posts.find((p) => p.featured) ?? posts[0] : null;
  const rest = posts.filter((p) => p !== featured);
  const slice = rest.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const pageHref = (n: number) => localizePath(locale, n === 1 ? basePath : `${basePath}?page=${n}`);
  const used = new Set(posts.map((p) => p.category?.slug).filter(Boolean));

  return (
    <>
      <section className="wrap pb-12 pt-[calc(var(--header-h)+10vh)] md:pb-16">
        <p className="label text-gold">{label ?? t.blog.label}</p>
        <h1 className="display h-xl mt-6 max-w-[18ch]">
          <GoldTitle text={heading ?? t.blog.title} />
        </h1>
        <p className="body-lg mt-8 max-w-2xl text-bone/70">{intro ?? t.blog.intro}</p>

        {categories.some((c) => used.has(c.slug) || c.slug === active) && (
          <nav aria-label={t.blog.all} className="-mx-[var(--gutter)] mt-12 flex gap-2 overflow-x-auto px-[var(--gutter)] pb-2 [scrollbar-width:none]">
            <Link href={localizePath(locale, '/blog')} aria-current={!active ? 'page' : undefined} className={`label shrink-0 border px-4 py-3 transition-colors ${!active ? 'border-gold bg-gold text-night' : 'border-bone/20 text-bone/70 hover:border-gold hover:text-gold'}`}>
              {t.blog.all}
            </Link>
            {categories
              .filter((c) => used.has(c.slug) || c.slug === active)
              .map((c) => (
                <Link key={c.slug} href={localizePath(locale, `/blog/category/${c.slug}`)} aria-current={active === c.slug ? 'page' : undefined} className={`label shrink-0 border px-4 py-3 transition-colors ${active === c.slug ? 'border-gold bg-gold text-night' : 'border-bone/20 text-bone/70 hover:border-gold hover:text-gold'}`}>
                  {c.name}
                </Link>
              ))}
          </nav>
        )}
      </section>

      {!posts.length ? (
        <section className="wrap pb-32">
          <p className="border-t border-gold/20 pt-10 text-lg text-bone/60">{t.blog.noPosts}</p>
        </section>
      ) : (
        <>
          {featured && (
            <section className="wrap pb-20 md:pb-28" aria-label={t.blog.featured}>
              <PostCard post={featured} t={t} locale={locale} size="large" priority />
            </section>
          )}
          <section className="wrap pb-24 md:pb-32" aria-label={t.blog.latest}>
            {featured && <h2 className="label mb-10 border-t border-gold/20 pt-6 text-gold">{t.blog.latest}</h2>}
            <div className="grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
              {slice.map((p) => (
                <PostCard key={p.id} post={p} t={t} locale={locale} />
              ))}
            </div>
            {pages > 1 && (
              <nav aria-label="Pagination" className="mt-20 flex items-center justify-between border-t border-bone/10 pt-6">
                {page > 1 ? <Link rel="prev" href={pageHref(page - 1)} className="label link-line text-gold">← {t.blog.newer}</Link> : <span />}
                <span className="label text-bone/50">{fmt(t.blog.page, { n: page })} / {pages}</span>
                {page < pages ? <Link rel="next" href={pageHref(page + 1)} className="label link-line text-gold">{t.blog.older} →</Link> : <span />}
              </nav>
            )}
          </section>
        </>
      )}
      <BlogCta t={t} locale={locale} />
    </>
  );
}
