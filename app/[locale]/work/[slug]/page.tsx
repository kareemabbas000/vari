import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProjectExhibition from '@/components/work/ProjectExhibition';
import { PageBlocks } from '@/components/blocks/PageBlocks';
import { mediaUrl, ogImageUrl } from '@/lib/image-loader';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { alternatesFor, getLanguages } from '@/lib/i18n/languages';
import { getProjectSlugs, getSiteContent } from '@/lib/cms';
import { fmt } from '@/lib/i18n';
import { site, type Project } from '@/lib/content';

/**
 * Search titles and descriptions from the project's own facts (name, label, location).
 * "Black Home — VARI Studio" said nothing about the work; nothing here is invented.
 * The site template appends " — VARI Studio" (15 characters), so the title part stays ≤ 45.
 */
const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();
function projectTitle(p: Project) {
  const label = p.label && !same(p.label, p.title) ? p.label : '';
  const candidates = [
    label && p.location ? `${p.title} — ${label}, ${p.location}` : '',
    label ? `${p.title} — ${label}` : '',
    p.location ? `${p.title}, ${p.location}` : '',
  ].filter(Boolean);
  return candidates.find((c) => c.length <= 45) ?? p.title;
}
function projectDescription(p: Project, template: string, discipline: string) {
  const own = p.description.join(' ').trim();
  if (own.length >= 120) return own.length > 158 ? `${own.slice(0, own.lastIndexOf(' ', 155))}…` : own;
  const label = p.label && !same(p.label, p.title) ? p.label.charAt(0).toLowerCase() + p.label.slice(1) : '';
  const fallback = discipline.toLowerCase(); // e.g. "Exterior Project", whose label repeats its title
  return fmt(template, { title: p.title, label: label || fallback, where: p.location ? `, ${p.location}` : '' });
}

type Params = { locale: string; slug: string };

export async function generateStaticParams() {
  const [slugs, langs] = await Promise.all([getProjectSlugs(), getLanguages()]);
  return langs.codes.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
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
  const { t } = await getSiteContent(locale);
  const description = p.seoDescription || projectDescription(p, t.meta.projectDescription, t.disciplines[p.discipline]);
  return {
    title: p.seoTitle || projectTitle(p),
    description,
    alternates: await alternatesFor(locale, `/work/${p.slug}`),
    openGraph: {
      title: `${p.title} — VARI Studio`,
      description,
      locale: (await getLanguages()).byCode[locale]?.og,
      images: [{ url: ogImageUrl(p.media[0].id), width: 1200, height: 630, alt: p.media[0].alt }],
    },
  };
}

export default async function ProjectPage({ params }: { params: Promise<Params> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const found = await load(locale, slug);
  if (!found) notFound();
  const { list, i, project } = found;
  const { t } = await getSiteContent(locale as Locale);
  const prev = list[(i - 1 + list.length) % list.length];
  const next = list[(i + 1) % list.length];

  const base = site.url.replace(/\/$/, '');
  const url = `${base}/${locale}/work/${project.slug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
    '@type': 'CreativeWork',
    '@id': `${url}#work`,
    url,
    name: project.title,
    inLanguage: (await getLanguages()).byCode[locale]?.hreflang ?? locale,
    description: project.description.join(' '),
    image: project.media.map((m) => mediaUrl(m.id, 1600)),
    creator: { '@id': `${base}/#org` },
    // The place the project depicts (locationCreated would mean where the image was made).
    ...(project.location ? { contentLocation: { '@type': 'Place', name: project.location } } : {}),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'VARI Studio', item: `${base}/${locale}` },
          { '@type': 'ListItem', position: 2, name: t.meta.workTitle, item: `${base}/${locale}/work` },
          { '@type': 'ListItem', position: 3, name: project.title, item: url },
        ],
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* Blocks placed around "Project page" in the builder appear on every project. */}
      <PageBlocks slug="project-template">
        <ProjectExhibition project={project} prev={prev} next={next} index={i} total={list.length} />
      </PageBlocks>
    </>
  );
}
