import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import RevealText from '@/components/RevealText';
import Services from '@/components/home/Services';
import { isLocale, localizePath, type Locale } from '@/lib/i18n/config';
import { fmt } from '@/lib/i18n';
import { alternatesFor } from '@/lib/i18n/languages';
import { getSiteContent } from '@/lib/cms';
import { getPage, pageMeta, withSeo } from '@/lib/pages';
import { PageBlocks } from '@/components/blocks/PageBlocks';
import { SOLUTION_LINKS } from '@/lib/solutions';

type Params = { locale: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const page = await getPage('services');
  const seo = pageMeta(page, locale);
  const { t } = await getSiteContent(locale);
  return withSeo(seo, {
    title: t.meta.servicesTitle,
    description: `${t.services.title}. ${t.services.items.map((s) => s.title).join(', ')}.`,
    alternates: await alternatesFor(locale, '/services'),
  });
}

export default async function ServicesPage({ params }: { params: Promise<Params> }) {
  const { locale } = await params;
  const { t, projects: all, services } = await getSiteContent(locale as Locale);
  const href = (p: string) => localizePath(locale as Locale, p);
  // Featured projects lead; fall back to the first three.
  const proofs = [...all.filter((p) => p.featured), ...all.filter((p) => !p.featured)].slice(0, 3);
  return (
    <PageBlocks slug="services">
    <>
      <section className="wrap pb-16 pt-[calc(var(--header-h)+12vh)] md:pb-24">
        <p className="label text-gold">{t.services.pageLabel}</p>
        <RevealText as="h1" trigger="mount" text={t.services.pageTitle} className="display h-xl mt-6 max-w-[16ch]" italic={t.services.pageItalic} />
        <p className="body-lg mt-10 max-w-2xl text-bone/75">
          {fmt(t.services.pageIntro, { n: services.length })}
        </p>
      </section>

      <Services standalone />

      <section className="wrap border-t border-gold/15 py-20 md:py-28" aria-labelledby="solutions-title">
        <h2 id="solutions-title" className="label text-gold">{t.solutions.label}</h2>
        <ul className="mt-10 grid gap-px bg-gold/15 sm:grid-cols-2">
          {SOLUTION_LINKS.map((s) => (
            <li key={s.key} className="bg-night">
              <Link href={href(s.path)} className="group flex items-center justify-between gap-6 px-1 py-6 sm:px-6">
                <span className="display text-xl md:text-2xl">{t.solutions[s.key]}</span>
                <span aria-hidden className="text-gold transition-transform duration-700 ease-expo group-hover:translate-x-2">→</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="wrap py-24 md:py-36">
        <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <h2 className="display h-lg max-w-[16ch]">
            {t.services.seenA} <span className="display-italic text-gold">{t.services.seenB}</span>
          </h2>
          <Link href={href('/work')} className="label link-line self-start text-gold md:self-auto">
            {t.services.allProjects}
          </Link>
        </div>
        <ul className="grid gap-6 md:grid-cols-3">
          {proofs.map((p) => (
            <li key={p.slug}>
              <Link href={href(`/work/${p.slug}`)} className="group block">
                <div className="frame aspect-[4/5]">
                  <Image src={p.media[0].id} alt={p.media[0].alt} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-[1.6s] ease-expo group-hover:scale-105" />
                </div>
                <p className="label mt-4 text-gold">{p.categoryName}{p.location ? ` · ${p.location}` : ''}</p>
                <h3 className="display mt-2 text-2xl">{p.title}</h3>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="wrap border-t border-gold/15 py-24 text-center md:py-32">
        <p className="label text-gold">{t.contact.cta}</p>
        <h2 className="display h-xl mx-auto mt-6 max-w-[18ch]">{t.contact.title}</h2>
        <div className="mt-12 flex flex-wrap justify-center gap-4">
          <Link href={href('/contact?intent=design')} className="btn btn-solid">
            <span>{t.hero.ctaDesign}</span>
          </Link>
          <Link href={href('/contact?intent=visualize')} className="btn">
            <span>{t.hero.ctaVisualize}</span>
          </Link>
        </div>
      </section>
    </>
    </PageBlocks>
  );
}
