/**
 * Cache tags of CMS-backed requests.
 *
 * Every public page is cached until something is published (no timer). Publishing refreshes
 * only the area that changed, so one new article does not rebuild the whole site:
 *   site       settings, texts, projects, services, menus (read by every page's layout)
 *   blog       posts, categories, authors (blog pages, sitemap, RSS)
 *   pages      page-builder pages
 *   languages  the language registry
 * CMS_TAG is on every request, so revalidating it refreshes everything.
 */
export const CMS_TAG = 'cms';
export const TAGS = { site: 'cms-site', blog: 'cms-blog', pages: 'cms-pages', languages: 'cms-languages' } as const;
export type CacheScope = keyof typeof TAGS | 'all';

/**
 * Pages are cached until the next publish, so a failed database read must never be cached as
 * content (an empty blog, fallback texts). On Vercel a failed read throws instead: a refresh in
 * the background then keeps serving the last good page, and an uncached page shows an error
 * once and is retried on the next visit. Locally the built-in fallbacks still apply.
 */
export const FAIL_HARD = Boolean(process.env.VERCEL);

/** fetch() options for CMS reads: cached until the given area is published. */
export function cmsCache(scope: keyof typeof TAGS) {
  return { tags: [CMS_TAG, TAGS[scope]], revalidate: false as const };
}
