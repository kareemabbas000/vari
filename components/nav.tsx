'use client';

import Link from 'next/link';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { useI18n } from './I18nProvider';
import { pick } from '@/lib/cms';
import { resolveHref } from '@/lib/blocks/schema';

export type NavEntry = { key: string; label: string; path: string; href: string; external: boolean; newTab: boolean };

/**
 * Menu links: the menu set in the panel (Menus & announcement), or the built-in one.
 * The footer falls back to the header menu.
 */
export function useNav(where: 'header' | 'footer'): NavEntry[] {
  const { t, href, settings, locale } = useI18n();
  const custom = (where === 'footer' && settings.navigation.footer.length ? settings.navigation.footer : settings.navigation.header).filter((n) => n.href && pick(n.label, locale));
  if (!custom.length) {
    return [
      { label: t.nav.work, path: '/work' },
      { label: t.nav.services, path: '/services' },
      { label: t.nav.studio, path: '/studio' },
      { label: t.nav.blog, path: '/blog' },
      { label: t.nav.contact, path: '/contact' },
    ].map((n) => ({ key: n.path, label: n.label, path: n.path, href: href(n.path), external: false, newTab: false }));
  }
  return custom.map((n, i) => {
    const external = /^https?:/i.test(n.href);
    const path = external ? n.href : n.href.startsWith('/') ? n.href : `/${n.href}`;
    return { key: `${i}-${n.href}`, label: pick(n.label, locale), path, href: resolveHref(n.href, href), external, newTab: !!n.newTab || external };
  });
}

export function NavLink({ item, children, ...rest }: { item: NavEntry; children: ReactNode } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>) {
  if (item.external || item.href.startsWith('mailto:') || item.href.startsWith('tel:'))
    return (
      <a href={item.href} target={item.newTab ? '_blank' : undefined} rel={item.newTab ? 'noopener noreferrer' : undefined} {...rest}>
        {children}
      </a>
    );
  return (
    <Link href={item.href} target={item.newTab ? '_blank' : undefined} {...rest}>
      {children}
    </Link>
  );
}
