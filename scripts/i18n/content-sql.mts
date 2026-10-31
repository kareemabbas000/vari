/**
 * SQL that adds one built-in language's translations to the CMS content (projects, image
 * descriptions, services, categories, system page titles). Existing values are kept.
 * Usage: npx tsx scripts/i18n/content-sql.mts tr > out.sql
 */
import { getDictionary } from '../../lib/i18n';

const code = process.argv[2];
const t = getDictionary(code);
const q = (v: unknown) => `$j$${JSON.stringify(v)}$j$::jsonb`;
const add = (col: string, value: string | undefined) => (value ? `${col} = ${col} || jsonb_build_object('${code}', ${`$s$${value}$s$`})` : null);
const out: string[] = [];

const SERVICE_KEYS = ['product', 'tour', 'interior', 'design', 'walk', 'bim', 'render', 'draft'];
SERVICE_KEYS.forEach((k, i) => {
  const it = t.services.items[i];
  out.push(`update public.services set ${[add('title', it.title), add('body', it.body), add('note', t.services.notes[i])].filter(Boolean).join(', ')} where key = '${k}';`);
});

for (const [slug, p] of Object.entries(t.projects)) {
  const sets = [add('label', p.label), add('location', p.location), add('description', p.description.join('\n\n')), p.title ? add('title', p.title) : null].filter(Boolean);
  out.push(`update public.projects set ${sets.join(', ')} where slug = '${slug}';`);
  // Image descriptions, in gallery order.
  out.push(`update public.media m set alt = m.alt || jsonb_build_object('${code}', ${q(p.alts)} ->> (x.rn - 1)::int) from (select pm.media_id, row_number() over (order by pm.sort) as rn from public.project_media pm join public.projects pr on pr.id = pm.project_id where pr.slug = '${slug}') x where m.id = x.media_id and (${q(p.alts)} ->> (x.rn - 1)::int) is not null;`);
}

out.push(`update public.categories set ${add('name', t.work.filters.exterior)} where slug = 'exterior';`);
out.push(`update public.categories set ${add('name', t.work.filters.interior)} where slug = 'interior';`);
for (const [slug, key] of [['home', 'home'], ['work', 'work'], ['services', 'services'], ['studio', 'studio'], ['contact', 'contact']] as const) {
  out.push(`update public.pages set ${add('title', t.nav[key])} where slug = '${slug}' and kind = 'system';`);
}
console.log(out.join('\n'));
