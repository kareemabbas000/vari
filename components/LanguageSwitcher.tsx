'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type MouseEvent } from 'react';
import { LOCALE_COOKIE, localizePath, stripLocale, type Locale } from '@/lib/i18n/config';
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
  const { locale, t, languages } = useI18n();
  const pathname = usePathname() || `/${locale}`;
  const router = useRouter();
  const rest = stripLocale(pathname, languages.map((l) => l.code));
  const meta = (code: Locale) => languages.find((l) => l.code === code);
  const isArticle = /^\/blog\/[^/]+$/.test(rest);

  // Pages whose address differs per language (blog articles) declare it via hreflang links in
  // <head>; read them so the switcher's links point at the real translated address.
  const [alts, setAlts] = useState<Record<string, string>>({});
  useEffect(() => {
    const found: Record<string, string> = {};
    document.querySelectorAll<HTMLLinkElement>('link[rel="alternate"][hreflang]').forEach((el) => {
      const lang = el.getAttribute('hreflang');
      const href = el.getAttribute('href');
      if (lang && href && lang !== 'x-default') found[lang.toLowerCase()] = new URL(href, window.location.origin).pathname;
    });
    setAlts(found);
  }, [pathname]);
  const hrefFor = (code: Locale) => {
    const alt = alts[(meta(code)?.hreflang ?? code).toLowerCase()];
    if (alt) return alt;
    // An article without a translation in that language: send readers to that language's blog.
    return isArticle && Object.keys(alts).length ? localizePath(code, '/blog') : localizePath(code, rest);
  };

  const go = (target: Locale) => (e: MouseEvent<HTMLAnchorElement>) => {
    rememberLocale(target);
    if (target === locale) return e.preventDefault();
    e.preventDefault();
    const alt = document.querySelector<HTMLLinkElement>(`link[rel="alternate"][hreflang="${meta(target)?.hreflang ?? target}"]`)?.getAttribute('href');
    const translated = alt ? new URL(alt, window.location.origin).pathname : null;
    const dest = translated && translated !== localizePath(target, rest) ? translated : isArticle && !translated ? localizePath(target, '/blog') : localizePath(target, rest);
    router.push(dest + (dest === localizePath(target, rest) ? window.location.search + window.location.hash : ''), { scroll: false });
  };

  // A single language needs no switcher at all.
  if (languages.length < 2) return null;

  if (variant === 'menu') {
    return (
      <nav aria-label={t.nav.language} className="flex flex-wrap items-center gap-2">
        {languages.map((l) => (
          <Link
            key={l.code}
            href={hrefFor(l.code)}
            hrefLang={l.hreflang}
            lang={l.code}
            onClick={go(l.code)}
            tabIndex={tabIndex}
            aria-current={l.code === locale ? 'true' : undefined}
            className={`label border px-4 py-3 transition-colors ${l.code === locale ? 'border-gold bg-gold text-night' : 'border-bone/20 text-bone/70 hover:border-gold hover:text-gold'}`}
          >
            {l.name}
          </Link>
        ))}
      </nav>
    );
  }

  // Many languages: a compact menu instead of a long row.
  if (languages.length > 4) {
    const current = meta(locale);
    return (
      <details className="group relative">
        <summary className="label flex cursor-pointer list-none items-center gap-2 py-2 text-gold [&::-webkit-details-marker]:hidden" aria-label={t.nav.language}>
          {current?.short ?? locale.toUpperCase()} <span aria-hidden className="transition-transform group-open:rotate-180">⌄</span>
        </summary>
        <div className="absolute right-0 top-full z-50 mt-2 min-w-[11rem] border border-bone/15 bg-night/95 p-1 backdrop-blur">
          {languages.map((l) => (
            <Link key={l.code} href={hrefFor(l.code)} hrefLang={l.hreflang} lang={l.code} onClick={go(l.code)} aria-current={l.code === locale ? 'true' : undefined} className={`block px-3 py-2 text-sm ${l.code === locale ? 'text-gold' : 'text-bone/70 hover:bg-bone/5 hover:text-bone'}`}>
              {l.name}
            </Link>
          ))}
        </div>
      </details>
    );
  }

  return (
    <nav aria-label={t.nav.language} className="flex items-center">
      {languages.map((l, i) => (
        <span key={l.code} className="flex items-center">
          {i > 0 && <span aria-hidden className="mx-2 h-3 w-px bg-bone/20" />}
          <Link
            href={hrefFor(l.code)}
            hrefLang={l.hreflang}
            lang={l.code}
            onClick={go(l.code)}
            aria-current={l.code === locale ? 'true' : undefined}
            aria-label={l.name}
            title={l.name}
            className={`label py-2 transition-colors ${l.code === locale ? 'text-gold' : 'text-bone/50 hover:text-bone'}`}
          >
            {l.short}
          </Link>
        </span>
      ))}
    </nav>
  );
}
