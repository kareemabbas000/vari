/**
 * Image loader for next/image.
 *
 * Portfolio media lives on the original Wix media CDN (static.wixstatic.com), which can
 * resize and re-encode on the fly. We keep the original media IDs as the source of truth
 * and ask the CDN for exactly the width each breakpoint needs.
 *
 * After `npm run assets:pull`, set NEXT_PUBLIC_MEDIA_SOURCE=local to serve the downloaded
 * originals from /public/media instead.
 */
const WIX_MEDIA = 'https://static.wixstatic.com/media/';

export function isWixMediaId(src: string) {
  return /^[0-9a-f]{6}_[0-9a-f]{32}~mv2\.(png|jpe?g|webp)$/i.test(src);
}

export function wixUrl(id: string, width: number, quality = 82) {
  const w = Math.max(16, Math.round(width));
  // `fit` keeps the original aspect ratio and never upscales beyond the source.
  return `${WIX_MEDIA}${id}/v1/fit/w_${w},h_${w * 2},q_${quality},enc_avif,quality_auto/${id}`;
}

export function mediaUrl(src: string, width = 1600, quality = 82) {
  if (!isWixMediaId(src)) return src;
  if (process.env.NEXT_PUBLIC_MEDIA_SOURCE === 'local') return `/media/${src}`;
  return wixUrl(src, width, quality);
}

export default function imageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  if (isWixMediaId(src)) return mediaUrl(src, width, quality ?? 82);
  return src.includes('?') ? `${src}&w=${width}` : `${src}?w=${width}`;
}
