import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CategoryList, categoryMetadata, pageParam } from '@/components/blog/lists';

type Props = { params: Promise<{ locale: string; slug: string; n: string }> };

// Rendered on first visit, then cached like every other page until the blog is published.
export const dynamicParams = true;
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug, n } = await params;
  return pageParam(n) ? categoryMetadata(locale, slug, pageParam(n)) : {};
}

export default async function CategoryListPage({ params }: Props) {
  const { locale, slug, n } = await params;
  if (!pageParam(n)) notFound();
  return <CategoryList locale={locale} slug={slug} page={pageParam(n)} />;
}
