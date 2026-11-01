import type { MetadataRoute } from 'next';
import { site } from '@/lib/content';
import { getLanguages } from '@/lib/i18n/languages';
import { getAllPostSlugs } from '@/lib/blog';

// Refreshed with the CMS content (the feeds follow the enabled languages).
export const revalidate = 300;

/**
 * robots.txt
 *
 * - Everything public is crawlable, including CSS, JS and images under /_next (search engines
 *   must render the pages). Never add /_next or /brand here.
 * - Blocked: the control panel, API routes and the page builder's preview canvas. None has
 *   search value. Pages that must stay out of the index but may be crawled (newsletter status,
 *   thin blog categories) use a noindex meta tag instead, which only works if they are NOT
 *   blocked here.
 * - One group for every crawler, AI search bots included (OAI-SearchBot, PerplexityBot,
 *   Google-Extended, Bingbot…). A separate group per bot would replace these rules for that
 *   bot, so add one only to block something specific.
 * - Preview deployments (*.vercel.app branch builds) are closed entirely, so copies of the site
 *   never compete with the real one.
 * - Sitemaps: the main sitemap plus each language's blog RSS feed (Google and Bing accept RSS
 *   as a sitemap, which helps new articles get picked up quickly).
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = site.url.replace(/\/$/, '');
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') {
    return { rules: { userAgent: '*', disallow: '/' } };
  }
  const [langs, posts] = await Promise.all([getLanguages(), getAllPostSlugs()]);
  const feeds = langs.enabled.filter((l) => posts.some((p) => p.locale === l.code)).map((l) => `${base}/${l.code}/blog/rss.xml`);
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api/', '/*/builder-preview'] },
    sitemap: [`${base}/sitemap.xml`, ...feeds],
  };
}
