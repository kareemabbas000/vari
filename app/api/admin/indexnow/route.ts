import { NextResponse } from 'next/server';
import { currentMember, roleAtLeast } from '@/lib/supabase/server';
import { submitToIndexNow } from '@/lib/indexnow';
import sitemap from '@/app/sitemap';

export const dynamic = 'force-dynamic';

/**
 * Panel → Brand & settings → "Notify search engines": sends sitemap URLs to IndexNow (Bing,
 * Yandex, Seznam, Naver) and reports the answer. `scope: "all"` sends every URL in the sitemap
 * (after switching a language on, or once after launch); `"recent"` sends what changed in the
 * last two days. Admins only: IndexNow asks sites not to resubmit unchanged URLs repeatedly.
 */
export async function POST(req: Request) {
  const member = await currentMember();
  if (!member?.profile || !roleAtLeast(member.profile.role, 'admin')) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }
  const body = (await req.json().catch(() => ({}))) as { scope?: unknown };
  const entries = await sitemap();
  const since = Date.now() - 2 * 24 * 60 * 60 * 1000;
  const urls = body.scope === 'all' ? entries.map((e) => e.url) : entries.filter((e) => e.lastModified && new Date(e.lastModified).getTime() >= since).map((e) => e.url);
  if (!urls.length) return NextResponse.json({ ok: true, submitted: 0, status: 0, note: 'Nothing changed in the last two days.' });
  const result = await submitToIndexNow(urls);
  // 200 and 202 both mean accepted (202: key check still pending on the search engine's side).
  const accepted = result.status === 200 || result.status === 202;
  return NextResponse.json({ ok: accepted, ...result, note: result.status === 0 ? 'Only the production website can notify search engines.' : undefined }, { status: accepted || result.status === 0 ? 200 : 502 });
}
