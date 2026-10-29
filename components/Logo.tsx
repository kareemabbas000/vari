import Image from 'next/image';
import { useId } from 'react';
import { brandAssets } from '@/lib/content';
import { mediaUrl } from '@/lib/image-loader';

/**
 * The original VARI wordmark ("vari - black gold_300x02.png") — black "VA", gold "RI",
 * black "Studio" on a transparent background, designed for the old white header.
 *
 * On dark backgrounds the artwork is used as-is (same file, same composition) and
 * recoloured inside an inline SVG: every neutral pixel ("VA", "Studio") becomes pure
 * white while the gold "RI" passes through untouched. Filtering inside SVG (rather
 * than a CSS filter on an <img>) renders identically in Chrome, Firefox and Safari,
 * and the white keeps the source's anti-aliased edges because it inherits its alpha.
 */
export default function Logo({
  className = '',
  priority = false,
  tone = 'light',
  sizes = '160px',
}: {
  className?: string;
  priority?: boolean;
  /** light = for dark backgrounds (default), original = untouched artwork */
  tone?: 'light' | 'original';
  sizes?: string;
}) {
  const { logo } = brandAssets;
  const id = `vari-logo-${useId().replace(/:/g, '')}`;

  if (tone === 'original') {
    return <Image src={logo.id} alt={logo.alt} width={logo.width} height={logo.height} priority={priority} sizes={sizes} className={className} />;
  }

  return (
    <svg
      viewBox={`0 0 ${logo.width} ${logo.height}`}
      width={logo.width}
      height={logo.height}
      role="img"
      aria-label={logo.alt}
      className={`block ${className}`}
    >
      <filter id={id} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
        {/* Gold matte: alpha = 4 × (R − B). Gold (R−B ≈ 0.6) → 1, black/grey (R≈B) → 0 */}
        <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  4 0 -4 0 0" result="goldMatte" />
        <feComposite in="SourceGraphic" in2="goldMatte" operator="in" result="gold" />
        <feFlood floodColor="#FFFFFF" result="white" />
        <feComposite in="white" in2="SourceAlpha" operator="in" result="whiteShape" />
        <feComposite in="whiteShape" in2="goldMatte" operator="out" result="neutralAsWhite" />
        <feMerge>
          <feMergeNode in="neutralAsWhite" />
          <feMergeNode in="gold" />
        </feMerge>
      </filter>
      <image
        href={mediaUrl(logo.id, logo.width * 3, 95)}
        width={logo.width}
        height={logo.height}
        preserveAspectRatio="xMidYMid meet"
        filter={`url(#${id})`}
      />
    </svg>
  );
}
