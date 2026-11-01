import { getSiteContent } from '@/lib/cms';
import { getPosts } from '@/lib/blog';
import { isLocale, localizePath } from '@/lib/i18n/config';
import { getLanguages } from '@/lib/i18n/languages';
import { site } from '@/lib/content';
import { ogImageUrl } from '@/lib/image-loader';

export const revalidate = 300;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** RSS 2.0 feed of the blog, one per language. */
export async function GET(_req: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const langs = await getLanguages();
  if (!isLocale(locale) || !langs.byCode[locale]?.enabled) return new Response('Not found', { status: 404 });
  const base = site.url.replace(/\/$/, '');
  const [{ t }, posts] = await Promise.all([getSiteContent(locale), getPosts(locale)]);
  const items = posts
    .slice(0, 30)
    .map((p) => {
      const url = `${base}${localizePath(locale, `/blog/${p.slug}`)}`;
      // Source format (PNG/JPEG), not the AVIF the site uses: feed readers expect the declared type.
      const img = p.cover ? (/^https?:/.test(p.cover) ? p.cover : ogImageUrl(p.cover)) : '';
      const type = /\.png(\?|\/|$)/i.test(img) ? 'image/png' : 'image/jpeg';
      return `<item><title>${esc(p.title)}</title><link>${url}</link><guid isPermaLink="true">${url}</guid><pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate>${p.category ? `<category>${esc(p.category.name)}</category>` : ''}<description>${esc(p.excerpt)}</description>${img ? `<enclosure url="${esc(img)}" type="${type}" length="0"/>` : ''}</item>`;
    })
    .join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${esc(`VARI Studio — ${t.blog.label}`)}</title><link>${base}${localizePath(locale, '/blog')}</link><atom:link href="${base}${localizePath(locale, '/blog/rss.xml')}" rel="self" type="application/rss+xml"/><description>${esc(t.blog.metaDescription)}</description><language>${langs.byCode[locale].hreflang}</language>${items}</channel></rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': 'public, max-age=300' } });
}
