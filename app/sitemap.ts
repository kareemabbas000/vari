import type { MetadataRoute } from 'next';
import { site } from '@/lib/content';
import { getProjectSlugs } from '@/lib/cms';
import { getCustomPages } from '@/lib/pages';
import { getAllPostSlugs } from '@/lib/blog';
import { localizePath } from '@/lib/i18n/config';
import { getLanguages } from '@/lib/i18n/languages';

// Rebuilt every 5 minutes so new pages and articles appear without a redeploy.
export const revalidate = 300;

/** One entry per page per language, each listing its hreflang alternates. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = site.url.replace(/\/$/, '');
  const pages: { path: string; priority: number }[] = [
    { path: '/', priority: 1 },
    { path: '/work', priority: 0.9 },
    { path: '/services', priority: 0.8 },
    { path: '/contact', priority: 0.8 },
    { path: '/studio', priority: 0.7 },
    { path: '/privacy', priority: 0.3 },
    ...(await getProjectSlugs()).map((slug) => ({ path: `/work/${slug}`, priority: 0.6 })),
    ...(await getCustomPages()).filter((p) => !p.seo?.noindex).map((p) => ({ path: `/${p.slug}`, priority: 0.7 })),
  ];
  const langs = await getLanguages();
  const enabled = langs.enabled;
  const defaultLocale = langs.defaultCode;
  const hreflang = (code: string) => langs.byCode[code]?.hreflang ?? code;
  // Only articles in enabled languages.
  const posts = (await getAllPostSlugs()).filter((p) => langs.codes.includes(p.locale));
  if (posts.length) pages.push({ path: '/blog', priority: 0.8 });
  // Articles: each language has its own address; alternates list only real translations.
  const byPost = new Map<string, typeof posts>();
  posts.forEach((p) => byPost.set(p.id, [...(byPost.get(p.id) || []), p]));
  const articles: MetadataRoute.Sitemap = posts.map((p) => {
    const group = byPost.get(p.id)!;
    const languages: Record<string, string> = Object.fromEntries(group.map((g) => [hreflang(g.locale), `${base}${localizePath(g.locale, `/blog/${g.slug}`)}`]));
    const def = group.find((g) => g.locale === defaultLocale) ?? group[0];
    languages['x-default'] = `${base}${localizePath(def.locale, `/blog/${def.slug}`)}`;
    return { url: `${base}${localizePath(p.locale, `/blog/${p.slug}`)}`, lastModified: new Date(p.updatedAt), priority: 0.7, alternates: { languages } };
  });
  return [...articles, ...pages.flatMap(({ path, priority }) => {
    const languages = Object.fromEntries([
      ...enabled.map((l) => [l.hreflang, `${base}${localizePath(l.code, path)}`]),
      ['x-default', `${base}${localizePath(defaultLocale, path)}`],
    ]);
    // No lastModified: these pages have no reliable update date, and a build-time stamp on
    // every URL teaches Google to ignore the field (articles above carry their real dates).
    return enabled.map(({ code: l }) => ({
      url: `${base}${localizePath(l, path)}`,
      priority: l === defaultLocale ? priority : priority * 0.9,
      alternates: { languages },
    }));
  })];
}
