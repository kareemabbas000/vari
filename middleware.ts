import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { defaultLocale, isLocale, LOCALE_COOKIE, locales, type Locale } from '@/lib/i18n/config';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '@/lib/supabase/config';

/** Old Wix URLs → new routes (kept for existing links and search results). */
const LEGACY: Record<string, string> = { '/home': '/', '/about': '/studio', '/contacts': '/contact', '/portfolio': '/work' };

/** Control-panel pages reachable without a session. */
const ADMIN_PUBLIC = ['/admin/login', '/admin/forgot', '/admin/accept'];

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
 * Control panel: refresh the Supabase session cookie on every request and send anyone
 * without a session to the sign-in page. Roles are enforced again on the server and by
 * the database (RLS) — this is only the front door.
 */
async function admin(req: NextRequest) {
  let res = NextResponse.next({ request: req });
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });
  const { data } = await supabase.auth.getUser();
  const isPublic = ADMIN_PUBLIC.some((p) => req.nextUrl.pathname.startsWith(p));
  if (!data.user && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = '/admin/login';
    url.search = req.nextUrl.pathname === '/admin' ? '' : `?next=${encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }
  res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  res.headers.set('Cache-Control', 'no-store');
  return res;
}

/**
 * Public site: every page lives under /en, /de or /es (static, crawlable, hreflang-linked).
 * Requests without a locale are redirected to the visitor's saved or browser language.
 */
export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return admin(req);

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
