import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import BlogIndex from '@/components/blog/BlogIndex';
import { getSiteContent } from '@/lib/cms';
import { getCategories, getPosts } from '@/lib/blog';
import { alternatesFor, fmt } from '@/lib/i18n';
import { isLocale, type Locale } from '@/lib/i18n/config';

type Props = { params: Promise<{ locale: string; slug: string }>; searchParams: Promise<{ page?: string }> };

async function load(locale: Locale, slug: string) {
  const [categories, posts] = await Promise.all([getCategories(locale), getPosts(locale)]);
  const category = categories.find((c) => c.slug === slug);
  return category ? { category, categories, posts: posts.filter((p) => p.category?.slug === slug) } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const [data, { t }] = await Promise.all([load(locale, slug), getSiteContent(locale)]);
  if (!data) return {};
  const title = fmt(t.blog.categoryTitle, { name: data.category.name });
  return {
    title,
    description: data.category.description || t.blog.metaDescription,
    alternates: alternatesFor(locale, `/blog/category/${slug}`),
    // Thin category pages stay out of the index until they hold a few articles.
    robots: data.posts.length < 2 ? { index: false, follow: true } : undefined,
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { locale, slug } = await params;
  const l = locale as Locale;
  const [data, { t }] = await Promise.all([load(l, slug), getSiteContent(l)]);
  if (!data) notFound();
  const page = Math.max(1, Number((await searchParams).page) || 1);
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
