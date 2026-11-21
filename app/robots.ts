import type { MetadataRoute } from 'next';
import { site } from '@/lib/content';
import { getLanguages } from '@/lib/i18n/languages';
import { getAllPostSlugs } from '@/lib/blog';

// Refreshed with the CMS content (the feeds follow the enabled languages), never on a timer.
export const revalidate = false;

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
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/admin', '/api/', '/*/builder-preview'] },
      // Data scrapers that send no visitors and crawl every page and language again and again.
      // Search engines, AI assistants (GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot,
      // Google-Extended) and the common SEO tools (Ahrefs, Semrush) stay allowed.
      { userAgent: ['MJ12bot', 'DotBot', 'PetalBot', 'Bytespider', 'BLEXBot', 'DataForSeoBot', 'serpstatbot', 'Barkrowler', 'AwarioBot'], disallow: '/' },
    ],
    sitemap: [`${base}/sitemap.xml`, ...feeds],
  };
}
