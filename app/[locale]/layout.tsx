import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { display, sans } from '@/lib/fonts';
import '../globals.css';
import SmoothScroll from '@/components/SmoothScroll';
import Tracking from '@/components/Tracking';
import { VERIFY_PATTERN } from '@/lib/tracking';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { I18nProvider } from '@/components/I18nProvider';
import { brandAssets, site } from '@/lib/content';
import { mediaUrl, ogImageUrl } from '@/lib/image-loader';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { getLanguages } from '@/lib/i18n/languages';
import { alternatesFor } from '@/lib/i18n/languages';
import { getSiteContent } from '@/lib/cms';

const AUTH_LINK_FORWARD = `document.documentElement.classList.add('js');(function(){var h=location.hash,q=location.search;if(/[#&](access_token|error_code)=/.test(h)||/[?&]token_hash=/.test(q)){location.replace('/admin/accept'+q+h);}})();`;


const ogImage = ogImageUrl('b80319_425c2f36f32b420da9c91cbd856c607d~mv2.jpg');

type Params = { locale: string };

// Enabled languages are pre-rendered; a language enabled later renders on first visit.
export const dynamicParams = true;

export async function generateStaticParams() {
  return (await getLanguages()).enabled.map((l) => ({ locale: l.code }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const [{ t, settings }, langs] = await Promise.all([getSiteContent(locale), getLanguages()]);
  const meta = langs.byCode[locale];
  if (!meta?.enabled) return {};
  const v = settings.verification;
  const ok = (x?: string) => (x && VERIFY_PATTERN.test(x) ? x : undefined);
  const other: Record<string, string> = {};
  if (ok(v.bing)) other['msvalidate.01'] = v.bing!;
  if (ok(v.facebook)) other['facebook-domain-verification'] = v.facebook!;
  if (ok(v.pinterest)) other['p:domain_verify'] = v.pinterest!;
  return {
    metadataBase: new URL(site.url),
    title: { default: t.meta.siteTitle, template: t.meta.titleTemplate },
    description: t.meta.description,
    applicationName: site.name,
    alternates: await alternatesFor(locale, '/'),
    openGraph: {
      type: 'website',
      siteName: 'VARI Studio',
      locale: meta.og,
      alternateLocale: langs.enabled.filter((l) => l.code !== locale).map((l) => l.og),
      title: t.meta.ogTitle,
      description: t.meta.description,
      url: `/${locale}`,
      images: [{ url: ogImage, width: 1200, height: 630, alt: t.meta.ogAlt }],
    },
    twitter: { card: 'summary_large_image', title: t.meta.ogTitle, description: t.meta.description, images: [ogImage] },
    verification: { google: ok(v.google), yandex: ok(v.yandex), other },
    icons: { icon: mediaUrl(brandAssets.emblem.id, 96), apple: mediaUrl(brandAssets.emblem.id, 180) },
  };
}

export const viewport: Viewport = {
  themeColor: '#0C0B0A',
  width: 'device-width',
  initialScale: 1,
};

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<Params> }) {
  const { locale } = await params;
  const langs = await getLanguages();
  // Disabled or unknown languages do not exist on the site (middleware redirects them).
  if (!isLocale(locale) || !langs.byCode[locale]?.enabled) notFound();
  const meta = langs.byCode[locale];
  const content = await getSiteContent(locale as Locale);
  const { t, settings } = content;

  const base = site.url.replace(/\/$/, '');
  // One graph: the studio has a stable @id that project pages and articles point to.
  const org = {
    '@type': 'ProfessionalService',
    '@id': `${base}/#org`,
    name: site.name,
    url: `${site.url.replace(/\/$/, '')}/${locale}`,
    description: t.meta.description,
    inLanguage: meta.hreflang,
    availableLanguage: langs.enabled.map((l) => l.englishName),
    email: settings.contact.email,
    logo: `${site.url.replace(/\/$/, '')}/brand/vari-logo-dark.png`,
    image: ogImage,
    address: { '@type': 'PostalAddress', streetAddress: '742 Golf District', addressLocality: 'Al Shorouk City, Cairo', addressCountry: 'EG' },
    sameAs: settings.contact.social.map((s) => s.href),
  };
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [org, { '@type': 'WebSite', '@id': `${base}/#website`, url: base, name: site.name, inLanguage: meta.hreflang, publisher: { '@id': `${base}/#org` } }],
  };

  return (
    <html lang={meta.hreflang} dir={meta.dir} className={`${display.variable} ${sans.variable}`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://static.wixstatic.com" crossOrigin="anonymous" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        {/* Sign-in links from Supabase land on the Site URL when /admin/accept is not an allowed
            redirect; forward them to the control panel before anything renders. */}
        <script dangerouslySetInnerHTML={{ __html: AUTH_LINK_FORWARD }} />
      </head>
      <body>
        <I18nProvider content={content}>
          <a href="#main" className="label fixed left-4 top-4 z-[100] -translate-y-24 bg-gold px-4 py-3 text-night focus:translate-y-0">
            {t.common.skip}
          </a>
          <SmoothScroll>
            <Header />
            <main id="main">{children}</main>
            <Footer />
          </SmoothScroll>
          <Tracking />
        </I18nProvider>
      </body>
    </html>
  );
}
