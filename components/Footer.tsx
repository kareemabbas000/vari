'use client';

import Link from 'next/link';
import FooterSignature from './FooterSignature';
import Newsletter from './Newsletter';
import BackToTop from './BackToTop';
import { contact } from '@/lib/content';
import { fmt } from '@/lib/i18n';
import { useI18n } from './I18nProvider';

export default function Footer() {
  const { t, href } = useI18n();
  const nav = [
    { label: t.nav.work, path: '/work' },
    { label: t.nav.services, path: '/services' },
    { label: t.nav.studio, path: '/studio' },
    { label: t.nav.contact, path: '/contact' },
  ];
  return (
    <footer className="relative overflow-hidden border-t border-gold/15 bg-night pt-12 md:pt-16">
      <div className="wrap">
        <Link href={href('/contact')} className="group flex flex-col gap-6 border-b border-gold/20 pb-10 md:flex-row md:items-end md:justify-between md:pb-12">
          <span className="display h-lg max-w-[18ch]">
            {t.footer.beginA} <span className="display-italic text-gold">{t.footer.beginItalic}</span>
          </span>
          <span className="label flex items-center gap-4 text-gold">
            {t.footer.start}
            <span className="block h-px w-12 bg-gold transition-[width] duration-700 ease-expo group-hover:w-24" />
          </span>
        </Link>
      </div>

      <div className="wrap mt-12 grid gap-12 md:mt-14 md:grid-cols-12">
        <div className="md:col-span-5">
          <Newsletter />
        </div>

        <div className="grid grid-cols-2 gap-10 md:col-span-7 md:grid-cols-3">
          <div>
            <p className="label mb-5 text-gold">{t.footer.explore}</p>
            <ul className="space-y-3">
              {nav.map((n) => (
                <li key={n.path}>
                  <Link href={href(n.path)} className="link-line text-bone/80 hover:text-bone">
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="label mb-5 text-gold">{t.footer.contact}</p>
            <ul className="space-y-3 text-bone/80">
              <li>
                <span className="label block text-bone/40">{t.common.email}</span>
                <a href={`mailto:${contact.email}`} className="link-line break-all hover:text-bone">
                  {contact.email}
                </a>
              </li>
              <li className="text-sm leading-relaxed">{contact.address}</li>
            </ul>
          </div>
          <div>
            <p className="label mb-5 text-gold">{t.common.social}</p>
            <ul className="space-y-3">
              {contact.social.map((s) => (
                <li key={s.href}>
                  <a href={s.href} target="_blank" rel="noreferrer noopener" className="link-line text-bone/80 hover:text-bone">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="wrap mt-12 md:mt-14">
        <FooterSignature />
      </div>

      <div className="wrap flex flex-col items-start justify-between gap-4 border-t border-bone/10 mt-8 py-5 text-xs text-bone/50 sm:flex-row sm:items-center">
        {/* Year is computed, so it never goes stale. */}
        <p suppressHydrationWarning>{fmt(t.common.copyright, { year: new Date().getFullYear() })}</p>
        <BackToTop />
      </div>
    </footer>
  );
}
