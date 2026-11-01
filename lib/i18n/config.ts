/**
 * Languages are data (panel → Languages, table `languages`). This file holds only what
 * must exist without the database: the shape of a language, the source language that
 * every text falls back to, and a fallback list for when the database is unreachable.
 */

/** A language code such as "en", "tr" or "pt-br". */
export type Locale = string;

/** Content is written in English first; any missing translation falls back to it. */
export const SOURCE_LOCALE: Locale = 'en';

/** Cookie that remembers the visitor's explicit language choice (read by middleware). */
export const LOCALE_COOKIE = 'VARI_LOCALE';

export type Language = {
  code: Locale;
  /** Native name, e.g. "Türkçe". */
  name: string;
  englishName: string;
  /** Short label, e.g. "TR". */
  short: string;
  og: string;
  hreflang: string;
  /** The word shown on the intro's language gate. */
  welcome: string;
  dir: 'ltr' | 'rtl';
  enabled: boolean;
  isDefault: boolean;
  sort: number;
};

const lang = (code: string, name: string, englishName: string, og: string, welcome: string, enabled: boolean, sort: number): Language => ({
  code,
  name,
  englishName,
  short: code.toUpperCase(),
  og,
  hreflang: code,
  welcome,
  dir: 'ltr',
  enabled,
  isDefault: code === SOURCE_LOCALE,
  sort,
});

/**
 * Used only if the database cannot be reached. Keep it in step with production (Panel →
 * Languages): a language marked off here would redirect or 404 for crawlers during an outage.
 */
export const FALLBACK_LANGUAGES: Language[] = [
  lang('en', 'English', 'English', 'en_US', 'Welcome', true, 10),
  lang('de', 'Deutsch', 'German', 'de_DE', 'Willkommen', true, 20),
  lang('es', 'Español', 'Spanish', 'es_ES', 'Bienvenidos', true, 30),
  lang('tr', 'Türkçe', 'Turkish', 'tr_TR', 'Hoş geldiniz', true, 40),
];

const PATTERN = /^[a-z]{2,3}(-[a-z]{2,4})?$/;

/** Looks like a language code (whether it is enabled is decided by the registry). */
export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && PATTERN.test(value);
}

/** `/work/x` → `/de/work/x`. Paths keep their English slugs in every language (stable URLs). */
export function localizePath(locale: Locale, path: string) {
  if (/^(https?:|mailto:|tel:|#)/.test(path)) return path;
  const clean = path.startsWith('/') ? path : `/${path}`;
  return clean === '/' ? `/${locale}` : `/${locale}${clean}`;
}

/** `/de/work/x?y` → `/work/x?y` (for a known language code). */
export function stripLocale(pathname: string, known?: Locale[]) {
  const parts = pathname.split('/');
  const first = parts[1];
  if (isLocale(first) && (!known || known.includes(first))) return '/' + parts.slice(2).join('/');
  return pathname;
}

/** Database row → Language. */
export function toLanguage(r: { code: string; name: string; english_name: string; og_locale: string; hreflang: string; welcome: string; dir: string; enabled: boolean; is_default: boolean; sort: number }): Language {
  return {
    code: r.code,
    name: r.name,
    englishName: r.english_name,
    short: r.code.split('-')[0].toUpperCase(),
    og: r.og_locale,
    hreflang: r.hreflang,
    welcome: r.welcome || r.name,
    dir: r.dir === 'rtl' ? 'rtl' : 'ltr',
    enabled: r.enabled,
    isDefault: r.is_default,
    sort: r.sort,
  };
}
