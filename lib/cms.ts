import { contact as staticContact, copy, projects as staticProjects, services as staticServices, type Media, type Project } from '@/lib/content';
import { getDictionary, localizeProjects, type Dictionary } from '@/lib/i18n';
import { defaultLocale, type Locale } from '@/lib/i18n/config';

/**
 * Site content for the public website, read from the CMS (Supabase) with the
 * publishable key — RLS exposes published content only. Every request is cached and
 * tagged "cms"; the panel calls revalidateTag('cms') on publish. If the database is
 * unreachable the site renders the content that shipped with the code, so it never
 * goes blank.
 */

export const CMS_TAG = 'cms';
export { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '@/lib/supabase/config';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '@/lib/supabase/config';

export type I18nText = Partial<Record<Locale, string>>;

export type SiteSettings = {
  brand: { logoLight: string; logoDark: string };
  contact: { email: string; marketingEmail: string; address: string; social: { label: string; href: string }[] };
  home: { sections: { id: string; visible: boolean }[]; storyImages: string[] };
  intro: { enabled: boolean; languageGate: boolean };
  seo: { title?: I18nText; description?: I18nText };
};

export type CategoryItem = { slug: string; name: string; sort: number };
export type ServiceItem = { key: string; title: string; body: string; note: string };

export type SiteContent = {
  locale: Locale;
  t: Dictionary;
  projects: Project[];
  categories: CategoryItem[];
  services: ServiceItem[];
  settings: SiteSettings;
  source: 'cms' | 'static';
};

export const HOME_SECTIONS = ['hero', 'welcome', 'exteriors', 'interiors', 'services', 'story', 'experience', 'contact'] as const;

export const defaultSettings: SiteSettings = {
  brand: { logoLight: '/brand/vari-logo-light.png', logoDark: '/brand/vari-logo-dark.png' },
  contact: { email: staticContact.email, marketingEmail: staticContact.marketingEmail, address: staticContact.address, social: staticContact.social },
  home: { sections: HOME_SECTIONS.map((id) => ({ id, visible: true })), storyImages: copy.pillars.map((p) => p.media.id) },
  intro: { enabled: true, languageGate: true },
  seo: {},
};

/** Pick a locale's text with English as the fallback. */
export function pick(v: unknown, locale: Locale): string {
  if (!v || typeof v !== 'object') return typeof v === 'string' ? v : '';
  const o = v as I18nText;
  return o[locale] || o[defaultLocale] || '';
}

export function mediaSrc(source: string, path: string) {
  return source === 'storage' ? `${SUPABASE_URL}/storage/v1/object/public/media/${path.split('/').map(encodeURIComponent).join('/')}` : path;
}

function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

/** Overlay CMS values on the static dictionary, keeping static keys the CMS hasn't set. */
export function deepMerge<T>(base: T, over: unknown): T {
  if (Array.isArray(base)) {
    if (!Array.isArray(over)) return base;
    return base.map((b, i) => (i < over.length ? deepMerge(b, over[i]) : b)).concat(over.slice(base.length)) as T;
  }
  if (isObj(base)) {
    if (!isObj(over)) return base;
    const out: Record<string, unknown> = { ...base };
    for (const k of Object.keys(over)) out[k] = k in base ? deepMerge((base as Record<string, unknown>)[k], over[k]) : over[k];
    return out as T;
  }
  return (typeof over === typeof base && over !== '' ? over : base) as T;
}

async function rest<T>(path: string): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Accept: 'application/json' },
    next: { tags: [CMS_TAG], revalidate: 300 },
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`CMS ${path.split('?')[0]} → ${res.status}`);
  return res.json() as Promise<T>;
}

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

type Raw = { settings: Row | null; categories: Row[]; projects: Row[]; services: Row[]; blocks: Row[] };

/** After a failure, use the built-in content for a minute instead of waiting on every page. */
let unavailableUntil = 0;

async function loadRaw(): Promise<Raw | null> {
  if (Date.now() < unavailableUntil) return null;
  try {
    const [settings, categories, projects, services, blocks] = await Promise.all([
      rest<Row[]>('site_settings?select=data&id=eq.1'),
      rest<Row[]>('categories?select=slug,name,sort&order=sort.asc'),
      rest<Row[]>(
        'projects?select=slug,title,label,location,client,description,featured,sort,category:categories(slug,name),gallery:project_media(sort,media:media(source,path,width,height,alt))&published=eq.true&order=sort.asc',
      ),
      rest<Row[]>('services?select=key,title,body,note,sort&visible=eq.true&order=sort.asc'),
      rest<Row[]>('content_blocks?select=key,value'),
    ]);
    if (!projects.length) return null; // an empty CMS never blanks the site
    return { settings: settings[0]?.data ?? null, categories, projects, services, blocks };
  } catch (err) {
    unavailableUntil = Date.now() + 60_000;
    console.warn('[cms] falling back to built-in content:', (err as Error).message);
    return null;
  }
}

