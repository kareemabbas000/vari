import { revalidateTag } from 'next/cache';
import { CMS_TAG, TAGS, type CacheScope } from '@/lib/cms-tag';

/** Refresh the cached pages of one area ('blog', 'pages', …) or, by default, all of them. */
export function refresh(scope: unknown): CacheScope {
  const s = typeof scope === 'string' && scope in TAGS ? (scope as keyof typeof TAGS) : 'all';
  revalidateTag(s === 'all' ? CMS_TAG : TAGS[s]);
  return s;
}
