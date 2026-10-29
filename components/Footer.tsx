import Link from 'next/link';
import Logo from './Logo';
import Newsletter from './Newsletter';
import BackToTop from './BackToTop';
import { contact, nav, site } from '@/lib/content';

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-gold/15 bg-night pt-20 md:pt-28">
      <div className="wrap grid gap-16 md:grid-cols-12">
        <div className="md:col-span-5">
          <Link href="/" aria-label="VARI Studio — home" className="block w-[130px]">
            <Logo className="h-auto w-full" />
          </Link>
          <div className="mt-10">
            <Newsletter />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-10 md:col-span-7 md:grid-cols-3">
          <div>
            <p className="label mb-5 text-gold">Explore</p>
            <ul className="space-y-3">
              {nav.map((n) => (
                <li key={n.href}>
                  <Link href={n.href} className="link-line text-bone/80 hover:text-bone">
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="label mb-5 text-gold">Contact</p>
            <ul className="space-y-3 text-bone/80">
              <li>
                <span className="label block text-bone/40">Email</span>
                <a href={`mailto:${contact.email}`} className="link-line break-all hover:text-bone">
                  {contact.email}
                </a>
              </li>
              <li className="text-sm leading-relaxed">{contact.address}</li>
            </ul>
          </div>
          <div>
            <p className="label mb-5 text-gold">Social</p>
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

      <div aria-hidden className="pointer-events-none mt-20 select-none overflow-hidden">
        <p className="display gold-text whitespace-nowrap text-center text-[28vw] leading-[0.78] opacity-90">VARI</p>
      </div>

      <div className="wrap flex flex-col items-start justify-between gap-4 border-t border-bone/10 py-6 text-xs text-bone/50 sm:flex-row sm:items-center">
        <p>{site.copyright}</p>
        <BackToTop />
      </div>
    </footer>
  );
}
