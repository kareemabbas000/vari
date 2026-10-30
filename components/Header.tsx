'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import Logo from './Logo';
import { stripLocale } from '@/lib/i18n/config';
import { useI18n } from './I18nProvider';
import LanguageSwitcher from './LanguageSwitcher';
import { useLenis } from './SmoothScroll';

export default function Header() {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { t, href, settings } = useI18n();
  const contact = settings.contact;
  const nav = [
    { label: t.nav.work, path: '/work' },
    { label: t.nav.services, path: '/services' },
    { label: t.nav.studio, path: '/studio' },
    { label: t.nav.contact, path: '/contact' },
  ];
  const lenis = useLenis();
  const last = useRef(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      setHidden(y > 200 && y > last.current);
      last.current = y;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock scroll and trap focus while the full-screen menu is open.
  useEffect(() => {
    if (open) lenis?.stop();
    else lenis?.start();
    document.documentElement.style.overflow = open ? 'hidden' : '';
    if (!open) return;
    const first = menuRef.current?.querySelector<HTMLElement>('a');
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        toggleRef.current?.focus();
      }
      if (e.key === 'Tab' && menuRef.current) {
        const items = Array.from(menuRef.current.querySelectorAll<HTMLElement>('a,button'));
        const all = [toggleRef.current!, ...items];
        const idx = all.indexOf(document.activeElement as HTMLElement);
        if (e.shiftKey && idx <= 0) {
          e.preventDefault();
          all[all.length - 1].focus();
        } else if (!e.shiftKey && idx === all.length - 1) {
          e.preventDefault();
          all[0].focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, lenis]);

  const here = stripLocale(pathname || '/');
  const isActive = (path: string) => (path === '/' ? here === '/' : here.startsWith(path));

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[transform,background-color,backdrop-filter] duration-700 ease-expo ${
          hidden && !open ? '-translate-y-full' : 'translate-y-0'
        } ${scrolled && !open ? 'bg-night/70 backdrop-blur-md' : 'bg-transparent'}`}
      >
        <div className="wrap flex h-[var(--header-h)] items-center justify-between">
          <Link href={href('/')} aria-label={t.common.homeAria} className="relative z-10 block w-[84px] md:w-[100px]">
            <Logo priority className="h-auto w-full" />
          </Link>

          <nav aria-label={t.nav.primary} className="hidden items-center gap-7 lg:flex xl:gap-10">
            {nav.map((item) => (
              <Link
                key={item.path}
                href={href(item.path)}
                aria-current={isActive(item.path) ? 'page' : undefined}
                className={`label link-line pb-1 transition-colors hover:text-gold ${isActive(item.path) ? 'text-gold' : 'text-bone/80'}`}
              >
                {item.label}
              </Link>
            ))}
            <LanguageSwitcher />
            <Link href={href('/contact?intent=design')} className="btn !px-5 !py-3 !min-h-0 !text-[0.65rem]">
              <span>{t.nav.cta}</span>
            </Link>
          </nav>

          <button
            ref={toggleRef}
            type="button"
            className="relative z-10 -mr-2 flex h-12 w-12 items-center justify-center lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? t.nav.menuClose : t.nav.menuOpen}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="relative block h-3 w-7">
              <span className={`absolute left-0 top-0 h-px w-full bg-gold transition-transform duration-500 ease-expo ${open ? 'translate-y-[6px] rotate-45' : ''}`} />
              <span className={`absolute bottom-0 left-0 h-px w-full bg-gold transition-transform duration-500 ease-expo ${open ? '-translate-y-[5px] -rotate-45' : ''}`} />
            </span>
          </button>
        </div>
      </header>

      <div
        id="mobile-menu"
        ref={menuRef}
        role="dialog"
        aria-modal="true"
        aria-label={t.nav.siteMenu}
        aria-hidden={!open}
        className={`fixed inset-0 z-40 flex flex-col overflow-y-auto bg-night transition-[clip-path] duration-[900ms] ease-arch lg:hidden ${
          open ? '[clip-path:inset(0_0_0_0)]' : 'pointer-events-none invisible [clip-path:inset(0_0_100%_0)]'
        }`}
      >
        <div className="blueprint absolute inset-0 opacity-60" aria-hidden />
        <nav aria-label={t.nav.mobile} className="wrap relative flex flex-1 flex-col justify-center gap-1 pt-[var(--header-h)]">
          {[{ label: t.nav.home, path: '/' }, ...nav].map((item, i) => (
            <Link
              key={item.path}
              href={href(item.path)}
              aria-current={isActive(item.path) ? 'page' : undefined}
              tabIndex={open ? 0 : -1}
              onClick={() => setOpen(false)}
              className="group flex items-baseline gap-4 border-b border-bone/10 py-[min(1rem,1.8svh)]"
              style={{ transitionDelay: open ? `${150 + i * 60}ms` : '0ms' }}
            >
              <span className="label text-gold/70">0{i + 1}</span>
              <span
                className={`display text-[clamp(1.9rem,6.2svh,2.8rem)] leading-none transition-[transform,opacity] duration-700 ease-expo ${
                  open ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
                }`}
                style={{ transitionDelay: open ? `${200 + i * 70}ms` : '0ms' }}
              >
                {item.label}
              </span>
            </Link>
          ))}
        </nav>
        <div className="wrap relative pb-10 text-sm text-bone/60">
          <div className="mb-8">
            <p className="label mb-3 text-bone/40">{t.nav.language}</p>
            <LanguageSwitcher variant="menu" tabIndex={open ? 0 : -1} />
          </div>
          <a href={`mailto:${contact.email}`} tabIndex={open ? 0 : -1} className="block text-gold">
            {contact.email}
          </a>
          <div className="mt-4 flex gap-6">
            {contact.social.map((s) => (
              <a key={s.href} href={s.href} target="_blank" rel="noreferrer noopener" tabIndex={open ? 0 : -1} className="label">
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
