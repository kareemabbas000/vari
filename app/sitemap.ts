import type { MetadataRoute } from 'next';
import { projects, site } from '@/lib/content';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = site.url.replace(/\/$/, '');
  return [
    { url: `${base}/`, priority: 1 },
    { url: `${base}/work`, priority: 0.9 },
    { url: `${base}/studio`, priority: 0.7 },
    { url: `${base}/contact`, priority: 0.8 },
    ...projects.map((p) => ({ url: `${base}/work/${p.slug}`, priority: 0.6 })),
  ];
}
