import { projects as baseProjects, type Project } from '@/lib/content';
import { type Locale, locales, localizePath, defaultLocale } from './config';
import en, { type Dictionary } from './dictionaries/en';
import de from './dictionaries/de';
import es from './dictionaries/es';

export type { Dictionary };

const dictionaries: Record<Locale, Dictionary> = { en, de, es };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries[defaultLocale];
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

/** hreflang alternates + canonical for a locale-agnostic path such as `/work`. */
export function alternatesFor(locale: Locale, path: string) {
  const languages: Record<string, string> = {};
  for (const l of locales) languages[l] = localizePath(l, path);
  languages['x-default'] = localizePath(defaultLocale, path);
  return { canonical: localizePath(locale, path), languages };
}
