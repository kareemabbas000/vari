import type { Metadata } from 'next';
import BlogIndex from '@/components/blog/BlogIndex';
import { PageBlocks } from '@/components/blocks/PageBlocks';
import { getSiteContent } from '@/lib/cms';
import { getCategories, getPosts } from '@/lib/blog';
import { alternatesFor } from '@/lib/i18n/languages';
import { isLocale, localizePath, type Locale } from '@/lib/i18n/config';
import { site } from '@/lib/content';

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const { t } = await getSiteContent(locale);
  const page = Math.max(1, Number((await searchParams).page) || 1);
  return {
    title: page > 1 ? `${t.blog.metaTitle} — ${page}` : t.blog.metaTitle,
    description: t.blog.metaDescription,
    alternates: { ...await alternatesFor(locale, '/blog'), types: { 'application/rss+xml': `${site.url.replace(/\/$/, '')}${localizePath(locale, '/blog/rss.xml')}` } },
    openGraph: { title: t.blog.metaTitle, description: t.blog.metaDescription, type: 'website' },
  };
}

export default async function BlogPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const l = locale as Locale;
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const [{ t }, posts, categories] = await Promise.all([getSiteContent(l), getPosts(l), getCategories(l)]);
  return (
    <PageBlocks slug="blog">
      <BlogIndex t={t} locale={l} posts={posts} categories={categories} page={page} basePath="/blog" />
    </PageBlocks>
  );
}
