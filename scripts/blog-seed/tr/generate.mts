/**
 * Turkish editions of the launch articles → one SQL file that adds them to the existing posts
 * (matched by their English slug) and prints each article's SEO score.
 * Usage: npx tsx scripts/blog-seed/tr/generate.mts [out.sql]
 */
import { writeFileSync } from 'node:fs';
import { seoChecks } from '../../../lib/seo-check';
import { textOf } from '../../../lib/blog-html';
import en1 from '../01-cost.mjs';
import en2 from '../02-choose.mjs';
import en3 from '../03-developers.mjs';
import en4 from '../04-interior.mjs';
import en5 from '../05-formats.mjs';
import cost from './cost.mjs';
import choose from './choose.mjs';
import developers from './developers.mjs';
import interior from './interior.mjs';
import formats from './formats.mjs';

const TAGS_TR: Record<string, string> = {
  pricing: 'Fiyatlar',
  'architectural-rendering': 'Mimari görselleştirme',
  outsourcing: 'Dış kaynak kullanımı',
  'real-estate': 'Gayrimenkul',
  'off-plan': 'Topraktan satış',
  marketing: 'Pazarlama',
  'interior-design': 'İç mimarlık',
  brief: 'Proje brifi',
  process: 'Süreç',
  animation: 'Animasyon',
  'virtual-tour': 'Sanal tur',
};

const q = (s: string) => `$v$${s}$v$`;
const pairs = [[en1, cost], [en2, choose], [en3, developers], [en4, interior], [en5, formats]] as any[];
const out: string[] = ['begin;'];

for (const [en, t] of pairs) {
  if (en.key !== t.key) throw new Error(`mismatch ${en.key}/${t.key}`);
  if (t.faq.length !== en.faq.length) throw new Error(`${t.key}: FAQ count differs`);
  const html = t.html.trim().replace(/\n/g, '');
  const words = textOf(html).split(/\s+/).filter(Boolean).length;
  const { score, checks } = seoChecks(
    { title: t.title, slug: t.slug, excerpt: t.excerpt, html, seoTitle: t.seoTitle, seoDescription: t.seoDesc, focus: t.focus, takeaways: t.takeaways },
    { hasCover: true, hasCoverAlt: true, faqCount: t.faq.length, locale: 'tr' },
  );
  console.log(`${t.key} score ${score} words ${words}` + checks.filter((c) => !c.ok).map((c) => `\n   ✗ ${c.label}`).join(''));
  const enSlug = en.tr.en.slug;
  const post = `(select post_id from public.blog_post_translations where locale = 'en' and slug = ${q(enSlug)})`;
  const row = { slug: t.slug, title: t.title, excerpt: t.excerpt, html, takeaways: t.takeaways, seo_title: t.seoTitle, seo_description: t.seoDesc, focus_keyword: t.focus, word_count: words };
  out.push(`
-- ${t.key}: ${t.title}
with d as (select ${q(JSON.stringify(row))}::jsonb as r)
insert into public.blog_post_translations (post_id, locale, slug, title, excerpt, html, takeaways, seo_title, seo_description, focus_keyword, ready, word_count)
select ${post}, 'tr', r->>'slug', r->>'title', r->>'excerpt', r->>'html', r->'takeaways', r->>'seo_title', r->>'seo_description', r->>'focus_keyword', true, (r->>'word_count')::int
from d where ${post} is not null
on conflict (post_id, locale) do update set slug = excluded.slug, title = excluded.title, excerpt = excluded.excerpt, html = excluded.html, content = null,
  takeaways = excluded.takeaways, seo_title = excluded.seo_title, seo_description = excluded.seo_description, focus_keyword = excluded.focus_keyword, ready = true, word_count = excluded.word_count;
update public.blog_posts p set
  cover_alt = coalesce(p.cover_alt, '{}'::jsonb) || jsonb_build_object('tr', ${q(t.coverAlt)}::text),
  faq = (
    select coalesce(jsonb_agg(
      jsonb_set(jsonb_set(f, '{q}', coalesce(f->'q', '{}'::jsonb) || jsonb_build_object('tr', x->>'q')), '{a}', coalesce(f->'a', '{}'::jsonb) || jsonb_build_object('tr', x->>'a'))
      order by i), '[]'::jsonb)
    from jsonb_array_elements(p.faq) with ordinality as e(f, i)
    left join jsonb_array_elements(${q(JSON.stringify(t.faq))}::jsonb) with ordinality as y(x, j) on j = i
  )
where p.id = ${post};`);
}
for (const [slug, name] of Object.entries(TAGS_TR)) {
  out.push(`update public.blog_tags set name = coalesce(name, '{}'::jsonb) || jsonb_build_object('tr', ${q(name)}::text) where slug = ${q(slug)};`);
}
out.push('commit;');
const file = process.argv[2] || '/tmp/blog-tr.sql';
writeFileSync(file, out.join('\n') + '\n');
console.log('written to', file);
