import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProjectExhibition from '@/components/work/ProjectExhibition';
import { mediaUrl } from '@/lib/image-loader';
import { isLocale, localeMeta, locales, type Locale } from '@/lib/i18n/config';
import { alternatesFor } from '@/lib/i18n';
import { getProjectSlugs, getSiteContent } from '@/lib/cms';

type Params = { locale: string; slug: string };

export async function generateStaticParams() {
  const slugs = await getProjectSlugs();
  return locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

// Projects added in the panel later are rendered on first request, then cached.
export const dynamicParams = true;

async function load(locale: Locale, slug: string) {
  const list = (await getSiteContent(locale)).projects;
  const i = list.findIndex((p) => p.slug === slug);
  if (i < 0) return null;
  return { list, i, project: list[i] };
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const found = await load(locale, slug);
  if (!found) return {};
  const p = found.project;
  const description = p.description.join(' ').slice(0, 300);
  return {
    title: p.title,
    description,
    alternates: alternatesFor(locale, `/work/${p.slug}`),
    openGraph: {
      title: `${p.title} — VARI Studio`,
      description,
      locale: localeMeta[locale].og,
      images: [{ url: mediaUrl(p.media[0].id, 1200), alt: p.media[0].alt }],
    },
  };
}

export default async function ProjectPage({ params }: { params: Promise<Params> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const found = await load(locale, slug);
  if (!found) notFound();
  const { list, i, project } = found;
  const prev = list[(i - 1 + list.length) % list.length];
  const next = list[(i + 1) % list.length];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: project.title,
    inLanguage: localeMeta[locale].hreflang,
    description: project.description.join(' '),
    image: project.media.map((m) => mediaUrl(m.id, 1600)),
    creator: { '@type': 'Organization', name: 'VARI Studio' },
    ...(project.location ? { locationCreated: { '@type': 'Place', name: project.location } } : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProjectExhibition project={project} prev={prev} next={next} index={i} total={list.length} />
    </>
  );
}
