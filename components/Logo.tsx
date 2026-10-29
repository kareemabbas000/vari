import Image from 'next/image';
import { brandAssets } from '@/lib/content';

/** The original VARI black-and-gold wordmark, unaltered. */
export default function Logo({ className = '', priority = false }: { className?: string; priority?: boolean }) {
  const { logo } = brandAssets;
  return (
    <Image
      src={logo.id}
      alt={logo.alt}
      width={logo.width}
      height={logo.height}
      priority={priority}
      sizes="140px"
      className={className}
    />
  );
}
