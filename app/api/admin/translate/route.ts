import { NextResponse } from 'next/server';
import { currentMember, roleAtLeast } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Optional machine translation for the blog editor (DeepL). Only available when
 * DEEPL_API_KEY is set in the environment; the result is a draft for a human to review.
 */
export async function GET() {
  return NextResponse.json({ available: !!process.env.DEEPL_API_KEY });
}

export async function POST(req: Request) {
  const member = await currentMember();
  if (!member?.profile || !roleAtLeast(member.profile.role, 'editor')) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  const key = process.env.DEEPL_API_KEY;
  if (!key) return NextResponse.json({ ok: false, error: 'DeepL is not configured (DEEPL_API_KEY).' }, { status: 501 });
  const body = (await req.json().catch(() => ({}))) as { texts?: unknown; target?: unknown; html?: unknown };
  const target = body.target === 'de' ? 'DE' : body.target === 'es' ? 'ES' : null;
  const texts = Array.isArray(body.texts) ? body.texts.filter((x): x is string => typeof x === 'string').slice(0, 50) : [];
  if (!target || !texts.length || texts.join('').length > 120_000) return NextResponse.json({ ok: false, error: 'invalid_request' }, { status: 422 });
  const host = key.endsWith(':fx') ? 'https://api-free.deepl.com' : 'https://api.deepl.com';
  const res = await fetch(`${host}/v2/translate`, {
    method: 'POST',
    headers: { Authorization: `DeepL-Auth-Key ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: texts, source_lang: 'EN', target_lang: target, ...(body.html ? { tag_handling: 'html' } : {}), formality: target === 'DE' ? 'prefer_more' : 'default' }),
    signal: AbortSignal.timeout(30000),
  }).catch(() => null);
  if (!res?.ok) return NextResponse.json({ ok: false, error: `DeepL error ${res?.status ?? 'network'}` }, { status: 502 });
  const json = (await res.json()) as { translations: { text: string }[] };
  return NextResponse.json({ ok: true, texts: json.translations.map((t) => t.text) });
}
