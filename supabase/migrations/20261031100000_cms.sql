-- VARI Studio CMS — team, roles, activity log, content model, media storage.
--
-- Roles (ordered): viewer < editor < admin < owner
--   viewer  read the panel (inbox, content, subscribers)
--   editor  + edit all content, media and enquiry statuses
--   admin   + site settings, delete enquiries/subscribers, manage editors & viewers
--   owner   + manage admins; the last owner can never be removed or demoted
--
-- Profiles are created only by the server (invitations), never by self sign-up, so an
-- account without an invitation has no access at all. Deleting a user in the panel
-- deletes the auth user; everything personal cascades or is scrubbed.
--
-- Public site: published content is readable with the publishable key (RLS); every
-- write requires a signed-in team member with a sufficient role.

-- ---------------------------------------------------------------------------
-- Roles & profiles
-- ---------------------------------------------------------------------------
create type public.app_role as enum ('viewer', 'editor', 'admin', 'owner');

create table public.profiles (
  id               uuid primary key references auth.users (id) on delete cascade,
  email            text not null,
  full_name        text check (char_length(full_name) <= 120),
  role             public.app_role not null default 'viewer',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  last_seen_at     timestamptz
);
create unique index profiles_email_key on public.profiles (lower(email));

-- Role checks used by every policy (security definer: reads profiles regardless of RLS).
create or replace function public.my_role()
returns public.app_role
language sql stable security definer set search_path = ''
as $$ select p.role from public.profiles p where p.id = (select auth.uid()) $$;

create or replace function public.has_role(min_role public.app_role)
returns boolean
language sql stable security definer set search_path = ''
as $$ select coalesce((select p.role >= min_role from public.profiles p where p.id = (select auth.uid())), false) $$;

revoke all on function public.my_role() from public;
revoke all on function public.has_role(public.app_role) from public;
grant execute on function public.my_role() to anon, authenticated, service_role;
grant execute on function public.has_role(public.app_role) to anon, authenticated, service_role;

-- Guard rails on profiles, whoever the caller is:
--   * role and email change only through the server (service_role)
--   * the last owner can never be demoted or deleted
create or replace function public.profiles_guard()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    if (new.role is distinct from old.role or new.email is distinct from old.email)
       and current_user not in ('service_role', 'postgres', 'supabase_admin') then
      raise exception 'role_change_not_allowed' using errcode = '42501';
    end if;
    if old.role = 'owner' and new.role <> 'owner'
       and (select count(*) from public.profiles where role = 'owner') <= 1 then
      raise exception 'last_owner' using errcode = 'P0001';
    end if;
    new.updated_at := now();
    return new;
  end if;

  if tg_op = 'DELETE' then
    if old.role = 'owner' and (select count(*) from public.profiles where role = 'owner') <= 1 then
      raise exception 'last_owner' using errcode = 'P0001';
    end if;
    -- Erase the person from the activity log as well (keep the anonymous record of changes).
    update public.audit_log set actor_email = null where actor = old.id;
    return old;
  end if;
  return null;
end;
$$;

-- ---------------------------------------------------------------------------
-- Activity log
-- ---------------------------------------------------------------------------
create table public.audit_log (
  id           bigint generated always as identity primary key,
  at           timestamptz not null default now(),
  actor        uuid references public.profiles (id) on delete set null,
  actor_email  text,
  action       text not null,
  entity       text not null,
  entity_id    text,
  summary      text check (char_length(summary) <= 300)
);
create index audit_log_at_idx on public.audit_log (at desc);
create index audit_log_actor_idx on public.audit_log (actor);

create trigger profiles_guard
  before update or delete on public.profiles
  for each row execute function public.profiles_guard();

-- Generic row-change logger for content tables (records who changed what, never values).
create or replace function public.audit_row()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  rec   jsonb := to_jsonb(coalesce(new, old));
  uid   uuid := (select auth.uid());
