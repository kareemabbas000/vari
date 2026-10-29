import type { Metadata, Viewport } from 'next';
import { Fraunces, Jost } from 'next/font/google';
import './globals.css';
import SmoothScroll from '@/components/SmoothScroll';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { brandAssets, contact, site } from '@/lib/content';
import { mediaUrl } from '@/lib/image-loader';

// Fraunces is the display face of the original site (fraunces_120pt light / semibold).
const display = Fraunces({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  axes: ['opsz', 'SOFT', 'WONK'],
  variable: '--font-display',
  display: 'swap',
});

// The original used licensed Futura / DIN Next / Avenir. Jost is a free geometric
// sans in the Futura family of forms — a stand-in, documented in docs/BRAND_REFERENCE.md.
const sans = Jost({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });

const ogImage = mediaUrl('b80319_425c2f36f32b420da9c91cbd856c607d~mv2.jpg', 1200);

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: 'VARI Studio — Architecture, Interiors & 3D Visualization',
    template: '%s — VARI Studio',
  },
  description: site.description,
  applicationName: site.name,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'Vari',
    title: 'VARI Studio — Where Elegant Spaces Meet Elemental Harmony',
    description: site.description,
    url: site.url,
    images: [{ url: ogImage, width: 1200, alt: 'The Urban Nest — visualization by VARI Studio' }],
  },
  twitter: { card: 'summary_large_image', title: 'VARI Studio', description: site.description, images: [ogImage] },
  verification: { google: '96MaJjmpseUkOLOGNvNTymidm2-lxTLQyuHL_vBQagk' },
  icons: { icon: mediaUrl(brandAssets.emblem.id, 96), apple: mediaUrl(brandAssets.emblem.id, 180) },
};

export const viewport: Viewport = {
  themeColor: '#0C0B0A',
  width: 'device-width',
  initialScale: 1,
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  name: site.name,
  url: site.url,
  description: site.description,
  email: contact.email,
  logo: mediaUrl(brandAssets.logo.id, 600),
  address: { '@type': 'PostalAddress', streetAddress: '742 Golf District', addressLocality: 'Al Shorouk City, Cairo', addressCountry: 'EG' },
  sameAs: contact.social.map((s) => s.href),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <head>
        <link rel="preconnect" href="https://static.wixstatic.com" crossOrigin="anonymous" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body>
        <a href="#main" className="label fixed left-4 top-4 z-[100] -translate-y-24 bg-gold px-4 py-3 text-night focus:translate-y-0">
          Skip to content
        </a>
        <SmoothScroll>
          <Header />
          <main id="main">{children}</main>
          <Footer />
        </SmoothScroll>
      </body>
    </html>
  );
}
