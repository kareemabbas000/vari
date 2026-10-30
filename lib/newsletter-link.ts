import { NextResponse } from 'next/server';
import { rpc } from '@/lib/supabase';
import { isLocale, LOCALE_COOKIE, defaultLocale } from '@/lib/i18n/config';
import { originOf } from '@/lib/request';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Shared handler for the emailed confirm / unsubscribe links: runs the database step and
 * redirects to the status page in the subscriber's language.
 */
export async function handleNewsletterLink(req: Request, fn: 'confirm_newsletter' | 'unsubscribe_newsletter') {
  const url = new URL(req.url);
  const token = url.searchParams.get('token') || '';
  const cookieLocale = (req.headers.get('cookie') || '').match(new RegExp(`${LOCALE_COOKIE}=(\\w+)`))?.[1];
  let locale = isLocale(cookieLocale) ? cookieLocale : defaultLocale;
  let status = 'invalid';

  if (UUID_RE.test(token)) {
    const res = await rpc<{ status: string; locale: string | null }[]>(fn, { p_token: token });
    if (res.ok && res.data[0]) {
      status = res.data[0].status;
      if (isLocale(res.data[0].locale)) locale = res.data[0].locale;
    } else if (!res.ok) {
      status = 'error';
    }
  }

  const res = NextResponse.redirect(`${originOf(req)}/${locale}/newsletter?status=${status}`, 303);
  res.headers.set('Cache-Control', 'no-store');
  res.headers.set('Referrer-Policy', 'no-referrer');
  return res;
}
