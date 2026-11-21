import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { refresh } from '@/lib/cache-refresh';

export const dynamic = 'force-dynamic';

/**
 * Database hook: refreshes the website when content changes outside the panel (SQL run in the
 * Supabase editor) and when a scheduled article reaches its publish time. Called by the
 * triggers and the pg_cron job in scripts/db/cache-hooks.sql with the shared secret.
 *
 * Off until REVALIDATE_SECRET is set in Vercel (answers 404). A request without the right
 * secret is refused, so nobody else can make the site rebuild its cache.
 */
export async function POST(req: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || secret.length < 24) return new NextResponse(null, { status: 404 });
  const given = Buffer.from(req.headers.get('x-revalidate-secret') ?? '');
  const want = Buffer.from(secret);
  if (given.length !== want.length || !timingSafeEqual(given, want)) return NextResponse.json({ ok: false }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { scope?: unknown };
  return NextResponse.json({ ok: true, scope: refresh(body.scope) });
}
