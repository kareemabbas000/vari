import { CMS_TAG, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, pick } from '@/lib/cms';
import type { Block } from '@/lib/blocks/schema';
import type { Locale } from '@/lib/i18n/config';

/**
 * Builder pages for the public site (published only — RLS and column grants hide drafts).
 * Cached with the "cms" tag like all CMS content. When the database is unreachable,
 * system pages render their original content and custom pages 404.
 */

export type PageSeo = { title?: Record<string, string>; description?: Record<string, string>; image?: string; noindex?: boolean };
export type PublicPage = { id: string; slug: string; kind: 'custom' | 'system'; title: Record<string, string>; seo: PageSeo; blocks: Block[]; updated_at: string };

const COLUMNS = 'id,slug,kind,title,seo,blocks,updated_at';

async function rest<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Accept: 'application/json' },
      next: { tags: [CMS_TAG], revalidate: 300 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function getPage(slug: string): Promise<PublicPage | null> {
  const rows = await rest<PublicPage[]>(`pages?select=${COLUMNS}&slug=eq.${encodeURIComponent(slug)}&published=eq.true&limit=1`);
  return rows?.[0] ?? null;
}

/** Published custom pages (for the sitemap and static generation). */
export async function getCustomPages(): Promise<Pick<PublicPage, 'slug' | 'updated_at' | 'seo'>[]> {
  return (await rest<PublicPage[]>('pages?select=slug,updated_at,seo&kind=eq.custom&published=eq.true&order=sort.asc')) ?? [];
}

/** SEO overrides a page sets in the builder (empty strings when none). */
export function pageMeta(page: PublicPage | null, locale: Locale) {
  return {
    title: pick(page?.seo?.title, locale),
    description: pick(page?.seo?.description, locale),
    image: page?.seo?.image || '',
    noindex: !!page?.seo?.noindex,
  };
}

/** A custom SEO title that already names the brand is used as-is; otherwise the site template adds it. */
export function seoTitle(title: string) {
  return /\bVARI\b/.test(title) ? { absolute: title } : title;
}

/** Apply a page's SEO overrides to the metadata a page computes by default. */
export function withSeo<M extends { title?: unknown; description?: unknown; openGraph?: unknown; robots?: unknown }>(seo: ReturnType<typeof pageMeta>, meta: M): M {
  return {
    ...meta,
    ...(seo.title ? { title: seoTitle(seo.title) } : {}),
    ...(seo.description ? { description: seo.description } : {}),
    ...(seo.image ? { openGraph: { ...((meta.openGraph as object) || {}), images: [{ url: seo.image }] } } : {}),
    ...(seo.noindex ? { robots: { index: false, follow: true } } : {}),
  };
}
