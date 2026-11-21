import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { FALLBACK_LANGUAGES, isLocale, LOCALE_COOKIE, type Locale } from '@/lib/i18n/config';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '@/lib/supabase/config';

/** Old Wix URLs → new routes (kept for existing links and search results). */
const LEGACY: Record<string, string> = { '/home': '/', '/about': '/studio', '/contacts': '/contact', '/portfolio': '/work' };

/** Control-panel pages reachable without a session. */
const ADMIN_PUBLIC = ['/admin/login', '/admin/forgot', '/admin/accept'];

type Registry = { known: Locale[]; enabled: Locale[]; fallback: Locale; custom: string[]; posts: Set<string>; projects: Set<string> };
let cache: { at: number; value: Registry } | null = null;

/**
 * Languages and the site's addresses (builder pages, live articles, published projects),
 * cached for 5 minutes: four small database reads per server instance, not per visitor. An
 * unknown address refreshes the lists at most every 30 seconds, so something published a
 * moment ago is found right away.
 */
const TTL = 5 * 60_000;
async function registry(maxAge = TTL): Promise<Registry> {
  if (cache && Date.now() - cache.at < maxAge) return cache.value;
  let rows: { code: string; enabled: boolean; is_default: boolean; sort: number }[] = FALLBACK_LANGUAGES.map((l) => ({ code: l.code, enabled: l.enabled, is_default: l.isDefault, sort: l.sort }));
  let custom: string[] = cache?.value.custom ?? [];
  let posts: Set<string> = cache?.value.posts ?? new Set();
  let projects: Set<string> = cache?.value.projects ?? new Set();
  let fresh = false;
  const get = (path: string) =>
    fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: { apikey: SUPABASE_PUBLISHABLE_KEY }, signal: AbortSignal.timeout(2500) }).then((r) => (r.ok ? r.json() : null));
  try {
    const [langs, pages, articles, works] = await Promise.all([
      get('languages?select=code,enabled,is_default,sort&order=sort.asc'),
      get('pages?select=slug&kind=eq.custom&published=eq.true'),
      get('blog_post_translations?select=locale,slug,post:blog_posts!inner(id)&ready=eq.true'),
      get('projects?select=slug&published=eq.true'),
    ]);
    if (Array.isArray(langs) && langs.length) {
      rows = langs;
      fresh = true;
    }
    if (Array.isArray(pages)) custom = pages.map((p: { slug: string }) => p.slug.split('/')[0]);
    if (Array.isArray(articles)) posts = new Set(articles.map((a: { locale: string; slug: string }) => `${a.locale}/${a.slug}`));
    if (Array.isArray(works)) projects = new Set(works.map((w: { slug: string }) => w.slug));
  } catch {}
  // Database briefly unreachable: keep the last known registry (retry in 10 s) rather than the
  // built-in fallback, so crawlers never see a working language redirect or disappear.
  if (!fresh && cache) {
    cache = { at: Date.now() - TTL + 10_000, value: cache.value };
    return cache.value;
  }
  const enabled = rows.filter((r) => r.enabled).map((r) => r.code);
  const value = { known: rows.map((r) => r.code), enabled, fallback: rows.find((r) => r.is_default && r.enabled)?.code ?? enabled[0] ?? 'en', custom, posts, projects };
  cache = { at: Date.now(), value };
  return value;
}

/** First path segments the site has (after the language): sections plus builder pages. */
const SECTIONS = new Set(['', 'work', 'services', 'studio', 'contact', 'privacy', 'newsletter', 'blog', 'builder-preview']);
async function exists(segment: string) {
  if (SECTIONS.has(segment) || (await registry()).custom.includes(segment)) return true;
  return (await registry(30_000)).custom.includes(segment);
}

/** /{lang}/blog/{slug} and /{lang}/work/{slug}: only live articles and published projects. */
const BLOG_SUB = new Set(['page', 'category', 'author', 'rss.xml']);
async function itemExists(locale: string, section: string | undefined, slug: string | undefined) {
  if (!slug) return true;
  const has = (r: Registry) => (section === 'blog' ? BLOG_SUB.has(slug) || r.posts.has(`${locale}/${slug}`) : section === 'work' ? r.projects.has(slug) : true);
  // An empty list means the database could not be read: let the page decide.
  const ready = (r: Registry) => (section === 'blog' ? r.posts.size > 0 : r.projects.size > 0);
  const reg = await registry();
  if (!ready(reg) || has(reg)) return true;
  return has(await registry(30_000));
}

/**
 * Unknown addresses under a language show the site's own 404 page. Every one of them is
 * rewritten to the same address, so that page is rendered and stored once per language,
 * not once per mistyped or invented URL.
 */
function missing(req: NextRequest, locale: string) {
  return NextResponse.rewrite(new URL(`/${locale}/blog/__missing`, req.url));
}

/**
 * Addresses the site never has (vulnerability scanners: /wp-login.php, /.env, /xmlrpc.php …)
 * get a tiny 404 straight from here: no page is rendered, cached or stored for them.
 * Real files (/robots.txt, /_next/…, /brand/…) never reach the middleware (see matcher).
 */
const SCANNER = /^\/(?:wp-|wordpress|phpmyadmin|cgi-bin|vendor\/|\.)/i;
function gone() {
  return new NextResponse('<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex"><title>404</title><p>Page not found. <a href="/">VARI Studio</a></p>', {
    status: 404,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
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
  // Files that do not exist: the only public file under a language is the blog feed.
  if (SCANNER.test(pathname) || (pathname.includes('.') && !/^\/[a-z]{2}\/blog\/rss\.xml$/.test(pathname))) return gone();

  const reg = await registry();
  const parts = pathname.split('/');
  const first = parts[1];
  if (reg.enabled.includes(first)) {
    if (!(await exists(parts[2] ?? '')) || !(await itemExists(first, parts[2], parts[3]))) return missing(req, first);
    // Old list pages (?page=2) moved to real addresses (/page/2), which are cached.
    const page = req.nextUrl.searchParams.get('page');
    if (page && parts[2] === 'blog' && /^\d{1,2}$/.test(page)) {
      const url = req.nextUrl.clone();
      url.pathname = Number(page) > 1 ? `${pathname.replace(/\/$/, '')}/page/${Number(page)}` : pathname;
      url.searchParams.delete('page');
      return NextResponse.redirect(url, 308);
    }
    return NextResponse.next();
  }

  // A language that is switched off (or no longer exists): same page, visitor's language.
  const known = reg.known.includes(first) || (isLocale(first) && first.length === 2 && parts.length > 2);
  const rest = known ? '/' + parts.slice(2).join('/') : pathname;
  const path = LEGACY[rest] ?? rest;
  if (!(await exists(path.split('/')[1] ?? ''))) return missing(req, preferred(req, reg));
  const url = req.nextUrl.clone();
  url.pathname = `/${preferred(req, reg)}${path === '/' ? '' : path}`;
  url.search = search;
  const res = NextResponse.redirect(url, 307);
  res.headers.set('Vary', 'Accept-Language, Cookie');
  return res;
}

export const config = {
  // Skip API routes, Next internals and the real files (public/, metadata routes, the IndexNow
  // key). Every other address passes through, so unknown ones are answered with a cheap 404.
  matcher: ['/((?!api/|_next/|_vercel/|brand/|icons/|media/|img/|favicon\\.ico$|robots\\.txt$|sitemap\\.xml$|manifest\\.webmanifest$|icon\\.svg$|apple-icon\\.png$|[0-9a-f]{32}\\.txt$).*)'],
};
