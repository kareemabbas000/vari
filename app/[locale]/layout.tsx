import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { Fraunces, Jost } from 'next/font/google';
import '../globals.css';
import SmoothScroll from '@/components/SmoothScroll';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { I18nProvider } from '@/components/I18nProvider';
import { brandAssets, contact, site } from '@/lib/content';
import { mediaUrl } from '@/lib/image-loader';
import { isLocale, localeMeta, locales, type Locale } from '@/lib/i18n/config';
import { alternatesFor, getDictionary } from '@/lib/i18n';

// Fraunces is the display face of the original site (fraunces_120pt light / semibold).
const display = Fraunces({
  subsets: ['latin', 'latin-ext'],
  style: ['normal', 'italic'],
  axes: ['opsz', 'SOFT', 'WONK'],
  variable: '--font-display',
  display: 'swap',
});

// The original used licensed Futura / DIN Next / Avenir. Jost is a free geometric
// sans in the Futura family of forms — a stand-in, documented in docs/BRAND_REFERENCE.md.
const sans = Jost({ subsets: ['latin', 'latin-ext'], variable: '--font-sans', display: 'swap' });

const ogImage = mediaUrl('b80319_425c2f36f32b420da9c91cbd856c607d~mv2.jpg', 1200);

type Params = { locale: string };

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return {
    metadataBase: new URL(site.url),
    title: { default: t.meta.siteTitle, template: t.meta.titleTemplate },
    description: t.meta.description,
    applicationName: site.name,
    alternates: alternatesFor(locale, '/'),
    openGraph: {
      type: 'website',
      siteName: 'VARI Studio',
      locale: localeMeta[locale].og,
      alternateLocale: locales.filter((l) => l !== locale).map((l) => localeMeta[l].og),
      title: t.meta.ogTitle,
      description: t.meta.description,
      url: `/${locale}`,
      images: [{ url: ogImage, width: 1200, alt: t.meta.ogAlt }],
    },
    twitter: { card: 'summary_large_image', title: t.meta.ogTitle, description: t.meta.description, images: [ogImage] },
    verification: { google: '96MaJjmpseUkOLOGNvNTymidm2-lxTLQyuHL_vBQagk' },
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
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale as Locale);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: site.name,
    url: `${site.url.replace(/\/$/, '')}/${locale}`,
    description: t.meta.description,
    inLanguage: localeMeta[locale].hreflang,
    availableLanguage: locales.map((l) => localeMeta[l].name),
    email: contact.email,
    logo: `${site.url.replace(/\/$/, '')}/brand/vari-logo-dark.png`,
    image: ogImage,
    address: { '@type': 'PostalAddress', streetAddress: '742 Golf District', addressLocality: 'Al Shorouk City, Cairo', addressCountry: 'EG' },
    sameAs: contact.social.map((s) => s.href),
  };

  return (
    <html lang={locale} className={`${display.variable} ${sans.variable}`}>
      <head>
        <link rel="preconnect" href="https://static.wixstatic.com" crossOrigin="anonymous" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body>
        <I18nProvider locale={locale}>
          <a href="#main" className="label fixed left-4 top-4 z-[100] -translate-y-24 bg-gold px-4 py-3 text-night focus:translate-y-0">
            {t.common.skip}
          </a>
          <SmoothScroll>
            <Header />
            <main id="main">{children}</main>
            <Footer />
          </SmoothScroll>
        </I18nProvider>
      </body>
    </html>
  );
}
