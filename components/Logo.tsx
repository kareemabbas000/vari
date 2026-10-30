'use client';

import Image from 'next/image';
import { useSiteSettingsOptional } from './I18nProvider';
import { brandAssets } from '@/lib/content';

/**
 * The original VARI wordmark ("vari - black gold_300x02"), prepared in two colourways
 * from the source artwork (see scripts/logo-variants.py):
 *   light — white "VA" + "Studio", gold "RI"  → for dark backgrounds (default)
 *   dark  — black "VA" + "Studio", gold "RI"  → the original, for light backgrounds
 * Same file, same composition; only the neutral letterforms change colour. Both are
 * 4× upscaled with cleaned edges so they stay sharp from the header to the footer.
 */
const VARIANTS = {
  light: '/brand/vari-logo-light.png',
  dark: '/brand/vari-logo-dark.png',
} as const;

export default function Logo({
  className = '',
  priority = false,
  tone = 'light',
  sizes = '160px',
}: {
  className?: string;
  priority?: boolean;
  tone?: keyof typeof VARIANTS;
  sizes?: string;
}) {
  // A logo replaced in the control panel (Brand & settings) wins over the built-in files.
  const brand = useSiteSettingsOptional()?.brand;
  const src = (tone === 'light' ? brand?.logoLight : brand?.logoDark) || VARIANTS[tone];
  return (
    <Image
      src={src}
      alt={brandAssets.logo.alt}
      width={1309}
      height={648}
      priority={priority}
      sizes={sizes}
      unoptimized
      className={className}
    />
  );
}
