import { CMS_TAG, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, pick } from '@/lib/cms';
import { locales, defaultLocale, localizePath, type Locale } from '@/lib/i18n/config';

/**
 * Public blog data. Row Level Security only returns posts that are published with a
 * publish date in the past, and only translations marked ready — so scheduled posts appear
 * on their own (within the 5-minute cache) without any job running.
 */

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

async function rest<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Accept: 'application/json' },
      next: { tags: [CMS_TAG], revalidate: 300 },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export type BlogCategory = { slug: string; name: string; description: string };
export type BlogAuthor = { slug: string; name: string; role: string; bio: string; avatar?: string; links: { label: string; href: string }[] };
export type PostCard = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  words: number;
  publishedAt: string;
  updatedAt: string;
  cover: string;
  coverAlt: string;
  featured: boolean;
  category?: BlogCategory & { slugRaw: string };
  author?: BlogAuthor;
};
export type Post = PostCard & {
  html: string;
  takeaways: string[];
  seoTitle: string;
  seoDescription: string;
  faq: { q: string; a: string }[];
  tags: { slug: string; name: string }[];
  /** Slug per language that has a ready translation (for hreflang and the language switch). */
  translations: Partial<Record<Locale, string>>;
};

const CARD = 'slug,title,excerpt,word_count,updated_at,post:blog_posts!inner(id,publish_at,updated_at,cover,cover_alt,featured,category:blog_categories(slug,name,description),author:blog_authors(slug,name,role,bio,avatar,links))';

function toCategory(c: Row | null | undefined, locale: Locale) {
  return c ? { slug: c.slug, slugRaw: c.slug, name: pick(c.name, locale) || c.slug, description: pick(c.description, locale) } : undefined;
}
function toAuthor(a: Row | null | undefined, locale: Locale): BlogAuthor | undefined {
  return a ? { slug: a.slug, name: a.name, role: pick(a.role, locale), bio: pick(a.bio, locale), avatar: a.avatar || undefined, links: Array.isArray(a.links) ? a.links : [] } : undefined;
}
function toCard(r: Row, locale: Locale): PostCard {
  const p = r.post as Row;
  const later = (a: string, b: string) => (a > b ? a : b);
  return {
    id: p.id,
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt,
    words: r.word_count || 0,
    publishedAt: p.publish_at,
    updatedAt: later(r.updated_at || p.publish_at, p.updated_at || p.publish_at),
    cover: p.cover || '',
    coverAlt: pick(p.cover_alt, locale) || r.title,
    featured: !!p.featured,
    category: toCategory(p.category, locale),
    author: toAuthor(p.author, locale),
  };
}

/** All live posts in one language, newest first. */
export async function getPosts(locale: Locale): Promise<PostCard[]> {
  const rows = await rest<Row[]>(`blog_post_translations?select=${CARD}&locale=eq.${locale}&ready=eq.true`);
  return (rows ?? []).filter((r) => r.post).map((r) => toCard(r, locale)).sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}

export async function getPost(locale: Locale, slug: string): Promise<Post | null> {
  if (!/^[a-z0-9-]{1,120}$/.test(slug)) return null;
  const rows = await rest<Row[]>(`blog_post_translations?select=${CARD},html,takeaways,seo_title,seo_description,post_id&locale=eq.${locale}&slug=eq.${slug}&ready=eq.true&limit=1`);
  const r = rows?.[0];
  if (!r?.post) return null;
  const [others, faqRows, tagRows] = await Promise.all([
    rest<Row[]>(`blog_post_translations?select=locale,slug&post_id=eq.${r.post_id}&ready=eq.true`),
    rest<Row[]>(`blog_posts?select=faq&id=eq.${r.post_id}`),
    rest<Row[]>(`blog_post_tags?select=tag:blog_tags(slug,name)&post_id=eq.${r.post_id}`),
  ]);
  const faq = ((faqRows?.[0]?.faq as Row[]) || []).map((f) => ({ q: pick(f.q, locale), a: pick(f.a, locale) })).filter((f) => f.q && f.a);
  return {
    ...toCard(r, locale),
    html: r.html,
    takeaways: Array.isArray(r.takeaways) ? r.takeaways.filter((x: unknown) => typeof x === 'string' && x.trim()) : [],
    seoTitle: r.seo_title,
    seoDescription: r.seo_description,
    faq,
    tags: (tagRows ?? []).filter((t) => t.tag).map((t) => ({ slug: t.tag.slug, name: pick(t.tag.name, locale) || t.tag.slug })),
    translations: Object.fromEntries((others ?? []).map((o) => [o.locale, o.slug])),
  };
}

export async function getCategories(locale: Locale): Promise<BlogCategory[]> {
  const rows = await rest<Row[]>('blog_categories?select=slug,name,description&order=sort.asc');
  return (rows ?? []).map((c) => toCategory(c, locale)!);
}

export async function getAuthor(locale: Locale, slug: string): Promise<BlogAuthor | null> {
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return null;
  const rows = await rest<Row[]>(`blog_authors?select=slug,name,role,bio,avatar,links&slug=eq.${slug}&limit=1`);
  return toAuthor(rows?.[0], locale) ?? null;
}

/** Every live post in every language (sitemap, RSS). */
export async function getAllPostSlugs(): Promise<{ id: string; locale: Locale; slug: string; updatedAt: string }[]> {
  const rows = await rest<Row[]>('blog_post_translations?select=locale,slug,updated_at,post:blog_posts!inner(id,updated_at)&ready=eq.true');
  return (rows ?? []).filter((r) => r.post).map((r) => ({ id: r.post.id, locale: r.locale, slug: r.slug, updatedAt: r.updated_at > r.post.updated_at ? r.updated_at : r.post.updated_at }));
}

/** hreflang for a post: only the languages it is actually translated into. */
export function postAlternates(locale: Locale, translations: Partial<Record<Locale, string>>) {
  const languages: Record<string, string> = {};
  for (const l of locales) if (translations[l]) languages[l] = localizePath(l, `/blog/${translations[l]}`);
  const xDefault = translations[defaultLocale] ? defaultLocale : (Object.keys(translations)[0] as Locale | undefined);
  if (xDefault) languages['x-default'] = localizePath(xDefault, `/blog/${translations[xDefault]}`);
  return { canonical: localizePath(locale, `/blog/${translations[locale]}`), languages };
}

export function formatDate(iso: string, locale: Locale) {
  return new Intl.DateTimeFormat({ en: 'en-GB', de: 'de-DE', es: 'es-ES' }[locale], { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));
}
