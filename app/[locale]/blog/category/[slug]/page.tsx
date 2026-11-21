import type { Metadata } from 'next';
import { CategoryList, categoryMetadata, enabledLocales } from '@/components/blog/lists';
import { getPosts } from '@/lib/blog';
import type { Locale } from '@/lib/i18n/config';

type Props = { params: Promise<{ locale: string; slug: string }> };

export const dynamicParams = true;

/** Categories that hold posts in this language are built at deploy time. */
export async function generateStaticParams({ params }: { params: { locale: string } }) {
  if (!(await enabledLocales()).includes(params.locale as Locale)) return [];
  const posts = await getPosts(params.locale as Locale);
  return [...new Set(posts.map((p) => p.category?.slug).filter(Boolean))].map((slug) => ({ slug: slug as string }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  return categoryMetadata(locale, slug, 1);
}

export default async function CategoryPage({ params }: Props) {
  const { locale, slug } = await params;
  return <CategoryList locale={locale} slug={slug} page={1} />;
}