function staticContent(locale: Locale): SiteContent {
  const t = getDictionary(locale);
  return {
    locale,
    t,
    projects: localizeProjects(t),
    categories: [
      { slug: 'exterior', name: t.work.filters.exterior, sort: 10 },
      { slug: 'interior', name: t.work.filters.interior, sort: 20 },
    ],
    services: staticServices.map((s, i) => ({ key: s.drawing, title: t.services.items[i].title, body: t.services.items[i].body, note: t.services.notes[i] })),
    settings: defaultSettings,
    source: 'static',
  };
}

export function buildContent(raw: Raw, locale: Locale): SiteContent {
  // Texts: static dictionary + CMS overrides for this locale
  let t = getDictionary(locale);
  for (const b of raw.blocks) {
    const over = isObj(b.value) ? (b.value as Record<string, unknown>)[locale] : undefined;
    if (over && b.key in t) t = { ...t, [b.key]: deepMerge(t[b.key as keyof Dictionary], over) };
  }

  const categories: CategoryItem[] = raw.categories.map((c) => ({ slug: c.slug, name: pick(c.name, locale) || c.slug, sort: c.sort }));

  const projects: Project[] = raw.projects
    .map((p) => {
      const gallery = ((p.gallery as Row[]) || []).filter((g) => g.media).sort((a, b) => a.sort - b.sort);
      const media: Media[] = gallery.map((g) => ({
        id: mediaSrc(g.media.source, g.media.path),
        width: g.media.width || 1600,
        height: g.media.height || 1000,
        file: g.media.path,
        alt: pick(g.media.alt, locale) || pick(p.title, locale),
      }));
      const categorySlug: string = p.category?.slug || 'exterior';
      const project: Project = {
        slug: p.slug,
        title: pick(p.title, locale),
        discipline: categorySlug === 'interior' ? 'Interior' : 'Exterior',
        category: categorySlug,
        categoryName: pick(p.category?.name, locale) || categorySlug,
        location: pick(p.location, locale) || undefined,
        client: p.client || undefined,
        label: pick(p.label, locale),
        description: pick(p.description, locale).split(/\n{2,}/).map((s) => s.trim()).filter(Boolean),
        media,
        featured: !!p.featured,
      };
      return project;
    })
    .filter((p) => p.media.length > 0 && p.title);

  const services: ServiceItem[] = raw.services.map((s) => ({ key: s.key, title: pick(s.title, locale), body: pick(s.body, locale), note: pick(s.note, locale) }));
  // Keep dictionary-driven components in step with the CMS service list.
  t = { ...t, services: { ...t.services, items: services.map(({ title, body }) => ({ title, body })), notes: services.map((s) => s.note) } };

  const s = (raw.settings || {}) as Partial<SiteSettings>;
  const settings: SiteSettings = {
    brand: { ...defaultSettings.brand, ...(s.brand || {}) },
    contact: { ...defaultSettings.contact, ...(s.contact || {}), social: s.contact?.social?.length ? s.contact.social : defaultSettings.contact.social },
    home: {
      sections: s.home?.sections?.length ? s.home.sections : defaultSettings.home.sections,
      storyImages: s.home?.storyImages?.length ? s.home.storyImages : defaultSettings.home.storyImages,
    },
    intro: { ...defaultSettings.intro, ...(s.intro || {}) },
    seo: s.seo || {},
  };
  // Settings SEO texts override the dictionary defaults.
  const seoTitle = pick(settings.seo.title, locale);
  const seoDesc = pick(settings.seo.description, locale);
  if (seoTitle || seoDesc) t = { ...t, meta: { ...t.meta, siteTitle: seoTitle || t.meta.siteTitle, description: seoDesc || t.meta.description } };

  return { locale, t, projects: projects.length ? projects : localizeProjects(t), categories, services, settings, source: 'cms' };
}

/** Everything a page needs for one language. Cached per request cycle via fetch tags. */
export async function getSiteContent(locale: Locale): Promise<SiteContent> {
  const raw = await loadRaw();
  return raw ? buildContent(raw, locale) : staticContent(locale);
}

/** All project slugs (for static generation). */
export async function getProjectSlugs(): Promise<string[]> {
  const raw = await loadRaw();
  return raw ? raw.projects.map((p) => p.slug as string) : staticProjects.map((p) => p.slug);
}
