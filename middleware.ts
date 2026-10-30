import { NextResponse, type NextRequest } from 'next/server';
import { defaultLocale, isLocale, LOCALE_COOKIE, locales, type Locale } from '@/lib/i18n/config';

/** Old Wix URLs → new routes (kept for existing links and search results). */
const LEGACY: Record<string, string> = { '/home': '/', '/about': '/studio', '/contacts': '/contact', '/portfolio': '/work' };

function preferred(req: NextRequest): Locale {
  const saved = req.cookies.get(LOCALE_COOKIE)?.value;
  if (isLocale(saved)) return saved;
  // Accept-Language: "de-DE,de;q=0.9,en;q=0.8"
  const header = req.headers.get('accept-language') || '';
  const ranked = header
    .split(',')
    .map((part) => {
      const [tag, q] = part.trim().split(';q=');
      return { lang: tag.toLowerCase().split('-')[0], q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  for (const { lang } of ranked) if ((locales as readonly string[]).includes(lang)) return lang as Locale;
  return defaultLocale;
}

/**
 * Every page lives under /en, /de or /es (static, crawlable, hreflang-linked).
 * Requests without a locale are redirected to the visitor's saved or browser language.
 */
export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const first = pathname.split('/')[1];
  if (isLocale(first)) return NextResponse.next();

  const path = LEGACY[pathname] ?? pathname;
  const url = req.nextUrl.clone();
  url.pathname = `/${preferred(req)}${path === '/' ? '' : path}`;
  url.search = search;
  const res = NextResponse.redirect(url, 307);
  res.headers.set('Vary', 'Accept-Language, Cookie');
  return res;
}

export const config = {
  // Skip API routes, Next internals, metadata routes and static files.
  matcher: ['/((?!api|_next|brand|media|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)'],
};
