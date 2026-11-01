import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Interleave } from '@/components/blocks/PageBlocks';
import { getPage, pageMeta, seoTitle } from '@/lib/pages';
import { pick } from '@/lib/cms';
import { alternatesFor } from '@/lib/i18n/languages';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { RESERVED_SLUGS } from '@/lib/blocks/schema';

type Params = { locale: string; rest: string[] };

/** Pages made in the page builder; any other unknown path renders the 404 page. */
async function load(rest: string[]) {
  const slug = rest.map((s) => decodeURIComponent(s).toLowerCase()).join('/');
  if (!/^[a-z0-9-]+(\/[a-z0-9-]+)*$/.test(slug) || RESERVED_SLUGS.includes(slug.split('/')[0])) return null;
  const page = await getPage(slug);
  return page?.kind === 'custom' ? page : null;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale, rest } = await params;
  if (!isLocale(locale)) return {};
  const page = await load(rest);
  if (!page) return {};
  const seo = pageMeta(page, locale);
  const title = seo.title || pick(page.title, locale);
  return {
    title: seoTitle(title),
    description: seo.description || undefined,
    alternates: await alternatesFor(locale, `/${page.slug}`),
    openGraph: { title, description: seo.description || undefined, ...(seo.image ? { images: [{ url: seo.image }] } : {}) },
    robots: seo.noindex ? { index: false, follow: true } : undefined,
  };
}

export default async function CustomPage({ params }: { params: Promise<Params> }) {
  const { locale, rest } = await params;
  const page = await load(rest);
  if (!page) notFound();
  const blocks = page.blocks.filter((b) => !b.hidden);
  const hasH1 = blocks.some((b) => b.type === 'hero' || (b.type === 'heading' && b.props?.level === 'h1'));
  return (
    // Leave room for the fixed header unless the page opens with a full-bleed hero.
    <div className={blocks[0]?.type === 'hero' || (blocks[0]?.type === 'module' && blocks[0]?.props?.module === 'hero') ? '' : 'pt-[var(--header-h)]'}>
      {!hasH1 && <h1 className="sr-only">{pick(page.title, locale as Locale)}</h1>}
      <Interleave blocks={blocks} modules={{}} />
    </div>
  );
}
