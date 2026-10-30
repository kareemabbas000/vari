import type { Metadata } from 'next';
import { Suspense } from 'react';
import WorkIndex from '@/components/work/WorkIndex';
import { projects } from '@/lib/content';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { alternatesFor, fmt, getDictionary } from '@/lib/i18n';

type Params = { locale: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return {
    title: t.meta.workTitle,
    description: fmt(t.meta.workDescription, { n: projects.length }),
    alternates: alternatesFor(locale, '/work'),
  };
}

export default async function WorkPage({ params }: { params: Promise<Params> }) {
  const { locale } = await params;
  const t = getDictionary(locale as Locale);
  return (
    <div className="wrap pb-32 pt-[calc(var(--header-h)+8vh)]">
      <p className="label text-gold">{t.work.label}</p>
      <h1 className="display h-hero mt-6">
        {t.work.titleA} <span className="display-italic text-gold">{t.work.titleItalic}</span>
      </h1>
      <p className="mt-8 max-w-xl text-bone/70">{t.work.intro}</p>
      <div className="mt-16">
        <Suspense>
          <WorkIndex />
        </Suspense>
      </div>
    </div>
  );
}
