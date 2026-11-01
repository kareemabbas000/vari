import { site } from '@/lib/content';

/**
 * IndexNow: tells Bing (which also feeds ChatGPT search), Yandex, Seznam and Naver that URLs
 * changed, so they recrawl within minutes instead of days. Google does not take part. Google
 * learns from the sitemap and Search Console.
 *
 * The key is public by design: search engines verify it at /{key}.txt (file in /public).
 */
export const INDEXNOW_KEY = '9a50aa2d39771629adf5bf64111058c0';

export async function submitToIndexNow(urls: string[]): Promise<{ submitted: number; status: number }> {
  const base = site.url.replace(/\/$/, '');
  // Only the production site may report URLs (previews would submit the wrong host).
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') return { submitted: 0, status: 0 };
  const urlList = [...new Set(urls)].filter((u) => u.startsWith(`${base}/`)).slice(0, 10_000);
  if (!urlList.length) return { submitted: 0, status: 0 };
  const res = await fetch('https://api.indexnow.org/IndexNow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: new URL(base).host, key: INDEXNOW_KEY, keyLocation: `${base}/${INDEXNOW_KEY}.txt`, urlList }),
    signal: AbortSignal.timeout(8000),
  }).catch(() => null);
  if (!res || res.status >= 400) console.warn('[indexnow] not accepted', res?.status ?? 'network');
  return { submitted: urlList.length, status: res?.status ?? 0 };
}
