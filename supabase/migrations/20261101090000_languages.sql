-- Languages become data: the panel can enable, disable, reorder and add languages, and pick
-- the default. Every column that stored a language now references this table instead of a
-- fixed enum, so adding a language never needs a schema change again.

create table public.languages (
  code          text primary key check (code ~ '^[a-z]{2,3}(-[a-z]{2,4})?$'),
  name          text not null check (char_length(name) between 1 and 60),        -- native name, e.g. "Türkçe"
  english_name  text not null check (char_length(english_name) between 1 and 60),
  og_locale     text not null check (og_locale ~ '^[a-z]{2,3}_[A-Z]{2}$'),       -- e.g. tr_TR
  hreflang      text not null check (hreflang ~ '^[a-z]{2,3}(-[A-Za-z]{2,4})?$'),
  welcome       text not null default '' check (char_length(welcome) <= 40),     -- word shown on the intro's language gate
  dir           text not null default 'ltr' check (dir in ('ltr', 'rtl')),
  enabled       boolean not null default true,
  is_default    boolean not null default false,
  sort          int not null default 100,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (not is_default or enabled)
);
comment on table public.languages is 'Website languages. Disabled languages disappear from the site; exactly one enabled default.';

insert into public.languages (code, name, english_name, og_locale, hreflang, welcome, enabled, is_default, sort) values
  ('en', 'English', 'English', 'en_US', 'en', 'Welcome', true, true, 10),
  ('de', 'Deutsch', 'German', 'de_DE', 'de', 'Willkommen', true, false, 20),
  ('es', 'Español', 'Spanish', 'es_ES', 'es', 'Bienvenidos', true, false, 30),
  ('tr', 'Türkçe', 'Turkish', 'tr_TR', 'tr', 'Hoş geldiniz', false, false, 40)
on conflict (code) do nothing;

-- Exactly one default, and at least one enabled language — checked after each statement,
-- so switching the default in a single UPDATE works.
create or replace function public.languages_guard()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  if (select count(*) from public.languages where is_default) <> 1 then
    raise exception 'Exactly one default language is required';
  end if;
  if not exists (select 1 from public.languages where enabled) then
    raise exception 'At least one language must stay enabled';
  end if;
  return null;
end;
$$;
create trigger languages_guard after insert or update or delete on public.languages for each statement execute function public.languages_guard();
create trigger languages_updated before update on public.languages for each row execute function public.set_updated_at();
create trigger languages_audit after insert or update or delete on public.languages for each row execute function public.audit_row();
revoke all on function public.languages_guard() from public, anon, authenticated;

alter table public.languages enable row level security;
create policy "public read languages" on public.languages for select to anon, authenticated using (true);
create policy "admins add languages" on public.languages for insert to authenticated with check ((select public.has_role('admin')));
create policy "admins edit languages" on public.languages for update to authenticated using ((select public.has_role('admin'))) with check ((select public.has_role('admin')));
-- Languages are disabled, never deleted (enquiries and articles keep referring to them).

-- Make one language the default (single statement, so the guard sees a consistent state).
create or replace function public.set_default_language(p_code text)
returns void
language sql security invoker set search_path = ''
as $$
  update public.languages set is_default = (code = p_code), enabled = (enabled or code = p_code);
$$;
revoke all on function public.set_default_language(text) from public, anon;
grant execute on function public.set_default_language(text) to authenticated;

-- Resolve a requested language to an enabled one (falls back to the default).
create or replace function public.resolve_locale(p text)
returns text
language sql stable security invoker set search_path = ''
as $$
  select coalesce(
    (select code from public.languages where code = lower(btrim(p)) and enabled),
    (select code from public.languages where is_default),
    'en'
  );
$$;

-- Columns: enum → text referencing languages.
alter table public.contact_submissions alter column locale drop default;
alter table public.contact_submissions alter column locale type text using locale::text;
alter table public.contact_submissions alter column locale set default 'en';
alter table public.contact_submissions add constraint contact_submissions_locale_fkey foreign key (locale) references public.languages (code) on update cascade;

alter table public.newsletter_subscribers alter column locale drop default;
alter table public.newsletter_subscribers alter column locale type text using locale::text;
alter table public.newsletter_subscribers alter column locale set default 'en';
alter table public.newsletter_subscribers add constraint newsletter_subscribers_locale_fkey foreign key (locale) references public.languages (code) on update cascade;

alter table public.blog_post_translations alter column locale type text using locale::text;
alter table public.blog_post_translations add constraint blog_post_translations_locale_fkey foreign key (locale) references public.languages (code) on update cascade;

-- Form functions: replace the hard-coded ('en', 'de', 'es') checks with resolve_locale().
do $$
declare
  d text;
begin
  d := pg_get_functiondef('public.submit_contact(text,text,text,text,text,text,text,text,text)'::regprocedure);
  d := replace(d, $r$case when p_locale in ('en', 'de', 'es') then p_locale::public.site_locale else 'en'::public.site_locale end$r$, 'public.resolve_locale(p_locale)');
  if d like '%site_locale%' then raise exception 'submit_contact still references site_locale'; end if;
  execute d;

  d := pg_get_functiondef('public.subscribe_newsletter(text,text,text)'::regprocedure);
  d := replace(d, $r$v_locale public.site_locale := case when p_locale in ('en', 'de', 'es') then p_locale::public.site_locale else 'en'::public.site_locale end;$r$, 'v_locale text := public.resolve_locale(p_locale);');
  if d like '%site_locale%' then raise exception 'subscribe_newsletter still references site_locale'; end if;
  execute d;
end;
$$;

-- The old site_locale enum is no longer used by any column or function.
