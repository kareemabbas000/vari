'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { MouseEvent } from 'react';
import { LOCALE_COOKIE, localeMeta, locales, localizePath, stripLocale, type Locale } from '@/lib/i18n/config';
import { useI18n } from './I18nProvider';

export const LANG_CHOSEN_KEY = 'vari-lang-chosen';

/** Remember an explicit choice: the cookie steers the middleware, localStorage skips the intro picker. */
export function rememberLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
  try {
    localStorage.setItem(LANG_CHOSEN_KEY, locale);
  } catch {}
}

/**
 * Language switcher. Renders real links (crawlable, with hreflang) to the same page in
 * every language; on click it keeps the query string and hash.
 */
export default function LanguageSwitcher({ variant = 'inline', tabIndex }: { variant?: 'inline' | 'menu'; tabIndex?: number }) {
  const { locale, t } = useI18n();
  const pathname = usePathname() || `/${locale}`;
  const router = useRouter();
  const rest = stripLocale(pathname);

  const go = (target: Locale) => (e: MouseEvent<HTMLAnchorElement>) => {
    rememberLocale(target);
    if (target === locale) return e.preventDefault();
    e.preventDefault();
    router.push(localizePath(target, rest) + window.location.search + window.location.hash, { scroll: false });
  };

  if (variant === 'menu') {
    return (
      <nav aria-label={t.nav.language} className="flex items-center gap-2">
        {locales.map((l) => (
          <Link
            key={l}
            href={localizePath(l, rest)}
            hrefLang={localeMeta[l].hreflang}
            lang={l}
            onClick={go(l)}
            tabIndex={tabIndex}
            aria-current={l === locale ? 'true' : undefined}
            className={`label border px-4 py-3 transition-colors ${l === locale ? 'border-gold bg-gold text-night' : 'border-bone/20 text-bone/70 hover:border-gold hover:text-gold'}`}
          >
            {localeMeta[l].name}
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <nav aria-label={t.nav.language} className="flex items-center">
      {locales.map((l, i) => (
        <span key={l} className="flex items-center">
          {i > 0 && <span aria-hidden className="mx-2 h-3 w-px bg-bone/20" />}
          <Link
            href={localizePath(l, rest)}
            hrefLang={localeMeta[l].hreflang}
            lang={l}
            onClick={go(l)}
            aria-current={l === locale ? 'true' : undefined}
            aria-label={localeMeta[l].name}
            title={localeMeta[l].name}
            className={`label py-2 transition-colors ${l === locale ? 'text-gold' : 'text-bone/50 hover:text-bone'}`}
          >
            {localeMeta[l].short}
          </Link>
        </span>
      ))}
    </nav>
  );
}
