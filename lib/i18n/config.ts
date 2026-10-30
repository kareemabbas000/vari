export const locales = ['en', 'de', 'es'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

/** Cookie that remembers the visitor's explicit language choice (read by middleware). */
export const LOCALE_COOKIE = 'VARI_LOCALE';

export const localeMeta: Record<Locale, { name: string; short: string; og: string; hreflang: string; welcome: string }> = {
  en: { name: 'English', short: 'EN', og: 'en_US', hreflang: 'en', welcome: 'Welcome' },
  de: { name: 'Deutsch', short: 'DE', og: 'de_DE', hreflang: 'de', welcome: 'Willkommen' },
  es: { name: 'Español', short: 'ES', og: 'es_ES', hreflang: 'es', welcome: 'Bienvenidos' },
};

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}

/** `/work/x` → `/de/work/x`. Paths keep their English slugs in every language (stable URLs). */
export function localizePath(locale: Locale, path: string) {
  if (/^(https?:|mailto:|tel:|#)/.test(path)) return path;
  const clean = path.startsWith('/') ? path : `/${path}`;
  return clean === '/' ? `/${locale}` : `/${locale}${clean}`;
}

/** `/de/work/x?y` → `/work/x?y` */
export function stripLocale(pathname: string) {
  const parts = pathname.split('/');
  if (isLocale(parts[1])) return '/' + parts.slice(2).join('/');
  return pathname;
}
