import { createHash } from 'node:crypto';
import { isLocale, type Locale, SOURCE_LOCALE } from '@/lib/i18n/config';

/** Salted one-way hash of the client IP, for throttling only (the raw IP is never stored). */
export function ipHash(req: Request) {
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || req.headers.get('x-real-ip') || '';
  if (!ip) return null;
  const salt = process.env.IP_HASH_SALT || 'vari-studio';
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex');
}

export function localeFrom(value: unknown): Locale {
  return typeof value === 'string' && isLocale(value) ? value : SOURCE_LOCALE; // the database resolves disabled languages to the default
}

/** The public origin the visitor used (works on preview and production domains alike). */
export function originOf(req: Request) {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  const url = new URL(req.url);
  const host = req.headers.get('x-forwarded-host') || url.host;
  const proto = req.headers.get('x-forwarded-proto') || url.protocol.replace(':', '');
  return host ? `${proto}://${host}` : (env || url.origin).replace(/\/$/, '');
}
