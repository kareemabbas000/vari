import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSiteContent } from '@/lib/cms';
import { formatDate, getPost, getPosts, postAlternates } from '@/lib/blog';
import { readingMinutes, renderArticle } from '@/lib/blog-html';
import { fmt } from '@/lib/i18n';
import { isLocale, localizePath, type Locale } from '@/lib/i18n/config';
import { getLanguages } from '@/lib/i18n/languages';
import { site } from '@/lib/content';
import { mediaUrl } from '@/lib/image-loader';
import PostCard, { BlogCta } from '@/components/blog/PostCard';
import { ReadingProgress, ShareBar, Toc } from '@/components/blog/ArticleUi';

type Props = { params: Promise<{ locale: string; slug: string }> };
const BASE = site.url.replace(/\/$/, '');
const abs = (src: string) => (/^https?:/.test(src) ? src : mediaUrl(src, 1600));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const [post, langs] = await Promise.all([getPost(locale, slug), getLanguages()]);
  if (!post) return {};
  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt;
  const image = post.cover ? abs(post.cover) : undefined;
  return {
    title: { absolute: `${title} | VARI Studio` },
    description,
    alternates: await postAlternates(locale, post.translations),
    authors: post.author ? [{ name: post.author.name, url: localizePath(locale, `/blog/author/${post.author.slug}`) }] : undefined,
    openGraph: {
      type: 'article',
      title,
      description,
      url: localizePath(locale, `/blog/${post.slug}`),
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      section: post.category?.name,
      tags: post.tags.map((t) => t.name),
      locale: langs.byCode[locale]?.og,
      images: image ? [{ url: image, width: 1600, alt: post.coverAlt }] : undefined,
    },
    twitter: { card: 'summary_large_image', title, description, images: image ? [image] : undefined },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { locale, slug } = await params;
  const l = locale as Locale;
  const [post, { t }, all, langs] = await Promise.all([getPost(l, slug), getSiteContent(l), getPosts(l), getLanguages()]);
  if (!post) notFound();
  const href = (p: string) => localizePath(l, p);
  const { html, toc } = renderArticle(post.html, href);
  const url = `${BASE}${href(`/blog/${post.slug}`)}`;
  const related = [...all.filter((p) => p.id !== post.id && p.category?.slug === post.category?.slug), ...all.filter((p) => p.id !== post.id && p.category?.slug !== post.category?.slug)].slice(0, 3);
  const minutes = readingMinutes(post.words);

  const ld = [
    {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.seoDescription || post.excerpt,
      image: post.cover ? [abs(post.cover)] : undefined,
      datePublished: post.publishedAt,
      dateModified: post.updatedAt,
      inLanguage: langs.byCode[l]?.hreflang ?? l,
      wordCount: post.words,
      timeRequired: `PT${minutes}M`,
      articleSection: post.category?.name,
      keywords: post.tags.map((x) => x.name).join(', ') || undefined,
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      url,
      author: post.author ? { '@type': post.author.slug === 'vari-studio' ? 'Organization' : 'Person', name: post.author.name, url: `${BASE}${href(`/blog/author/${post.author.slug}`)}` } : { '@type': 'Organization', name: 'VARI Studio' },
      publisher: { '@type': 'Organization', name: 'VARI Studio', url: BASE, logo: { '@type': 'ImageObject', url: `${BASE}/brand/vari-logo-dark.png` } },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: t.blog.home, item: `${BASE}${href('/')}` },
        { '@type': 'ListItem', position: 2, name: t.blog.label, item: `${BASE}${href('/blog')}` },
        ...(post.category ? [{ '@type': 'ListItem', position: 3, name: post.category.name, item: `${BASE}${href(`/blog/category/${post.category.slug}`)}` }] : []),
        { '@type': 'ListItem', position: post.category ? 4 : 3, name: post.title, item: url },
      ],
    },
    ...(post.faq.length
      ? [{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: post.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }]
      : []),
  ];

  return (
    <>
      <ReadingProgress />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
      <article data-article>
        <header className="wrap pt-[calc(var(--header-h)+7vh)]">
          <nav aria-label="Breadcrumb" className="label flex flex-wrap items-center gap-2 text-bone/45">
            <Link href={href('/blog')} className="hover:text-gold">{t.blog.label}</Link>
            {post.category && (
              <>
                <span aria-hidden>/</span>
                <Link href={href(`/blog/category/${post.category.slug}`)} className="text-gold hover:underline">{post.category.name}</Link>
              </>
            )}
          </nav>
          <h1 className="display mt-8 max-w-[22ch] text-[clamp(2.4rem,5.6vw,5.4rem)] leading-[1.02]">{post.title}</h1>
          {post.excerpt && <p className="body-lg mt-8 max-w-3xl text-bone/70">{post.excerpt}</p>}
          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-bone/10 pt-6 text-sm text-bone/60">
            {post.author && (
              <Link href={href(`/blog/author/${post.author.slug}`)} className="flex items-center gap-3 hover:text-gold">
                {post.author.avatar ? (
                  <span className="relative h-9 w-9 overflow-hidden rounded-full"><Image src={post.author.avatar} alt="" fill sizes="36px" className="object-cover" /></span>
                ) : (
                  <span className="grid h-9 w-9 place-items-center rounded-full border border-gold/40 font-display text-gold">{post.author.name[0]}</span>
                )}
                <span>{fmt(t.blog.by, { name: post.author.name })}</span>
              </Link>
            )}
            <span>
              {t.blog.published} <time dateTime={post.publishedAt}>{formatDate(post.publishedAt, l)}</time>
            </span>
            {post.updatedAt.slice(0, 10) > post.publishedAt.slice(0, 10) && (
              <span>
                {t.blog.updated} <time dateTime={post.updatedAt}>{formatDate(post.updatedAt, l)}</time>
              </span>
            )}
            <span>{fmt(t.blog.minRead, { n: minutes })}</span>
          </div>
        </header>

        {post.cover && (
          <div className="wrap mt-12 md:mt-16">
            <div className="frame relative aspect-[16/10] md:aspect-[21/9]">
              <Image src={post.cover} alt={post.coverAlt} fill priority sizes="(min-width: 1600px) 1600px, 100vw" className="object-cover" />
            </div>
          </div>
        )}

        <div className="wrap mt-14 grid gap-12 md:mt-20 lg:grid-cols-[15rem_minmax(0,46rem)_1fr] lg:gap-16 xl:grid-cols-[17rem_minmax(0,46rem)_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-[calc(var(--header-h)+2rem)]">
              <Toc items={toc} title={t.blog.toc} />
            </div>
          </aside>

          <div className="min-w-0">
            {toc.length > 1 && (
              <details className="mb-10 border border-bone/10 p-4 lg:hidden">
                <summary className="label cursor-pointer text-gold">{t.blog.toc}</summary>
                <ol className="mt-4 space-y-2 text-sm">
                  {toc.map((i) => (
                    <li key={i.id} className={i.level === 3 ? 'pl-4' : ''}>
                      <a href={`#${i.id}`} className="text-bone/70 hover:text-gold">{i.text}</a>
                    </li>
                  ))}
                </ol>
              </details>
            )}

            {post.takeaways.length > 0 && (
              <aside className="mb-12 border border-gold/30 bg-gold/[0.05] p-6 md:p-8" aria-label={t.blog.takeaways}>
                <p className="label mb-5 text-gold">{t.blog.takeaways}</p>
                <ul className="space-y-3">
                  {post.takeaways.map((k, i) => (
                    <li key={i} className="flex gap-4 text-[1.02rem] leading-relaxed text-bone/85">
                      <span className="label pt-1 text-gold">{String(i + 1).padStart(2, '0')}</span>
                      <span>{k}</span>
                    </li>
                  ))}
                </ul>
              </aside>
            )}

            <div className="post-body" dangerouslySetInnerHTML={{ __html: html }} />

            {post.faq.length > 0 && (
              <section className="mt-20 border-t border-gold/20 pt-10" aria-labelledby="faq-title">
                <h2 id="faq-title" className="display text-[clamp(1.9rem,3.2vw,2.6rem)]">{t.blog.faq}</h2>
                <div className="mt-8 border-t border-bone/10">
                  {post.faq.map((f, i) => (
                    <details key={i} className="group border-b border-bone/10 py-5">
                      <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-[1.1rem] [&::-webkit-details-marker]:hidden">
                        <span>{f.q}</span>
                        <span aria-hidden className="text-gold transition-transform duration-500 group-open:rotate-45">+</span>
                      </summary>
                      <p className="whitespace-pre-line pt-4 leading-relaxed text-bone/70">{f.a}</p>
                    </details>
                  ))}
                </div>
              </section>
            )}

            {post.tags.length > 0 && (
              <ul className="mt-14 flex flex-wrap gap-2">
                {post.tags.map((tg) => (
                  <li key={tg.slug} className="label border border-bone/15 px-3 py-2 text-bone/55">#{tg.name}</li>
                ))}
              </ul>
            )}

            <div className="mt-14 border-t border-bone/10 pt-8 lg:hidden">
              <ShareBar url={url} title={post.title} labels={{ share: t.blog.share, copy: t.blog.copyLink, copied: t.blog.copied }} />
            </div>

            {post.author && (
              <section className="mt-16 flex gap-5 border border-bone/10 p-6 md:p-8" aria-label={t.blog.aboutAuthor}>
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-gold/40 font-display text-2xl text-gold">{post.author.name[0]}</span>
                <div>
                  <p className="label text-bone/45">{t.blog.aboutAuthor}</p>
                  <Link href={href(`/blog/author/${post.author.slug}`)} className="display mt-2 block text-2xl hover:text-gold">{post.author.name}</Link>
                  {post.author.role && <p className="text-sm text-gold">{post.author.role}</p>}
                  {post.author.bio && <p className="mt-3 leading-relaxed text-bone/65">{post.author.bio}</p>}
                </div>
              </section>
            )}
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-[calc(var(--header-h)+2rem)]">
              <ShareBar url={url} title={post.title} labels={{ share: t.blog.share, copy: t.blog.copyLink, copied: t.blog.copied }} />
            </div>
          </aside>
        </div>
      </article>

      {related.length > 0 && (
        <section className="wrap mt-28 pb-24 md:mt-36" aria-labelledby="related-title">
          <div className="mb-12 flex items-end justify-between gap-6 border-t border-gold/20 pt-6">
            <h2 id="related-title" className="display h-md">{t.blog.related}</h2>
            <Link href={href('/blog')} className="label link-line text-gold">{t.blog.back}</Link>
          </div>
          <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <PostCard key={p.id} post={p} t={t} locale={l} />
            ))}
          </div>
        </section>
      )}
      <BlogCta t={t} locale={l} />
    </>
  );
}
