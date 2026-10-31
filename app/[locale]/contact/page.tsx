import type { Metadata } from 'next';
import Image from 'next/image';
import ContactForm from '@/components/ContactForm';
import { getProject } from '@/lib/content';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { alternatesFor } from '@/lib/i18n/languages';
import { getSiteContent } from '@/lib/cms';
import { getPage, pageMeta, withSeo } from '@/lib/pages';
import { PageBlocks } from '@/components/blocks/PageBlocks';

type Params = { locale: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const page = await getPage('contact');
  const seo = pageMeta(page, locale);
  const { t } = await getSiteContent(locale);
  return withSeo(seo, { title: t.meta.contactTitle, description: t.contact.body, alternates: await alternatesFor(locale, '/contact') });
}

const still = getProject('elysian-aura')!.media[0];

export default async function ContactPage({ params }: { params: Promise<Params> }) {
  const { locale } = await params;
  const { t, settings } = await getSiteContent(locale as Locale);
  const contact = settings.contact;
  return (
    <PageBlocks slug="contact">
    <section className="relative min-h-[100svh] pt-[var(--header-h)]">
      <div className="absolute inset-0 -z-10">
        <Image src={still.id} alt="" fill priority sizes="100vw" className="object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-b from-night/40 via-night/80 to-night" />
      </div>
      <div className="wrap grid gap-16 py-20 md:grid-cols-12 md:py-28">
        <div className="md:col-span-5">
          <p className="label text-gold">{t.contact.pageLabel}</p>
          <h1 className="display h-xl mt-6">
            {t.contact.pageA} <span className="display-italic text-gold">{t.contact.pageItalic}</span>
            {t.contact.pageB}
          </h1>
          <p className="body-lg mt-8 text-bone/75">{t.contact.body}</p>

          <dl className="mt-14 space-y-8">
            <div>
              <dt className="label text-bone/40">{t.common.email}</dt>
              <dd className="mt-2 space-y-1 text-lg">
                <a href={`mailto:${contact.email}`} className="link-line block w-fit text-gold">
                  {contact.email}
                </a>
                <a href={`mailto:${contact.marketingEmail}`} className="link-line block w-fit">
                  {contact.marketingEmail}
                </a>
              </dd>
            </div>
            <div>
              <dt className="label text-bone/40">{t.common.studio}</dt>
              <dd className="mt-2 text-lg">{contact.address}</dd>
            </div>
            <div>
              <dt className="label text-bone/40">{t.common.social}</dt>
              <dd className="mt-3 flex flex-wrap gap-6">
                {contact.social.map((s) => (
                  <a key={s.href} href={s.href} target="_blank" rel="noreferrer noopener" className="label link-line">
                    {s.label}
                  </a>
                ))}
              </dd>
            </div>
          </dl>
        </div>
        <div className="md:col-span-6 md:col-start-7">
          <div className="border border-gold/30 bg-night/70 p-6 backdrop-blur-md sm:p-10">
            <h2 className="display text-3xl">{t.contact.cta}</h2>
            <div className="mt-10">
              <ContactForm />
            </div>
          </div>
        </div>
      </div>
    </section>
    </PageBlocks>
  );
}