begin
  if uid is null then
    return coalesce(new, old);  -- server-side maintenance is logged explicitly by the server
  end if;
  insert into public.audit_log (actor, actor_email, action, entity, entity_id, summary)
  values (
    uid,
    (select p.email from public.profiles p where p.id = uid),
    lower(tg_op),
    tg_table_name,
    coalesce(rec ->> 'id', rec ->> 'key', rec ->> 'slug'),
    left(coalesce(rec -> 'title' ->> 'en', rec -> 'name' ->> 'en', rec ->> 'slug', rec ->> 'key', rec ->> 'email', ''), 300)
  );
  return coalesce(new, old);
end;
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Content model (all translatable fields are jsonb: {"en": …, "de": …, "es": …})
-- ---------------------------------------------------------------------------
create table public.site_settings (
  id          int primary key default 1 check (id = 1),
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references public.profiles (id) on delete set null
);
comment on table public.site_settings is 'Single row: brand, contact details, social links, SEO defaults, home section order/visibility, intro options.';

create table public.categories (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name         jsonb not null,
  description  jsonb not null default '{}'::jsonb,
  sort         int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  updated_by   uuid references public.profiles (id) on delete set null
);

create table public.media (
  id          uuid primary key default gen_random_uuid(),
  source      text not null check (source in ('storage', 'wix')),
  path        text not null check (char_length(path) <= 400),
  width       int check (width > 0),
  height      int check (height > 0),
  alt         jsonb not null default '{}'::jsonb,
  file_name   text,
  created_at  timestamptz not null default now(),
  created_by  uuid references public.profiles (id) on delete set null
);
create unique index media_source_path_key on public.media (source, path);

create table public.projects (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  category_id  uuid not null references public.categories (id) on delete restrict,
  title        jsonb not null,
  label        jsonb not null default '{}'::jsonb,
  location     jsonb not null default '{}'::jsonb,
  client       text check (char_length(client) <= 200),
  description  jsonb not null default '{}'::jsonb,
  seo          jsonb not null default '{}'::jsonb,
  featured     boolean not null default false,
  published    boolean not null default true,
  sort         int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  updated_by   uuid references public.profiles (id) on delete set null
);
create index projects_category_idx on public.projects (category_id);
create index projects_sort_idx on public.projects (sort);

create table public.project_media (
  project_id  uuid not null references public.projects (id) on delete cascade,
  media_id    uuid not null references public.media (id) on delete cascade,
  sort        int not null default 0,
  primary key (project_id, media_id)
);
create index project_media_media_idx on public.project_media (media_id);

create table public.services (
  id          uuid primary key default gen_random_uuid(),
  key         text not null unique check (key ~ '^[a-z0-9-]+$'),
  title       jsonb not null,
  body        jsonb not null default '{}'::jsonb,
  note        jsonb not null default '{}'::jsonb,
  sort        int not null default 0,
  visible     boolean not null default true,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references public.profiles (id) on delete set null
);

-- Every other text on the site, by dictionary section: {"en": {...}, "de": {...}, "es": {...}}.
-- The panel builds its editor from the site's English dictionary, so new sections appear automatically.
create table public.content_blocks (
  key         text primary key check (key ~ '^[a-zA-Z][a-zA-Z0-9_]*$'),
  value       jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references public.profiles (id) on delete set null
);

-- updated_at + activity log on every content table
create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
create trigger site_settings_updated before update on public.site_settings for each row execute function public.set_updated_at();
create trigger categories_updated before update on public.categories for each row execute function public.set_updated_at();
create trigger projects_updated before update on public.projects for each row execute function public.set_updated_at();
create trigger services_updated before update on public.services for each row execute function public.set_updated_at();
create trigger content_blocks_updated before update on public.content_blocks for each row execute function public.set_updated_at();

create trigger site_settings_audit after insert or update or delete on public.site_settings for each row execute function public.audit_row();
create trigger categories_audit after insert or update or delete on public.categories for each row execute function public.audit_row();
create trigger media_audit after insert or update or delete on public.media for each row execute function public.audit_row();
create trigger projects_audit after insert or update or delete on public.projects for each row execute function public.audit_row();
create trigger services_audit after insert or update or delete on public.services for each row execute function public.audit_row();
create trigger content_blocks_audit after insert or update or delete on public.content_blocks for each row execute function public.audit_row();

