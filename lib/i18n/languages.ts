import { CMS_TAG } from '@/lib/cms-tag';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '@/lib/supabase/config';
import { FALLBACK_LANGUAGES, toLanguage, type Language, type Locale } from './config';

/**
 * The language registry for the website (server side). Cached with the CMS tag, so
 * enabling, disabling or adding a language in the panel takes effect on publish.
 */
export type Languages = { all: Language[]; enabled: Language[]; defaultCode: Locale; codes: Locale[]; byCode: Record<Locale, Language> };

function pack(all: Language[]): Languages {
  const sorted = [...all].sort((a, b) => a.sort - b.sort);
  const enabled = sorted.filter((l) => l.enabled);
  const def = enabled.find((l) => l.isDefault) ?? enabled[0] ?? sorted[0];
  return { all: sorted, enabled, defaultCode: def.code, codes: enabled.map((l) => l.code), byCode: Object.fromEntries(sorted.map((l) => [l.code, l])) };
}

export async function getLanguages(): Promise<Languages> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/languages?select=*&order=sort.asc`, {
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Accept: 'application/json' },
      next: { tags: [CMS_TAG], revalidate: 300 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(String(res.status));
    const rows = (await res.json()) as Parameters<typeof toLanguage>[0][];
    if (!rows.length) throw new Error('empty');
    return pack(rows.map(toLanguage));
  } catch {
    return pack(FALLBACK_LANGUAGES);
  }
}

/** hreflang alternates for a page that exists in every enabled language. */
export async function alternatesFor(locale: Locale, path: string) {
  const { enabled, defaultCode } = await getLanguages();
  const p = (l: Locale) => (path === '/' ? `/${l}` : `/${l}${path.startsWith('/') ? path : `/${path}`}`);
  const languages: Record<string, string> = Object.fromEntries(enabled.map((l) => [l.hreflang, p(l.code)]));
  languages['x-default'] = p(defaultCode);
  return { canonical: p(locale), languages };
}
