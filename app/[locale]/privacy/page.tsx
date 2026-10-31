import type { Metadata } from 'next';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { alternatesFor } from '@/lib/i18n/languages';
import { getSiteContent } from '@/lib/cms';
import { PageBlocks } from '@/components/blocks/PageBlocks';
import { hasTracking } from '@/lib/tracking';

const COOKIE_SECTION = 6;

type Params = { locale: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = (await getSiteContent(locale)).t.privacy;
  return { title: t.title, description: t.intro, alternates: await alternatesFor(locale, '/privacy') };
}

export default async function PrivacyPage({ params }: { params: Promise<Params> }) {
  const { locale } = await params;
  const { t: dict, settings } = await getSiteContent(locale as Locale);
  const t = dict.privacy;
  // With tracking switched on in the panel, the cookie section describes it.
  const tracking = hasTracking(settings.tracking);
  const sections = t.sections.map((s, i) => (tracking && i === COOKIE_SECTION ? { ...s, p: dict.consent.privacyCookies } : s));
  return (
    <PageBlocks slug="privacy">
    <article className="wrap pb-28 pt-[calc(var(--header-h)+8vh)]">
      <header className="max-w-3xl">
        <p className="label text-gold">{t.updated}</p>
        <h1 className="display h-xl mt-6">{t.title}</h1>
        <p className="body-lg mt-8 text-bone/75">{t.intro}</p>
      </header>
      <div className="mt-16 grid max-w-5xl gap-x-16 gap-y-12 md:grid-cols-[14rem_1fr]">
        {sections.map((s, i) => (
          <section key={s.h} className="contents">
            <h2 className="label border-t border-gold/25 pt-4 text-gold">
              {String(i + 1).padStart(2, '0')} — {s.h}
            </h2>
            <div className="space-y-4 border-t border-bone/10 pt-4 text-bone/75 md:text-lg md:leading-relaxed">
              {s.p.map((p, j) => (
                <p key={j}>{p}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
    </PageBlocks>
  );
}
