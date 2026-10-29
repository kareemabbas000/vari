import Image from 'next/image';
import { brandAssets } from '@/lib/content';

/**
 * The original VARI wordmark ("vari - black gold_300x02.png").
 *
 * The source artwork is black "VA" + gold "RI" + black "Studio" on a transparent
 * background — designed for the old white header. On the dark site we keep the
 * artwork untouched but key it through an SVG filter: every neutral (non-gold) pixel
 * is redrawn in bone-white, gold pixels pass through unchanged. Anti-aliasing is
 * preserved because the white layer inherits the source alpha.
 */
export function LogoFilterDefs() {
  return (
    <svg width="0" height="0" aria-hidden focusable="false" style={{ position: 'absolute' }}>
      <filter id="vari-logo-light" colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%">
        {/* Gold matte: alpha = 4 × (R − B). Gold ≈ 0.61 → 1, black/grey ≈ 0 → 0 */}
        <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  4 0 -4 0 0" result="goldMatte" />
        <feComposite in="SourceGraphic" in2="goldMatte" operator="in" result="gold" />
        <feFlood floodColor="#F3EEE4" result="bone" />
        <feComposite in="bone" in2="SourceAlpha" operator="in" result="boneShape" />
        <feComposite in="boneShape" in2="goldMatte" operator="out" result="neutralAsBone" />
        <feMerge>
          <feMergeNode in="neutralAsBone" />
          <feMergeNode in="gold" />
        </feMerge>
      </filter>
    </svg>
  );
}

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
  return (
    <Image
      src={logo.id}
      alt={logo.alt}
      width={logo.width}
      height={logo.height}
      priority={priority}
      sizes={sizes}
      className={className}
      style={tone === 'light' ? { filter: 'url(#vari-logo-light)' } : undefined}
    />
  );
}
