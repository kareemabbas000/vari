/**
 * The commercial landing pages (page builder, kind = custom). Linked from /services and the
 * footer so they are part of the site, not reachable through the sitemap alone
 * (docs/seo/TECHNICAL-AUDIT.md T3). Anchor texts live in the dictionary (`solutions`).
 */
export const SOLUTION_LINKS = [
  { key: 'developers', path: '/3d-rendering-services-for-developers' },
  { key: 'interiors', path: '/interior-visualization-services' },
  { key: 'germany', path: '/architectural-visualization-germany' },
  { key: 'spain', path: '/architectural-rendering-spain' },
] as const;

export type SolutionKey = (typeof SOLUTION_LINKS)[number]['key'];
