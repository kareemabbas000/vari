import { site } from '@/lib/content';

/**
 * IndexNow: tells Bing (which also feeds ChatGPT search), Yandex, Seznam and Naver that URLs
 * changed, so they recrawl within minutes instead of days. Google does not take part. Google
 * learns from the sitemap and Search Console.
 *
 * The key is public by design: search engines verify it at /{key}.txt (file in /public).
 */
export const INDEXNOW_KEY = '9a50aa2d39771629adf5bf64111058c0';

const ENDPOINTS = ['https://api.indexnow.org/IndexNow', 'https://www.bing.com/indexnow', 'https://yandex.com/indexnow'];

export async function submitToIndexNow(urls: string[]): Promise<{ submitted: number; status: number; endpoint?: string }> {
  const base = site.url.replace(/\/$/, '');
  // Only the production site may report URLs (previews would submit the wrong host).
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') return { submitted: 0, status: 0 };
  const urlList = [...new Set(urls)].filter((u) => u.startsWith(`${base}/`)).slice(0, 10_000);
  if (!urlList.length) return { submitted: 0, status: 0 };
  const body = JSON.stringify({ host: new URL(base).host, key: INDEXNOW_KEY, keyLocation: `${base}/${INDEXNOW_KEY}.txt`, urlList });
  // The shared endpoint forwards to every engine. If it refuses (403 = key not verified at that
  // moment, 429 = too many requests), Bing and Yandex are asked directly before giving up.
  let status = 0;
  for (const endpoint of ENDPOINTS) {
    const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' }, body, signal: AbortSignal.timeout(8000) }).catch(() => null);
    status = res?.status ?? status;
    if (res && res.status < 300) return { submitted: urlList.length, status: res.status, endpoint };
    console.warn('[indexnow] not accepted', endpoint, res?.status ?? 'network');
  }
  return { submitted: urlList.length, status };
}
