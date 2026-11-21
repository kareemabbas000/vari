import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BlogList, blogListMetadata, enabledLocales, extraPages, pageParam } from '@/components/blog/lists';
import { getPosts } from '@/lib/blog';
import type { Locale } from '@/lib/i18n/config';

type Props = { params: Promise<{ locale: string; n: string }> };

export const dynamicParams = true;

export async function generateStaticParams({ params }: { params: { locale: string } }) {
  if (!(await enabledLocales()).includes(params.locale as Locale)) return [];
  return extraPages((await getPosts(params.locale as Locale)).length).map((n) => ({ n }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, n } = await params;
  return pageParam(n) ? blogListMetadata(locale, pageParam(n)) : {};
}

export default async function BlogListPage({ params }: Props) {
  const { locale, n } = await params;
  if (!pageParam(n)) notFound();
  return <BlogList locale={locale} page={pageParam(n)} />;
}
