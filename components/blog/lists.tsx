import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import BlogIndex, { pageCount } from '@/components/blog/BlogIndex';
import { PageBlocks } from '@/components/blocks/PageBlocks';
import { getSiteContent } from '@/lib/cms';
import { getAuthor, getCategories, getPosts } from '@/lib/blog';
import { fmt } from '@/lib/i18n';
import { alternatesFor, getLanguages } from '@/lib/i18n/languages';
import { isLocale, localizePath, type Locale } from '@/lib/i18n/config';
import { site } from '@/lib/content';

/**
 * Blog lists (all posts, one category, one author) and their numbered pages. Page 1 lives at
 * the list's own address, page n at <address>/page/n. No query strings, so every list page is
 * a cached static page refreshed only when the blog is published.
 */

/** The n of /page/n: 2–99, anything else is not a page. */
export const pageParam = (n: string) => (/^([2-9]|[1-9][0-9])$/.test(n) ? Number(n) : 0);
const withPage = (path: string, page: number) => (page > 1 ? `${path}/page/${page}` : path);
const pageTitle = (title: string, page: number) => (page > 1 ? `${title} — ${page}` : title);

/** Locales a list is built for at deploy time (the others render on first visit). */
export async function enabledLocales(): Promise<Locale[]> {
  return (await getLanguages()).codes;
}

/** Static params for numbered pages (2…n) of a list with this many posts. */
export const extraPages = (posts: number) => Array.from({ length: pageCount(posts) - 1 }, (_, i) => String(i + 2));

// --- All posts -------------------------------------------------------------------------------

export async function blogListMetadata(locale: string, page: number): Promise<Metadata> {
  if (!isLocale(locale)) return {};
  const { t } = await getSiteContent(locale);
  return {
    title: pageTitle(t.blog.metaTitle, page),
    description: t.blog.metaDescription,
    alternates: { ...await alternatesFor(locale, withPage('/blog', page)), types: { 'application/rss+xml': `${site.url.replace(/\/$/, '')}${localizePath(locale, '/blog/rss.xml')}` } },
    openGraph: { title: t.blog.metaTitle, description: t.blog.metaDescription, type: 'website' },
  };
}

export async function BlogList({ locale, page }: { locale: string; page: number }) {
  const l = locale as Locale;
  const [{ t }, posts, categories] = await Promise.all([getSiteContent(l), getPosts(l), getCategories(l)]);
  // A page number past the end (after posts were removed) goes back to the first page.
  if (page > pageCount(posts.length)) permanentRedirect(localizePath(l, '/blog'));
  return (
    <PageBlocks slug="blog">
      <BlogIndex t={t} locale={l} posts={posts} categories={categories} page={page} basePath="/blog" />
    </PageBlocks>
  );
}

// --- One category ----------------------------------------------------------------------------

export async function loadCategory(locale: Locale, slug: string) {
  const [categories, posts] = await Promise.all([getCategories(locale), getPosts(locale)]);
  const category = categories.find((c) => c.slug === slug);
  return category ? { category, categories, posts: posts.filter((p) => p.category?.slug === slug) } : null;
}

export async function categoryMetadata(locale: string, slug: string, page: number): Promise<Metadata> {
  if (!isLocale(locale)) return {};
  const [data, { t }] = await Promise.all([loadCategory(locale, slug), getSiteContent(locale)]);
  if (!data) return {};
  return {
    title: pageTitle(fmt(t.blog.categoryTitle, { name: data.category.name }), page),
    description: data.category.description || t.blog.metaDescription,
    alternates: await alternatesFor(locale, withPage(`/blog/category/${slug}`, page)),
    // Thin category pages stay out of the index until they hold a few articles.
    robots: data.posts.length < 2 ? { index: false, follow: true } : undefined,
  };
}

export async function CategoryList({ locale, slug, page }: { locale: string; slug: string; page: number }) {
  const l = locale as Locale;
  const [data, { t }] = await Promise.all([loadCategory(l, slug), getSiteContent(l)]);
  if (!data) notFound();
  if (page > pageCount(data.posts.length)) permanentRedirect(localizePath(l, `/blog/category/${slug}`));
  return (
    <BlogIndex
      t={t}
      locale={l}
      posts={data.posts}
      categories={data.categories}
      active={slug}
      page={page}
      basePath={`/blog/category/${slug}`}
      heading={data.category.name}
      intro={data.category.description || t.blog.intro}
    />
  );
}

// --- One author ------------------------------------------------------------------------------

export async function authorMetadata(locale: string, slug: string, page: number): Promise<Metadata> {
  if (!isLocale(locale)) return {};
  const [author, { t }] = await Promise.all([getAuthor(locale, slug), getSiteContent(locale)]);
  if (!author) return {};
  return { title: pageTitle(fmt(t.blog.authorTitle, { name: author.name }), page), description: author.bio || t.blog.metaDescription, alternates: await alternatesFor(locale, withPage(`/blog/author/${slug}`, page)) };
}

export async function AuthorList({ locale, slug, page }: { locale: string; slug: string; page: number }) {
  const l = locale as Locale;
  const [author, { t }, posts, categories] = await Promise.all([getAuthor(l, slug), getSiteContent(l), getPosts(l), getCategories(l)]);
  if (!author) notFound();
  const own = posts.filter((p) => p.author?.slug === slug);
  if (page > pageCount(own.length)) permanentRedirect(localizePath(l, `/blog/author/${slug}`));
  const ld = { '@context': 'https://schema.org', '@type': slug === 'vari-studio' ? 'Organization' : 'Person', name: author.name, description: author.bio, jobTitle: slug === 'vari-studio' ? undefined : author.role, sameAs: author.links.map((x) => x.href) };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
      <BlogIndex t={t} locale={l} posts={own} categories={categories} page={page} basePath={`/blog/author/${slug}`} heading={author.name} intro={author.bio} label={author.role || t.blog.aboutAuthor} />
    </>
  );
}
