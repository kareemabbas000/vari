import type { Metadata } from 'next';
import { BlogList, blogListMetadata } from '@/components/blog/lists';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return blogListMetadata((await params).locale, 1);
}

export default async function BlogPage({ params }: Props) {
  return <BlogList locale={(await params).locale} page={1} />;
}
