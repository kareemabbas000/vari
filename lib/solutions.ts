import type { Dictionary } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n/config';
import { pick, type NavItem } from '@/lib/cms';
import { resolveHref } from '@/lib/blocks/schema';

/**
 * The commercial landing pages (page builder, kind = custom). Linked from /services and the
 * footer so they are part of the site, not reachable through the sitemap alone
 * (docs/seo/TECHNICAL-AUDIT.md T3). Editable in Panel → Menus ("Specialist services");
 * while that list is empty, these built-in links are shown with their dictionary labels.
 */
export const SOLUTION_LINKS = [
  { key: 'developers', path: '/3d-rendering-services-for-developers' },
  { key: 'interiors', path: '/interior-visualization-services' },
  { key: 'germany', path: '/architectural-visualization-germany' },
  { key: 'spain', path: '/architectural-rendering-spain' },
] as const;

export type SolutionKey = (typeof SOLUTION_LINKS)[number]['key'];
export type SolutionEntry = { key: string; label: string; href: string; external: boolean };

/** The links to show: the panel's list if set, otherwise the built-in four. */
export function solutionEntries(custom: NavItem[] | undefined, t: Dictionary, locale: Locale, localize: (path: string) => string): SolutionEntry[] {
  const own = (custom || []).filter((n) => n.href && pick(n.label, locale));
  if (!own.length) return SOLUTION_LINKS.map((s) => ({ key: s.key, label: t.solutions[s.key], href: localize(s.path), external: false }));
  return own.map((n, i) => {
    const external = /^https?:/i.test(n.href);
    return { key: `${i}-${n.href}`, label: pick(n.label, locale), href: resolveHref(n.href, localize), external };
  });
}
