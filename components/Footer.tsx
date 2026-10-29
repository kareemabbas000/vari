import Link from 'next/link';
import FooterSignature from './FooterSignature';
import Newsletter from './Newsletter';
import BackToTop from './BackToTop';
import { contact, nav, site } from '@/lib/content';

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-gold/15 bg-night pt-16 md:pt-24">
      <div className="wrap">
        <Link href="/contact" className="group flex flex-col gap-6 border-b border-gold/20 pb-12 md:flex-row md:items-end md:justify-between md:pb-16">
          <span className="display h-lg max-w-[18ch]">
            Begin your <span className="display-italic text-gold">design journey</span>
          </span>
          <span className="label flex items-center gap-4 text-gold">
            Start a project
            <span className="block h-px w-12 bg-gold transition-[width] duration-700 ease-expo group-hover:w-24" />
          </span>
        </Link>
      </div>

      <div className="wrap mt-16 grid gap-16 md:mt-20 md:grid-cols-12">
        <div className="md:col-span-5">
          <Newsletter />
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

      <div className="wrap mt-16 md:mt-24">
        <FooterSignature />
      </div>

      <div className="wrap flex flex-col items-start justify-between gap-4 border-t border-bone/10 mt-10 py-6 text-xs text-bone/50 sm:flex-row sm:items-center">
        <p>{site.copyright}</p>
        <BackToTop />
      </div>
    </footer>
  );
}
