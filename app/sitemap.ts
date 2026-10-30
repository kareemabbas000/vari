import type { MetadataRoute } from 'next';
import { projects, site } from '@/lib/content';
import { locales, localizePath, defaultLocale } from '@/lib/i18n/config';

/** One entry per page per language, each listing its hreflang alternates. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = site.url.replace(/\/$/, '');
  const pages: { path: string; priority: number }[] = [
    { path: '/', priority: 1 },
    { path: '/work', priority: 0.9 },
    { path: '/services', priority: 0.8 },
    { path: '/contact', priority: 0.8 },
    { path: '/studio', priority: 0.7 },
    ...projects.map((p) => ({ path: `/work/${p.slug}`, priority: 0.6 })),
  ];
  const lastModified = new Date();
  return pages.flatMap(({ path, priority }) => {
    const languages = Object.fromEntries([
      ...locales.map((l) => [l, `${base}${localizePath(l, path)}`]),
      ['x-default', `${base}${localizePath(defaultLocale, path)}`],
    ]);
    return locales.map((l) => ({
      url: `${base}${localizePath(l, path)}`,
      lastModified,
      priority: l === defaultLocale ? priority : priority * 0.9,
      alternates: { languages },
    }));
  });
}
