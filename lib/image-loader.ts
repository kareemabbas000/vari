/**
 * Image URLs for the whole site.
 *
 * Portfolio images are self-hosted: scripts/media/mirror-wix.mjs copied every original from
 * Wix and wrote AVIF + WebP files at 256–2560 px to public/media/<id>/ (see
 * lib/media-manifest.json). They are requested as /img/<id>/<width>; next.config.mjs answers
 * with the AVIF file for browsers that accept it and WebP for the rest, cached for a year.
 *
 * Settings (environment variables):
 * - NEXT_PUBLIC_MEDIA_BASE=https://media.example.com  serve the same files from another host
 *   (e.g. Cloudflare R2: copy public/media there). Images then cost Vercel nothing. WebP is used.
 * - NEXT_PUBLIC_MEDIA_SOURCE=wix  load everything from the Wix CDN again (the old behaviour).
 * An image that is not in the manifest (not mirrored yet) still loads from Wix.
 */
import manifest from './media-manifest.json';

type Entry = { w: number; h: number; widths: number[] };
const MEDIA = manifest as Record<string, Entry>;
const WIX_MEDIA = 'https://static.wixstatic.com/media/';
const SOURCE = process.env.NEXT_PUBLIC_MEDIA_SOURCE;
const BASE = (process.env.NEXT_PUBLIC_MEDIA_BASE || '').replace(/\/$/, '');
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.vari-studio.com').replace(/\/$/, '');

export function isWixMediaId(src: string) {
  return /^[0-9a-f]{6}_[0-9a-f]{32}~mv2\.(png|jpe?g|webp)$/i.test(src);
}

export function wixUrl(id: string, width: number, quality = 82) {
  const w = Math.max(16, Math.round(width));
  // `fit` keeps the original aspect ratio and never upscales beyond the source.
  return `${WIX_MEDIA}${id}/v1/fit/w_${w},h_${w * 2},q_${quality},enc_avif,quality_auto/${id}`;
}

const stemOf = (id: string) => id.replace(/~mv2\.[a-z]+$/i, '');

/** The self-hosted copy of a Wix image at the smallest width that covers `width`, if mirrored. */
function selfHosted(id: string, width: number): string | null {
  if (SOURCE === 'wix') return null;
  const stem = stemOf(id);
  const entry = MEDIA[stem];
  if (!entry) return null;
  const w = entry.widths.find((x) => x >= width) ?? entry.widths[entry.widths.length - 1];
  return BASE ? `${BASE}/media/${stem}/${w}.webp` : `/img/${stem}/${w}`;
}

/** Image URL at a width (relative on this site; use absoluteMediaUrl for feeds and schema). */
export function mediaUrl(src: string, width = 1600, quality = 82) {
  if (!isWixMediaId(src)) return src;
  return selfHosted(src, width) ?? wixUrl(src, width, quality);
}

/** Absolute image URL, for JSON-LD, RSS and other places read outside the website. */
export function absoluteMediaUrl(src: string, width = 1600) {
  const url = mediaUrl(src, width);
  return url.startsWith('/') ? `${SITE}${url}` : url;
}

/**
 * Image for Open Graph / Twitter cards: a 1200×630 crop in JPEG (social platforms do not render
 * AVIF). Self-hosted images have a ready-made og.jpg.
 */
export function ogImageUrl(src: string) {
  if (!isWixMediaId(src)) return src;
  const stem = stemOf(src);
  if (SOURCE !== 'wix' && MEDIA[stem]) return `${BASE || SITE}/media/${stem}/og.jpg`;
  return `${WIX_MEDIA}${src}/v1/fill/w_1200,h_630,q_85/${src}`;
}

/** Wix image URLs inside stored HTML (articles) → the self-hosted copy at the same width. */
const WIX_URL = /https:\/\/static\.wixstatic\.com\/media\/([0-9a-f]{6}_[0-9a-f]{32}~mv2\.(?:png|jpe?g|webp))(?:\/v1\/[a-z]+\/w_(\d+)[^"'\s]*)?/gi;
export function selfHostHtmlImages(html: string) {
  return html.replace(WIX_URL, (url, id: string, w?: string) => selfHosted(id, Number(w) || 1600) ?? url);
}

/** srcset of a self-hosted image (for HTML that does not go through next/image). */
export function mediaSrcSet(src: string): string | null {
  const id = src.match(/\/img\/([^/]+)\/\d+$/)?.[1];
  const entry = id && MEDIA[id];
  if (!entry) return null;
  return entry.widths.map((w) => `/img/${id}/${w} ${w}w`).join(', ');
}

export default function imageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  if (isWixMediaId(src)) return mediaUrl(src, width, quality ?? 82);
  // Panel uploads saved with smaller copies ("-rv.webp", see components/admin/media.ts): phones
  // get the 640 px file, tablets and laptops the 1280 px one, large screens the full 2560 px.
  if (/-rv\.webp$/.test(src)) return width <= 640 ? src.replace(/-rv\.webp$/, '-rv.w640.webp') : width <= 1280 ? src.replace(/-rv\.webp$/, '-rv.w1280.webp') : src;
  return src.includes('?') ? `${src}&w=${width}` : `${src}?w=${width}`;
}
