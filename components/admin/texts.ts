import { getDictionary, type Dictionary } from '@/lib/i18n';
import { leaves, type Leaf } from '@/lib/merge';

/** Dictionary sections handled elsewhere in the panel (structured content). */
const MANAGED_ELSEWHERE = new Set(['projects']);
/** Paths inside sections that come from structured tables. */
export const EXCLUDED_PATHS = ['services.items', 'services.notes'];

export const SECTION_NAMES: Record<string, { name: string; about: string }> = {
  meta: { name: 'SEO & page titles', about: 'Browser titles and search-engine descriptions' },
  common: { name: 'Common labels', about: 'Skip link, copyright, small shared words' },
  nav: { name: 'Navigation', about: 'Menu items and the header button' },
  disciplines: { name: 'Disciplines', about: 'Exterior / Interior labels' },
  hero: { name: 'Hero', about: 'Headline, label and the two buttons' },
  welcome: { name: 'Welcome', about: 'Studio introduction on the home page' },
  exteriors: { name: 'Exteriors section', about: 'Home page exterior gallery' },
  interiors: { name: 'Interiors section', about: 'Rooms, enfilade and their labels' },
  services: { name: 'Services section', about: 'Headings and labels around the services' },
  story: { name: 'Studio story', about: 'The five chapters' },
  experience: { name: 'Experience bands', about: 'The two moving lines of text' },
  contact: { name: 'Contact section & page', about: 'Headings and intro text' },
  form: { name: 'Contact form', about: 'Field labels, messages, enquiry presets' },
  newsletter: { name: 'Newsletter', about: 'Sign-up box and its messages' },
  footer: { name: 'Footer', about: 'Footer texts and title block' },
  work: { name: 'Work page', about: 'Portfolio heading, filters, views' },
  project: { name: 'Project pages', about: 'Labels on every project page' },
  viewer: { name: 'Image viewer', about: 'Full-screen viewer labels' },
  studio: { name: 'Studio page', about: 'Studio page labels' },
  notFound: { name: '404 page', about: 'Page-not-found message' },
  preloader: { name: 'Intro', about: 'Intro stages and labels' },
  language: { name: 'Language choice', about: 'Texts on the language gate' },
  messages: { name: 'Form messages', about: 'Rate limits and newsletter states' },
  legal: { name: 'Consent & legal', about: 'Consent notes under the forms' },
  newsletterStatus: { name: 'Newsletter status page', about: 'Confirmed / unsubscribed messages' },
  emails: { name: 'Emails', about: 'Acknowledgement and confirmation emails' },
  privacy: { name: 'Privacy notice', about: 'The privacy page (have it legally reviewed)' },
  welcomeLayer: { name: 'Welcome layer prefix', about: 'Small letter before layer numbers' },
};

export const SECTIONS = Object.keys(getDictionary('en')).filter((k) => !MANAGED_ELSEWHERE.has(k));

export function sectionLeaves(key: string): Leaf[] {
  const en = getDictionary('en')[key as keyof Dictionary];
  return leaves(en, []).filter((l) => !EXCLUDED_PATHS.some((p) => [key, ...l.path].join('.').startsWith(p)));
}

/** Readable label for a path such as ["intents", "design", "message"]. */
export function pathLabel(path: (string | number)[]) {
  return path
    .map((p) => (typeof p === 'number' ? `#${p + 1}` : p.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase())))
    .join(' › ');
}
