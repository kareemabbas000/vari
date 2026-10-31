// Prints SQL that inserts the landing pages (published) — node scripts/landing-seed/generate.mjs > out.sql
import pages from './pages.mjs';
const q = (s) => `$p$${s}$p$`;
const values = pages
  .map((p) => `(${q(p.slug)}, 'custom', ${q(JSON.stringify(p.title))}::jsonb, ${q(JSON.stringify(p.seo))}::jsonb, ${q(JSON.stringify(p.blocks))}::jsonb, true, now(), 200)`)
  .join(',\n');
console.log(`insert into public.pages (slug, kind, title, seo, blocks, published, published_at, sort) values\n${values}\non conflict (slug) do nothing;`);
