-- Blog: posts with per-language translations (own slug, SEO and content per language),
-- categories, tags and public author profiles. Scheduling: a post is public once its
-- status is 'published' and publish_at has passed — no job needed.

create table public.blog_authors (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name        text not null check (char_length(name) between 1 and 120),
  role        jsonb not null default '{}'::jsonb,
  bio         jsonb not null default '{}'::jsonb,
  avatar      text,
  links       jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.blog_categories (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name         jsonb not null default '{}'::jsonb,
  description  jsonb not null default '{}'::jsonb,
  sort         int not null default 100,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.blog_tags (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create table public.blog_posts (
  id           uuid primary key default gen_random_uuid(),
  status       text not null default 'draft' check (status in ('draft', 'published')),
  publish_at   timestamptz,
  category_id  uuid references public.blog_categories (id) on delete set null,
  author_id    uuid references public.blog_authors (id) on delete set null,
  cover        text,
  cover_alt    jsonb not null default '{}'::jsonb,
  featured     boolean not null default false,
  faq          jsonb not null default '[]'::jsonb check (jsonb_typeof(faq) = 'array'),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  updated_by   uuid references public.profiles (id) on delete set null
);
create index blog_posts_public_idx on public.blog_posts (status, publish_at desc);

-- One row per language. `ready` = translated and allowed on the site in that language.
-- source_hash = fingerprint of the English text this translation was made from, so the
-- panel can flag translations whose English original changed afterwards.
create table public.blog_post_translations (
  post_id          uuid not null references public.blog_posts (id) on delete cascade,
  locale           public.site_locale not null,
  slug             text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 120),
  title            text not null default '' check (char_length(title) <= 200),
  excerpt          text not null default '' check (char_length(excerpt) <= 600),
  content          jsonb,
  html             text not null default '',
  takeaways        jsonb not null default '[]'::jsonb,
  seo_title        text not null default '' check (char_length(seo_title) <= 120),
  seo_description  text not null default '' check (char_length(seo_description) <= 320),
  focus_keyword    text not null default '' check (char_length(focus_keyword) <= 120),
  ready            boolean not null default false,
  source_hash      text,
  word_count       int not null default 0,
  updated_at       timestamptz not null default now(),
  primary key (post_id, locale),
  unique (locale, slug)
);

create table public.blog_post_tags (
  post_id  uuid not null references public.blog_posts (id) on delete cascade,
  tag_id   uuid not null references public.blog_tags (id) on delete cascade,
  primary key (post_id, tag_id)
);

create trigger blog_authors_updated before update on public.blog_authors for each row execute function public.set_updated_at();
create trigger blog_categories_updated before update on public.blog_categories for each row execute function public.set_updated_at();
create trigger blog_posts_updated before update on public.blog_posts for each row execute function public.set_updated_at();
create trigger blog_post_translations_updated before update on public.blog_post_translations for each row execute function public.set_updated_at();
create trigger blog_posts_audit after insert or update or delete on public.blog_posts for each row execute function public.audit_row();
create trigger blog_categories_audit after insert or update or delete on public.blog_categories for each row execute function public.audit_row();
create trigger blog_authors_audit after insert or update or delete on public.blog_authors for each row execute function public.audit_row();

alter table public.blog_authors enable row level security;
alter table public.blog_categories enable row level security;
alter table public.blog_tags enable row level security;
alter table public.blog_posts enable row level security;
alter table public.blog_post_translations enable row level security;
alter table public.blog_post_tags enable row level security;

-- Is this post visible to the public right now?
create or replace function public.blog_post_is_live(p_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.blog_posts p where p.id = p_id and p.status = 'published' and p.publish_at is not null and p.publish_at <= now());
$$;
revoke all on function public.blog_post_is_live(uuid) from public;
grant execute on function public.blog_post_is_live(uuid) to anon, authenticated;

create policy "public read authors" on public.blog_authors for select to anon, authenticated using (true);
create policy "public read blog categories" on public.blog_categories for select to anon, authenticated using (true);
create policy "public read tags" on public.blog_tags for select to anon, authenticated using (true);
create policy "public read live posts" on public.blog_posts for select to anon, authenticated
  using ((status = 'published' and publish_at is not null and publish_at <= now()) or (select public.has_role('viewer')));
create policy "public read ready translations" on public.blog_post_translations for select to anon, authenticated
  using ((ready and public.blog_post_is_live(post_id)) or (select public.has_role('viewer')));
create policy "public read post tags" on public.blog_post_tags for select to anon, authenticated
  using (public.blog_post_is_live(post_id) or (select public.has_role('viewer')));

create policy "editors write authors" on public.blog_authors for all to authenticated using ((select public.has_role('editor'))) with check ((select public.has_role('editor')));
create policy "editors write blog categories" on public.blog_categories for all to authenticated using ((select public.has_role('editor'))) with check ((select public.has_role('editor')));
create policy "editors write tags" on public.blog_tags for all to authenticated using ((select public.has_role('editor'))) with check ((select public.has_role('editor')));
create policy "editors write posts" on public.blog_posts for all to authenticated using ((select public.has_role('editor'))) with check ((select public.has_role('editor')));
create policy "editors write translations" on public.blog_post_translations for all to authenticated using ((select public.has_role('editor'))) with check ((select public.has_role('editor')));
create policy "editors write post tags" on public.blog_post_tags for all to authenticated using ((select public.has_role('editor'))) with check ((select public.has_role('editor')));

-- Visitors never receive the editor's working copy (content JSON) — only the HTML.
revoke select on public.blog_post_translations from anon;
grant select (post_id, locale, slug, title, excerpt, html, takeaways, seo_title, seo_description, ready, word_count, updated_at) on public.blog_post_translations to anon;

insert into public.blog_categories (slug, name, description, sort) values
  ('3d-visualization', '{"en":"3D Visualization","de":"3D-Visualisierung","es":"Visualización 3D"}', '{"en":"Renderings, animations and virtual tours explained.","de":"Renderings, Animationen und virtuelle Rundgänge erklärt.","es":"Renders, animaciones y recorridos virtuales explicados."}', 10),
  ('interior-design', '{"en":"Interior Design","de":"Innenarchitektur","es":"Diseño de interiores"}', '{"en":"Ideas, materials and process for interiors.","de":"Ideen, Materialien und Prozesse für Innenräume.","es":"Ideas, materiales y procesos para interiores."}', 20),
  ('guides', '{"en":"Guides","de":"Ratgeber","es":"Guías"}', '{"en":"Practical guides for developers, architects and homeowners.","de":"Praxisratgeber für Bauträger, Architekten und Bauherren.","es":"Guías prácticas para promotores, arquitectos y propietarios."}', 30)
on conflict (slug) do nothing;

insert into public.blog_authors (slug, name, role, bio) values
  ('vari-studio', 'VARI Studio', '{"en":"Design & 3D visualization studio","de":"Design- & 3D-Visualisierungsstudio","es":"Estudio de diseño y visualización 3D"}',
   '{"en":"VARI is an architectural visualization and interior design studio creating photorealistic renderings, animations and design concepts for clients worldwide.","de":"VARI ist ein Studio für Architekturvisualisierung und Innenarchitektur. Wir erstellen fotorealistische Renderings, Animationen und Designkonzepte für Kunden weltweit.","es":"VARI es un estudio de visualización arquitectónica y diseño de interiores que crea renders fotorrealistas, animaciones y conceptos de diseño para clientes de todo el mundo."}')
on conflict (slug) do nothing;
