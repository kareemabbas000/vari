'use client';

import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { forwardRef, type ComponentProps } from 'react';

/**
 * Link that loads the next page when the visitor shows intent (hover, touch, keyboard focus),
 * not when the link scrolls into view. Next.js' default preloads every visible link, so one
 * blog list page cost 20–40 extra requests per visitor on Vercel's CDN-request allowance. Every
 * page is a cached static page, so a click is still instant. Use this instead of next/link on
 * the public site (the admin panel keeps next/link).
 */
const HoverLink = forwardRef<HTMLAnchorElement, ComponentProps<typeof NextLink>>(function HoverLink(
  { href, prefetch, onMouseEnter, onTouchStart, onFocus, ...rest },
  ref,
) {
  const router = useRouter();
  const target = typeof href === 'string' ? href : href.pathname ?? '';
  const warm = () => {
    if (prefetch !== false && target.startsWith('/')) router.prefetch(target);
  };
  return (
    <NextLink
      ref={ref}
      href={href}
      prefetch={false}
      onMouseEnter={(e) => {
        warm();
        onMouseEnter?.(e);
      }}
      onTouchStart={(e) => {
        warm();
        onTouchStart?.(e);
      }}
      onFocus={(e) => {
        warm();
        onFocus?.(e);
      }}
      {...rest}
    />
  );
});

export default HoverLink;
