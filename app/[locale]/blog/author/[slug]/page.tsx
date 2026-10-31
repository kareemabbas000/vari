import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import BlogIndex from '@/components/blog/BlogIndex';
import { getSiteContent } from '@/lib/cms';
import { getAuthor, getCategories, getPosts } from '@/lib/blog';
import { fmt } from '@/lib/i18n';
import { alternatesFor } from '@/lib/i18n/languages';
import { isLocale, type Locale } from '@/lib/i18n/config';

type Props = { params: Promise<{ locale: string; slug: string }>; searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const [author, { t }] = await Promise.all([getAuthor(locale, slug), getSiteContent(locale)]);
  if (!author) return {};
  return { title: fmt(t.blog.authorTitle, { name: author.name }), description: author.bio || t.blog.metaDescription, alternates: await alternatesFor(locale, `/blog/author/${slug}`) };
}

export default async function AuthorPage({ params, searchParams }: Props) {
  const { locale, slug } = await params;
  const l = locale as Locale;
  const [author, { t }, posts, categories] = await Promise.all([getAuthor(l, slug), getSiteContent(l), getPosts(l), getCategories(l)]);
  if (!author) notFound();
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const ld = { '@context': 'https://schema.org', '@type': slug === 'vari-studio' ? 'Organization' : 'Person', name: author.name, description: author.bio, jobTitle: slug === 'vari-studio' ? undefined : author.role, sameAs: author.links.map((x) => x.href) };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
      <BlogIndex t={t} locale={l} posts={posts.filter((p) => p.author?.slug === slug)} categories={categories} page={page} basePath={`/blog/author/${slug}`} heading={author.name} intro={author.bio} label={author.role || t.blog.aboutAuthor} />
    </>
  );
}
