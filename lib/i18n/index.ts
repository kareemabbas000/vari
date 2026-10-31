import { projects as baseProjects, type Project } from '@/lib/content';
import { type Locale, SOURCE_LOCALE } from './config';
import en, { type Dictionary } from './dictionaries/en';
import de from './dictionaries/de';
import es from './dictionaries/es';
import tr from './dictionaries/tr';

export type { Dictionary };

/**
 * Languages that ship with a complete built-in translation. Languages added in the panel
 * start from English and are translated under Texts & translations (stored in the CMS).
 */
const dictionaries: Record<Locale, Dictionary> = { en, de, es, tr };

export const BUILTIN_LOCALES = Object.keys(dictionaries);

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries[SOURCE_LOCALE];
}

/** `fmt('All {n} interiors', { n: 12 })` */
export function fmt(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

/** Base project data (slugs, media, structure) merged with the locale's text. */
export function localizeProjects(t: Dictionary): Project[] {
  return baseProjects.map((p) => {
    const tr = t.projects[p.slug];
    if (!tr) return p;
    return {
      ...p,
      title: tr.title ?? p.title,
      label: tr.label,
      location: p.location ? tr.location ?? p.location : undefined,
      description: tr.description,
      media: p.media.map((m, i) => ({ ...m, alt: tr.alts[i] ?? m.alt })),
      category: p.discipline.toLowerCase(),
      categoryName: t.work.filters[p.discipline === 'Interior' ? 'interior' : 'exterior'],
    };
  });
}
