// Prints SQL that adds the Turkish texts (tr.mjs) to the landing pages already in the database.
// Every translatable object whose English text matches gets a "tr" value — block order, ids and
// any edits made in the page builder are left alone, and existing Turkish text is never replaced.
// Usage: node scripts/landing-seed/tr-update.mjs > out.sql
import pages from './pages.mjs';
import TR from './tr.mjs';

const q = (s) => `$p$${s}$p$`;
console.log(`create or replace function pg_temp.add_tr(j jsonb, m jsonb) returns jsonb language sql immutable as $f$
  select case jsonb_typeof(j)
    when 'object' then (
      select coalesce(jsonb_object_agg(k, pg_temp.add_tr(v, m)), '{}'::jsonb) from jsonb_each(j) as e(k, v)
    ) || case when jsonb_typeof(j->'en') = 'string' and not (j ? 'tr') and m ? (j->>'en') then jsonb_build_object('tr', m->(j->>'en')) else '{}'::jsonb end
    when 'array' then (select coalesce(jsonb_agg(pg_temp.add_tr(v, m) order by i), '[]'::jsonb) from jsonb_array_elements(j) with ordinality as a(v, i))
    else j end
$f$;
with m as (select ${q(JSON.stringify(TR))}::jsonb as m)
update public.pages p set
  title = pg_temp.add_tr(p.title, m.m),
  seo = pg_temp.add_tr(p.seo, m.m),
  blocks = pg_temp.add_tr(p.blocks, m.m),
  draft = case when p.draft is null then null else pg_temp.add_tr(p.draft, m.m) end
from m
where p.slug in (${pages.map((p) => q(p.slug)).join(', ')})
returning p.slug;`);
