import { NextResponse, after } from 'next/server';
import { refresh } from '@/lib/cache-refresh';
import { currentMember, roleAtLeast } from '@/lib/supabase/server';
import { submitToIndexNow } from '@/lib/indexnow';
import sitemap from '@/app/sitemap';

export const dynamic = 'force-dynamic';

/**
 * Publish: the website is cached until something is published, so this is what makes a change
 * visible (editors and above). Only the changed area is refreshed: a new article rebuilds the
 * blog pages, not the whole site, and pages are rebuilt lazily on their next visit. Then tells
 * IndexNow search engines which URLs changed. Articles carry real update dates in the sitemap,
 * so a normal publish reports what changed in the last two days; `{ "all": true }` (admins)
 * reports every URL once, e.g. after switching a language on.
 */
export async function POST(req: Request) {
  const member = await currentMember();
  if (!member?.profile || !roleAtLeast(member.profile.role, 'editor')) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }
  const body = (await req.json().catch(() => ({}))) as { all?: unknown; scope?: unknown };
  const all = body.all === true && roleAtLeast(member.profile.role, 'admin');
  const scope = refresh(body.scope);
  after(async () => {
    const entries = await sitemap();
    const since = Date.now() - 2 * 24 * 60 * 60 * 1000;
    const urls = all ? entries.map((e) => e.url) : entries.filter((e) => e.lastModified && new Date(e.lastModified).getTime() >= since).map((e) => e.url);
    if (urls.length) await submitToIndexNow(urls);
  });
  return NextResponse.json({ ok: true, scope, at: new Date().toISOString() });
}
