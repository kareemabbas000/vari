-- Page builder, revisions and private integration keys.
--
-- pages: every page the builder manages. "system" pages are the site's built-in pages
-- (home, work, services, studio, contact); their original content is a locked "module"
-- block that can be moved, and custom blocks can be added around it. "custom" pages are
-- created in the panel and served at /{locale}/{slug}.
--
-- blocks = what the website shows; draft = unpublished edits (null when none).

create table public.pages (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique
                check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*(/[a-z0-9]+(-[a-z0-9]+)*)*$' and char_length(slug) <= 120),
  kind          text not null default 'custom' check (kind in ('custom', 'system')),
  title         jsonb not null default '{}'::jsonb,
  seo           jsonb not null default '{}'::jsonb,
  blocks        jsonb not null default '[]'::jsonb check (jsonb_typeof(blocks) = 'array'),
  draft         jsonb check (draft is null or jsonb_typeof(draft) = 'object'),
  published     boolean not null default false,
  published_at  timestamptz,
  sort          int not null default 100,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  updated_by    uuid references public.profiles (id) on delete set null
);
comment on table public.pages is 'Builder pages. blocks = live content, draft = unpublished edits {title, seo, blocks}.';

create table public.page_revisions (
  id          bigint generated always as identity primary key,
  page_id     uuid not null references public.pages (id) on delete cascade,
  title       jsonb not null default '{}'::jsonb,
  seo         jsonb not null default '{}'::jsonb,
  blocks      jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now(),
  created_by  uuid references public.profiles (id) on delete set null
);
create index page_revisions_page_idx on public.page_revisions (page_id, created_at desc);

-- Keep the 30 most recent revisions per page.
create or replace function public.trim_page_revisions()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  delete from public.page_revisions r
  where r.page_id = new.page_id
    and r.id not in (select id from public.page_revisions where page_id = new.page_id order by created_at desc, id desc limit 30);
  return new;
end;
$$;

-- Keys that must never reach the browser (e.g. the Meta Conversions API token).
create table public.integrations_private (
  id          int primary key default 1 check (id = 1),
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references public.profiles (id) on delete set null
);
insert into public.integrations_private (id) values (1) on conflict do nothing;

create trigger pages_updated before update on public.pages for each row execute function public.set_updated_at();
create trigger integrations_private_updated before update on public.integrations_private for each row execute function public.set_updated_at();
create trigger pages_audit after insert or update or delete on public.pages for each row execute function public.audit_row();
create trigger integrations_private_audit after update on public.integrations_private for each row execute function public.audit_row();
create trigger page_revisions_trim after insert on public.page_revisions for each row execute function public.trim_page_revisions();
revoke all on function public.trim_page_revisions() from public, anon, authenticated;

alter table public.pages enable row level security;
alter table public.page_revisions enable row level security;
alter table public.integrations_private enable row level security;

-- Visitors read published pages, and never the unpublished draft column.
revoke select on public.pages from anon;
grant select (id, slug, kind, title, seo, blocks, published, published_at, sort, updated_at) on public.pages to anon;
create policy "public read published pages" on public.pages for select to anon, authenticated using (published or (select public.has_role('viewer')));
create policy "editors create pages" on public.pages for insert to authenticated with check ((select public.has_role('editor')) and kind = 'custom');
create policy "editors edit pages" on public.pages for update to authenticated using ((select public.has_role('editor'))) with check ((select public.has_role('editor')));
create policy "admins delete custom pages" on public.pages for delete to authenticated using ((select public.has_role('admin')) and kind = 'custom');

create policy "team reads revisions" on public.page_revisions for select to authenticated using ((select public.has_role('viewer')));
create policy "editors add revisions" on public.page_revisions for insert to authenticated with check ((select public.has_role('editor')));

revoke all on public.integrations_private from anon;
create policy "admins read private integrations" on public.integrations_private for select to authenticated using ((select public.has_role('admin')));
create policy "admins write private integrations" on public.integrations_private for update to authenticated using ((select public.has_role('admin'))) with check ((select public.has_role('admin')));

-- A system page's kind and slug are fixed: built-in routes depend on them.
create or replace function public.pages_guard()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  if old.kind = 'system' and (new.kind <> 'system' or new.slug <> old.slug) then
    raise exception 'System pages keep their address';
  end if;
  if old.kind = 'custom' and new.kind <> 'custom' then
    raise exception 'Pages cannot become system pages';
  end if;
  return new;
end;
$$;
create trigger pages_guard before update on public.pages for each row execute function public.pages_guard();
revoke all on function public.pages_guard() from public, anon, authenticated;

-- Seed the built-in pages. Home keeps the section order chosen in the panel so far.
insert into public.pages (slug, kind, title, blocks, published, published_at, sort)
select 'home', 'system', '{"en":"Home","de":"Startseite","es":"Inicio"}'::jsonb,
       coalesce(
         (select jsonb_agg(jsonb_build_object('id', 'm-' || (s ->> 'id'), 'type', 'module', 'hidden', not coalesce((s ->> 'visible')::boolean, true), 'props', jsonb_build_object('module', s ->> 'id')) order by ord)
            from public.site_settings, jsonb_array_elements(data -> 'home' -> 'sections') with ordinality as t(s, ord)),
         (select jsonb_agg(jsonb_build_object('id', 'm-' || m, 'type', 'module', 'props', jsonb_build_object('module', m)) order by ord)
            from unnest(array['hero','welcome','exteriors','interiors','services','story','experience','contact']) with ordinality as u(m, ord))
       ),
       true, now(), 0
on conflict (slug) do nothing;

insert into public.pages (slug, kind, title, blocks, published, published_at, sort)
values
  ('work', 'system', '{"en":"Work","de":"Projekte","es":"Proyectos"}', '[{"id":"m-page","type":"module","props":{"module":"page"}}]', true, now(), 10),
  ('services', 'system', '{"en":"Services","de":"Leistungen","es":"Servicios"}', '[{"id":"m-page","type":"module","props":{"module":"page"}}]', true, now(), 20),
  ('studio', 'system', '{"en":"Studio","de":"Studio","es":"Estudio"}', '[{"id":"m-page","type":"module","props":{"module":"page"}}]', true, now(), 30),
  ('contact', 'system', '{"en":"Contact","de":"Kontakt","es":"Contacto"}', '[{"id":"m-page","type":"module","props":{"module":"page"}}]', true, now(), 40)
on conflict (slug) do nothing;
