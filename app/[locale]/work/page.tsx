import type { Metadata } from 'next';
import WorkIndex from '@/components/work/WorkIndex';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { fmt } from '@/lib/i18n';
import { alternatesFor } from '@/lib/i18n/languages';
import { getSiteContent } from '@/lib/cms';
import { getPage, pageMeta, withSeo } from '@/lib/pages';
import { PageBlocks } from '@/components/blocks/PageBlocks';

type Params = { locale: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const page = await getPage('work');
  const seo = pageMeta(page, locale);
  const { t, projects } = await getSiteContent(locale);
  return withSeo(seo, {
    title: t.meta.workTitle,
    description: fmt(t.meta.workDescription, { n: projects.length }),
    alternates: await alternatesFor(locale, '/work'),
  });
}

export default async function WorkPage({ params }: { params: Promise<Params> }) {
  const { locale } = await params;
  const { t } = await getSiteContent(locale as Locale);
  return (
    <PageBlocks slug="work">
    <div className="wrap pb-32 pt-[calc(var(--header-h)+8vh)]">
      <p className="label text-gold">{t.work.label}</p>
      <h1 className="display h-hero mt-6">
        {t.work.titleA} <span className="display-italic text-gold">{t.work.titleItalic}</span>
      </h1>
      <p className="mt-8 max-w-xl text-bone/70">{t.work.intro}</p>
      <div className="mt-16">
        <WorkIndex />
      </div>
    </div>
    </PageBlocks>
  );
}
