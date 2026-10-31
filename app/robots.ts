import type { MetadataRoute } from 'next';
import { site } from '@/lib/content';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api/', '/*/builder-preview'] },
    sitemap: `${site.url.replace(/\/$/, '')}/sitemap.xml`,
  };
}