-- ---------------------------------------------------------------------------
-- Inbox additions (enquiries handled in the panel)
-- ---------------------------------------------------------------------------
alter table public.contact_submissions
  add column notes text check (char_length(notes) <= 4000),
  add column handled_by uuid references public.profiles (id) on delete set null,
  add column updated_at timestamptz not null default now();
create trigger contact_submissions_updated before update on public.contact_submissions for each row execute function public.set_updated_at();
create trigger contact_submissions_audit after update or delete on public.contact_submissions for each row execute function public.audit_row();
create trigger newsletter_subscribers_audit after delete on public.newsletter_subscribers for each row execute function public.audit_row();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.audit_log enable row level security;
alter table public.site_settings enable row level security;
alter table public.categories enable row level security;
alter table public.media enable row level security;
alter table public.projects enable row level security;
alter table public.project_media enable row level security;
alter table public.services enable row level security;
alter table public.content_blocks enable row level security;

-- profiles: everyone on the team sees the team; you may edit your own name only.
create policy "team can read profiles" on public.profiles for select to authenticated using ((select public.has_role('viewer')));
create policy "edit own profile" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- activity log: admins and owners
create policy "admins read activity" on public.audit_log for select to authenticated using ((select public.has_role('admin')));

-- public content: readable by everyone (published only where relevant)
create policy "public read settings" on public.site_settings for select to anon, authenticated using (true);
create policy "public read categories" on public.categories for select to anon, authenticated using (true);
create policy "public read media" on public.media for select to anon, authenticated using (true);
create policy "public read published projects" on public.projects for select to anon, authenticated using (published or (select public.has_role('viewer')));
create policy "public read project media" on public.project_media for select to anon, authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and (p.published or (select public.has_role('viewer')))));
create policy "public read visible services" on public.services for select to anon, authenticated using (visible or (select public.has_role('viewer')));
create policy "public read content" on public.content_blocks for select to anon, authenticated using (true);

-- editors write content
create policy "editors write categories" on public.categories for all to authenticated using ((select public.has_role('editor'))) with check ((select public.has_role('editor')));
create policy "editors write media" on public.media for all to authenticated using ((select public.has_role('editor'))) with check ((select public.has_role('editor')));
create policy "editors write projects" on public.projects for all to authenticated using ((select public.has_role('editor'))) with check ((select public.has_role('editor')));
create policy "editors write project media" on public.project_media for all to authenticated using ((select public.has_role('editor'))) with check ((select public.has_role('editor')));
create policy "editors write services" on public.services for all to authenticated using ((select public.has_role('editor'))) with check ((select public.has_role('editor')));
create policy "editors write content" on public.content_blocks for all to authenticated using ((select public.has_role('editor'))) with check ((select public.has_role('editor')));

-- admins write settings
create policy "admins write settings" on public.site_settings for update to authenticated using ((select public.has_role('admin'))) with check ((select public.has_role('admin')));

-- inbox: team reads, editors update, admins delete
grant select, update, delete on public.contact_submissions to authenticated;
grant select, delete on public.newsletter_subscribers to authenticated;
create policy "team reads enquiries" on public.contact_submissions for select to authenticated using ((select public.has_role('viewer')));
create policy "editors update enquiries" on public.contact_submissions for update to authenticated using ((select public.has_role('editor'))) with check ((select public.has_role('editor')));
create policy "admins delete enquiries" on public.contact_submissions for delete to authenticated using ((select public.has_role('admin')));
create policy "team reads subscribers" on public.newsletter_subscribers for select to authenticated using ((select public.has_role('viewer')));
create policy "admins delete subscribers" on public.newsletter_subscribers for delete to authenticated using ((select public.has_role('admin')));

-- ---------------------------------------------------------------------------
-- Media storage: public read, editors upload/replace/delete
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 15728640, array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml'])
on conflict (id) do nothing;

create policy "editors upload media" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (select public.has_role('editor')));
create policy "editors update media" on storage.objects for update to authenticated
  using (bucket_id = 'media' and (select public.has_role('editor')));
create policy "editors delete media" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (select public.has_role('editor')));
create policy "team lists media" on storage.objects for select to authenticated
  using (bucket_id = 'media' and (select public.has_role('viewer')));

insert into public.site_settings (id, data) values (1, '{}'::jsonb) on conflict (id) do nothing;
