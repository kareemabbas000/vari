/** What the header and footer show (panel → Menus & announcement). */
export type Layout = {
  header: { cta: boolean; languages: boolean };
  footer: { cta: boolean; newsletter: boolean; explore: boolean; contact: boolean; social: boolean; signature: boolean; backToTop: boolean };
};
export const DEFAULT_LAYOUT: Layout = {
  header: { cta: true, languages: true },
  footer: { cta: true, newsletter: true, explore: true, contact: true, social: true, signature: true, backToTop: true },
};
