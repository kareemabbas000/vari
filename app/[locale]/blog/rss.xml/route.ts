import { getSiteContent } from '@/lib/cms';
import { getPosts } from '@/lib/blog';
import { isLocale, localeMeta, localizePath } from '@/lib/i18n/config';
import { site } from '@/lib/content';
import { mediaUrl } from '@/lib/image-loader';

export const revalidate = 300;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** RSS 2.0 feed of the journal, one per language. */
export async function GET(_req: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return new Response('Not found', { status: 404 });
  const base = site.url.replace(/\/$/, '');
  const [{ t }, posts] = await Promise.all([getSiteContent(locale), getPosts(locale)]);
  const items = posts
    .slice(0, 30)
    .map((p) => {
      const url = `${base}${localizePath(locale, `/blog/${p.slug}`)}`;
      const img = p.cover ? (/^https?:/.test(p.cover) ? p.cover : mediaUrl(p.cover, 1200)) : '';
      return `<item><title>${esc(p.title)}</title><link>${url}</link><guid isPermaLink="true">${url}</guid><pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate>${p.category ? `<category>${esc(p.category.name)}</category>` : ''}<description>${esc(p.excerpt)}</description>${img ? `<enclosure url="${esc(img)}" type="image/jpeg" length="0"/>` : ''}</item>`;
    })
    .join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${esc(`VARI Studio — ${t.blog.label}`)}</title><link>${base}${localizePath(locale, '/blog')}</link><atom:link href="${base}${localizePath(locale, '/blog/rss.xml')}" rel="self" type="application/rss+xml"/><description>${esc(t.blog.metaDescription)}</description><language>${localeMeta[locale].hreflang}</language>${items}</channel></rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': 'public, max-age=300' } });
}
