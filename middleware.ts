import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { FALLBACK_LANGUAGES, isLocale, LOCALE_COOKIE, type Locale } from '@/lib/i18n/config';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '@/lib/supabase/config';

/** Old Wix URLs → new routes (kept for existing links and search results). */
const LEGACY: Record<string, string> = { '/home': '/', '/about': '/studio', '/contacts': '/contact', '/portfolio': '/work' };

/** Control-panel pages reachable without a session. */
const ADMIN_PUBLIC = ['/admin/login', '/admin/forgot', '/admin/accept'];

type Registry = { known: Locale[]; enabled: Locale[]; fallback: Locale };
let cache: { at: number; value: Registry } | null = null;

/** Languages from the panel, cached for a minute (the fallback list if unreachable). */
async function registry(): Promise<Registry> {
  if (cache && Date.now() - cache.at < 60_000) return cache.value;
  let rows: { code: string; enabled: boolean; is_default: boolean; sort: number }[] = FALLBACK_LANGUAGES.map((l) => ({ code: l.code, enabled: l.enabled, is_default: l.isDefault, sort: l.sort }));
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/languages?select=code,enabled,is_default,sort&order=sort.asc`, {
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY },
      signal: AbortSignal.timeout(2500),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length) rows = data;
    }
  } catch {}
  const enabled = rows.filter((r) => r.enabled).map((r) => r.code);
  const value = { known: rows.map((r) => r.code), enabled, fallback: rows.find((r) => r.is_default && r.enabled)?.code ?? enabled[0] ?? 'en' };
  cache = { at: Date.now(), value };
  return value;
}

function preferred(req: NextRequest, reg: Registry): Locale {
  const saved = req.cookies.get(LOCALE_COOKIE)?.value;
  if (isLocale(saved) && reg.enabled.includes(saved)) return saved;
  // Accept-Language: "de-DE,de;q=0.9,en;q=0.8"
  const header = req.headers.get('accept-language') || '';
  const ranked = header
    .split(',')
    .map((part) => {
      const [tag, q] = part.trim().split(';q=');
      return { lang: tag.toLowerCase().split('-')[0], q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  for (const { lang } of ranked) if (reg.enabled.includes(lang)) return lang;
  return reg.fallback;
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

  const reg = await registry();
  const first = pathname.split('/')[1];
  if (reg.enabled.includes(first)) return NextResponse.next();

  // A language that is switched off (or no longer exists): same page, visitor's language.
  const known = reg.known.includes(first) || (isLocale(first) && first.length === 2 && pathname.split('/').length > 2);
  const rest = known ? '/' + pathname.split('/').slice(2).join('/') : pathname;
  const path = LEGACY[rest] ?? rest;
  const url = req.nextUrl.clone();
  url.pathname = `/${preferred(req, reg)}${path === '/' ? '' : path}`;
  url.search = search;
  const res = NextResponse.redirect(url, 307);
  res.headers.set('Vary', 'Accept-Language, Cookie');
  return res;
}

export const config = {
  // Skip API routes, Next internals, metadata routes and static files.
  matcher: ['/((?!api|_next|brand|media|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)'],
};
