-- Website cache hook (run once in the Supabase SQL editor).
--
-- The website is cached on Vercel until something is published, which keeps it inside the free
-- plans. Publishing in the control panel refreshes it. This hook covers the two other cases:
--   1. content changed outside the panel (SQL run here, e.g. the article publish scripts);
--   2. a scheduled article reaching its publish time.
--
-- How it works, and why it costs almost nothing:
--   * Triggers only write a one-row "dirty" flag per area (blog, pages, languages, all).
--     Saving a draft article does not count: only published posts and ready translations do.
--   * A pg_cron job runs every 2 minutes. When nothing is dirty and no article went live, it
--     does no network call at all. Otherwise it calls the website once per area.
--   * The call carries a random secret that only this database and Vercel know.
--
-- After running this script:
--   1. Copy the secret shown at the end.
--   2. In Vercel: Project, Settings, Environment Variables: add REVALIDATE_SECRET with that value
--      (Production), then redeploy.
-- Safe to re-run: it keeps the existing secret.

create extension if not exists pg_net;
create extension if not exists pg_cron;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.cache_hook (
  id       int primary key default 1 check (id = 1),
  url      text not null,
  secret   text not null,
  last_run timestamptz not null default now()
);
create table if not exists private.cache_dirty (
  scope text primary key check (scope in ('blog', 'pages', 'languages', 'all')),
  since timestamptz not null default now()
);

insert into private.cache_hook (url, secret)
values ('https://www.vari-studio.com/api/revalidate-hook', encode(extensions.gen_random_bytes(24), 'hex'))
on conflict (id) do nothing;

-- Mark an area as changed. Drafts are ignored, so editing a draft never rebuilds the website.
create or replace function private.mark_cache_dirty() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  relevant boolean := true;
begin
  if tg_table_name = 'blog_posts' then
    relevant := coalesce((to_jsonb(new) ->> 'status') = 'published', false) or coalesce((to_jsonb(old) ->> 'status') = 'published', false);
  elsif tg_table_name = 'blog_post_translations' then
    relevant := coalesce((to_jsonb(new) ->> 'ready')::boolean, false) or coalesce((to_jsonb(old) ->> 'ready')::boolean, false);
  end if;
  if relevant then
    insert into private.cache_dirty (scope) values (tg_argv[0]) on conflict (scope) do nothing;
  end if;
  return null;
end $$;

do $$
declare
  t record;
begin
  for t in
    select * from (values
      ('blog_posts', 'blog'), ('blog_post_translations', 'blog'), ('blog_categories', 'blog'), ('blog_authors', 'blog'),
      ('blog_tags', 'blog'), ('blog_post_tags', 'blog'),
      ('pages', 'pages'),
      ('languages', 'languages'),
      ('site_settings', 'all'), ('projects', 'all'), ('project_media', 'all'), ('services', 'all'),
      ('content_blocks', 'all'), ('categories', 'all'), ('media', 'all')
    ) as v(tbl, scope)
  loop
    if to_regclass('public.' || t.tbl) is not null then
      execute format('drop trigger if exists cache_dirty on public.%I', t.tbl);
      execute format('create trigger cache_dirty after insert or update or delete on public.%I for each row execute function private.mark_cache_dirty(%L)', t.tbl, t.scope);
    end if;
  end loop;
end $$;

-- Every 2 minutes: add the blog if a scheduled article went live, then call the website once
-- per changed area. No call at all when nothing changed.
create or replace function private.flush_cache() returns void
language plpgsql security definer set search_path = '' as $$
declare
  h private.cache_hook;
  d record;
begin
  select * into h from private.cache_hook where id = 1;
  if h is null then return; end if;
  if exists (select 1 from public.blog_posts where status = 'published' and publish_at > h.last_run and publish_at <= now()) then
    insert into private.cache_dirty (scope) values ('blog') on conflict (scope) do nothing;
  end if;
  update private.cache_hook set last_run = now() where id = 1;
  for d in delete from private.cache_dirty returning scope loop
    perform net.http_post(
      url := h.url,
      body := jsonb_build_object('scope', d.scope),
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-revalidate-secret', h.secret),
      timeout_milliseconds := 10000
    );
  end loop;
end $$;

select cron.unschedule('vari-cache-refresh') where exists (select 1 from cron.job where jobname = 'vari-cache-refresh');
select cron.schedule('vari-cache-refresh', '*/2 * * * *', 'select private.flush_cache()');

-- Copy this value into Vercel as REVALIDATE_SECRET:
select secret as revalidate_secret from private.cache_hook where id = 1;
