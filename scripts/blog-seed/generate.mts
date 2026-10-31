/**
 * Builds one SQL statement per launch article (scripts/blog-seed/0*.mjs) and prints the
 * SEO score of every translation. Usage: npx tsx scripts/blog-seed/generate.mts [outDir]
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { seoChecks } from '../../lib/seo-check';
import { textOf } from '../../lib/blog-html';
import a1 from './01-cost.mjs';
import a2 from './02-choose.mjs';
import a3 from './03-developers.mjs';
import a4 from './04-interior.mjs';
import a5 from './05-formats.mjs';
import extras from './extras.mjs';

const TAGS: Record<string, { en: string; de: string; es: string }> = {
  pricing: { en: 'Pricing', de: 'Preise', es: 'Precios' },
  'architectural-rendering': { en: 'Architectural rendering', de: 'Architekturvisualisierung', es: 'Render arquitectónico' },
  outsourcing: { en: 'Outsourcing', de: 'Outsourcing', es: 'Externalización' },
  'real-estate': { en: 'Real estate', de: 'Immobilien', es: 'Inmobiliario' },
  'off-plan': { en: 'Off-plan sales', de: 'Vorabverkauf', es: 'Venta sobre plano' },
  marketing: { en: 'Marketing', de: 'Marketing', es: 'Marketing' },
  'interior-design': { en: 'Interior design', de: 'Innenarchitektur', es: 'Interiorismo' },
  brief: { en: 'Briefing', de: 'Briefing', es: 'Briefing' },
  process: { en: 'Process', de: 'Ablauf', es: 'Proceso' },
  animation: { en: 'Animation', de: 'Animation', es: 'Animación' },
  'virtual-tour': { en: 'Virtual tour', de: 'Virtueller Rundgang', es: 'Tour virtual' },
};

const out = process.argv[2] || '/tmp/blog-seed';
mkdirSync(out, { recursive: true });
const q = (s: string) => `$v$${s}$v$`;

for (const a of [a1, a2, a3, a4, a5] as any[]) {
  const rows = (['en', 'de', 'es'] as const).map((l) => {
    const t = a.tr[l];
    // In-depth sections go before the article's closing VARI section (its second-to-last H2).
    const raw = t.html.trim();
    const marks = [...raw.matchAll(/<h2>/g)].map((m) => m.index!);
    const at = marks[marks.length - 2];
    const extra = ((extras as any)[a.key]?.[l] || '').trim();
    const html = (extra ? raw.slice(0, at) + extra + raw.slice(at) : raw).replace(/\n/g, '');
    const words = textOf(html).split(/\s+/).filter(Boolean).length;
    const { score, checks } = seoChecks(
      { title: t.title, slug: t.slug, excerpt: t.excerpt, html, seoTitle: t.seoTitle, seoDescription: t.seoDesc, focus: t.focus, takeaways: t.takeaways },
      { hasCover: true, hasCoverAlt: true, faqCount: a.faq.length },
    );
    console.log(`${a.key} ${l} score ${score} words ${words}` + checks.filter((c) => !c.ok).map((c) => `\n   ✗ ${c.label}`).join(''));
    return { locale: l, slug: t.slug, title: t.title, excerpt: t.excerpt, html, takeaways: t.takeaways, seo_title: t.seoTitle, seo_description: t.seoDesc, focus_keyword: t.focus, ready: true, word_count: words };
  });
  const tagRows = a.tags.map((slug: string) => ({ slug, name: TAGS[slug] }));
  const sql = `
with d as (select ${q(JSON.stringify({ rows, tags: tagRows, faq: a.faq, coverAlt: a.coverAlt }))}::jsonb as j),
post as (
  insert into public.blog_posts (status, publish_at, category_id, author_id, cover, cover_alt, featured, faq)
  select 'published', now() - interval '${a.daysAgo} days',
    (select id from public.blog_categories where slug = '${a.category}'),
    (select id from public.blog_authors where slug = 'vari-studio'),
    '${a.cover}', d.j->'coverAlt', ${a.featured}, d.j->'faq'
  from d returning id
),
tr as (
  insert into public.blog_post_translations (post_id, locale, slug, title, excerpt, html, takeaways, seo_title, seo_description, focus_keyword, ready, word_count)
  select post.id, (r->>'locale')::public.site_locale, r->>'slug', r->>'title', r->>'excerpt', r->>'html', r->'takeaways', r->>'seo_title', r->>'seo_description', r->>'focus_keyword', true, (r->>'word_count')::int
  from post, d, jsonb_array_elements(d.j->'rows') r returning post_id
),
tags as (
  insert into public.blog_tags (slug, name)
  select t->>'slug', t->'name' from d, jsonb_array_elements(d.j->'tags') t
  on conflict (slug) do update set name = excluded.name returning id, slug
)
insert into public.blog_post_tags (post_id, tag_id)
select (select id from post), tags.id from tags
returning post_id;`;
  writeFileSync(`${out}/${a.key}.sql`, sql);
  writeFileSync(`${out}/${a.key}.json`, JSON.stringify({ j: { rows, tags: tagRows, faq: a.faq, coverAlt: a.coverAlt }, category: a.category, cover: a.cover, featured: a.featured, days: a.daysAgo }));
}
console.log('written to', out);
