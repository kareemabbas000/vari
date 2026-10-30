-- VARI Studio — website forms (contact enquiries, newsletter with double opt-in).
--
-- Security model
--   * Row Level Security is enabled on every table and there are NO policies:
--     the anon / authenticated roles (browser keys) can neither read nor write.
--   * The website writes only through the functions below, which are executable
--     by service_role alone (used server-side by the Next.js API routes).
--   * Functions validate and normalise every field and throttle abuse, so the
--     database stays consistent even if a caller misbehaves.

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
create type public.enquiry_intent as enum ('design', 'visualize', 'general');
create type public.site_locale as enum ('en', 'de', 'es');
create type public.enquiry_status as enum ('new', 'read', 'replied', 'archived', 'spam');
create type public.subscriber_status as enum ('pending', 'confirmed', 'unsubscribed');

-- ---------------------------------------------------------------------------
-- Contact enquiries
-- ---------------------------------------------------------------------------
create table public.contact_submissions (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  first_name   text check (char_length(first_name) <= 100),
  last_name    text check (char_length(last_name) <= 100),
  email        text not null check (char_length(email) <= 254 and email ~ '^[^@\s]+@[^@\s]+\.[a-z]{2,63}$'),
  message      text check (char_length(message) <= 5000),
  intent       public.enquiry_intent not null default 'general',
  locale       public.site_locale not null default 'en',
  source_path  text check (char_length(source_path) <= 300),
  ip_hash      text check (char_length(ip_hash) <= 128),
  user_agent   text check (char_length(user_agent) <= 400),
  status       public.enquiry_status not null default 'new',
  notified_at  timestamptz
);

comment on table public.contact_submissions is 'Enquiries from the website contact forms. Written only via public.submit_contact (service_role).';
comment on column public.contact_submissions.ip_hash is 'Salted SHA-256 of the sender IP, used only for abuse throttling — never the raw IP.';

create index contact_submissions_created_at_idx on public.contact_submissions (created_at desc);
create index contact_submissions_email_created_idx on public.contact_submissions (email, created_at desc);
create index contact_submissions_ip_created_idx on public.contact_submissions (ip_hash, created_at desc) where ip_hash is not null;
create index contact_submissions_status_idx on public.contact_submissions (status) where status = 'new';

-- ---------------------------------------------------------------------------
-- Newsletter (double opt-in)
-- ---------------------------------------------------------------------------
create table public.newsletter_subscribers (
  id                 uuid primary key default gen_random_uuid(),
  email              text not null check (char_length(email) <= 254 and email ~ '^[^@\s]+@[^@\s]+\.[a-z]{2,63}$'),
  locale             public.site_locale not null default 'en',
  status             public.subscriber_status not null default 'pending',
  confirm_token      uuid not null default gen_random_uuid(),
  unsubscribe_token  uuid not null default gen_random_uuid(),
  ip_hash            text check (char_length(ip_hash) <= 128),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  last_requested_at  timestamptz not null default now(),
  confirmed_at       timestamptz,
  unsubscribed_at    timestamptz
);

comment on table public.newsletter_subscribers is 'Newsletter sign-ups with double opt-in. Managed only via the newsletter functions (service_role).';

create unique index newsletter_subscribers_email_key on public.newsletter_subscribers (email);
create unique index newsletter_subscribers_confirm_token_key on public.newsletter_subscribers (confirm_token);
create unique index newsletter_subscribers_unsubscribe_token_key on public.newsletter_subscribers (unsubscribe_token);
create index newsletter_subscribers_ip_created_idx on public.newsletter_subscribers (ip_hash, created_at desc) where ip_hash is not null;

-- ---------------------------------------------------------------------------
-- Lock the tables down
-- ---------------------------------------------------------------------------
alter table public.contact_submissions enable row level security;
alter table public.newsletter_subscribers enable row level security;

revoke all on table public.contact_submissions from anon, authenticated;
revoke all on table public.newsletter_subscribers from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Functions (service_role only)
-- ---------------------------------------------------------------------------

-- Store a contact enquiry. Raises 'invalid_email' or 'rate_limited'.
create or replace function public.submit_contact(
  p_email        text,
  p_first_name   text default null,
  p_last_name    text default null,
  p_message      text default null,
  p_intent       text default null,
  p_locale       text default 'en',
  p_source_path  text default null,
  p_ip_hash      text default null,
  p_user_agent   text default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_email text := lower(btrim(p_email));
  v_id    uuid;
begin
  if v_email is null or char_length(v_email) > 254 or v_email !~ '^[^@\s]+@[^@\s]+\.[a-z]{2,63}$' then
    raise exception 'invalid_email' using errcode = '22023';
  end if;

  -- Throttle: 3 per email per 10 minutes, 10 per sender per hour.
  if (select count(*) from public.contact_submissions c
       where c.email = v_email and c.created_at > now() - interval '10 minutes') >= 3
     or (p_ip_hash is not null and (select count(*) from public.contact_submissions c
       where c.ip_hash = p_ip_hash and c.created_at > now() - interval '1 hour') >= 10) then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  insert into public.contact_submissions
    (email, first_name, last_name, message, intent, locale, source_path, ip_hash, user_agent)
  values (
    v_email,
    nullif(left(btrim(p_first_name), 100), ''),
    nullif(left(btrim(p_last_name), 100), ''),
    nullif(left(btrim(p_message), 5000), ''),
    case when p_intent in ('design', 'visualize') then p_intent::public.enquiry_intent else 'general'::public.enquiry_intent end,
    case when p_locale in ('en', 'de', 'es') then p_locale::public.site_locale else 'en'::public.site_locale end,
    left(p_source_path, 300),
    left(p_ip_hash, 128),
    left(p_user_agent, 400)
  )
  returning id into v_id;

  return v_id;
end;
$$;

-- Record that the studio notification email went out.
create or replace function public.mark_contact_notified(p_id uuid)
returns void
language sql
security invoker
set search_path = ''
as $$
  update public.contact_submissions set notified_at = now() where id = p_id and notified_at is null;
$$;

-- Start (or restart) a newsletter sign-up. Returns the tokens needed to email the
-- confirmation link. Raises 'invalid_email' or 'rate_limited'.
create or replace function public.subscribe_newsletter(
  p_email   text,
  p_locale  text default 'en',
  p_ip_hash text default null
)
returns table (status text, confirm_token uuid, unsubscribe_token uuid, created boolean)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_email  text := lower(btrim(p_email));
  v_locale public.site_locale := case when p_locale in ('en', 'de', 'es') then p_locale::public.site_locale else 'en'::public.site_locale end;
  r        public.newsletter_subscribers;
begin
  if v_email is null or char_length(v_email) > 254 or v_email !~ '^[^@\s]+@[^@\s]+\.[a-z]{2,63}$' then
    raise exception 'invalid_email' using errcode = '22023';
  end if;

  select * into r from public.newsletter_subscribers s where s.email = v_email for update;

  if not found then
    if p_ip_hash is not null and (select count(*) from public.newsletter_subscribers s
         where s.ip_hash = p_ip_hash and s.created_at > now() - interval '1 hour') >= 10 then
      raise exception 'rate_limited' using errcode = 'P0001';
    end if;
    insert into public.newsletter_subscribers (email, locale, ip_hash)
    values (v_email, v_locale, left(p_ip_hash, 128))
    returning * into r;
    return query select r.status::text, r.confirm_token, r.unsubscribe_token, true;
    return;
  end if;

  if r.status = 'confirmed' then
    -- Already subscribed: nothing to confirm, never re-issue tokens.
    return query select r.status::text, null::uuid, null::uuid, false;
    return;
  end if;

  -- Pending or unsubscribed: re-issue a fresh confirmation, at most every 2 minutes
  -- (stops anyone from flooding an inbox with confirmation emails).
  if r.last_requested_at > now() - interval '2 minutes' then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  update public.newsletter_subscribers s
     set status = 'pending',
         locale = v_locale,
         confirm_token = gen_random_uuid(),
         last_requested_at = now(),
         updated_at = now(),
         unsubscribed_at = null
   where s.id = r.id
  returning * into r;

  return query select r.status::text, r.confirm_token, r.unsubscribe_token, false;
end;
$$;

-- Confirm a sign-up from the emailed link (valid 7 days, single use).
create or replace function public.confirm_newsletter(p_token uuid)
returns table (status text, locale text)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  r public.newsletter_subscribers;
begin
  update public.newsletter_subscribers s
     set status = 'confirmed',
         confirmed_at = now(),
         updated_at = now(),
         confirm_token = gen_random_uuid()  -- rotate: the link works once
   where s.confirm_token = p_token
     and s.status = 'pending'
     and s.last_requested_at > now() - interval '7 days'
  returning * into r;

  if not found then
    return query select 'invalid'::text, null::text;
    return;
  end if;
  return query select r.status::text, r.locale::text;
end;
$$;

-- Unsubscribe from the link in any newsletter email.
create or replace function public.unsubscribe_newsletter(p_token uuid)
returns table (status text, locale text)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  r public.newsletter_subscribers;
begin
  update public.newsletter_subscribers s
     set status = 'unsubscribed',
         unsubscribed_at = coalesce(s.unsubscribed_at, now()),
         updated_at = now()
   where s.unsubscribe_token = p_token
  returning * into r;

  if not found then
    return query select 'invalid'::text, null::text;
    return;
  end if;
  return query select r.status::text, r.locale::text;
end;
$$;

-- Only the server (service_role) may call these.
revoke all on function public.submit_contact(text, text, text, text, text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.mark_contact_notified(uuid) from public, anon, authenticated;
revoke all on function public.subscribe_newsletter(text, text, text) from public, anon, authenticated;
revoke all on function public.confirm_newsletter(uuid) from public, anon, authenticated;
revoke all on function public.unsubscribe_newsletter(uuid) from public, anon, authenticated;

grant execute on function public.submit_contact(text, text, text, text, text, text, text, text, text) to service_role;
grant execute on function public.mark_contact_notified(uuid) to service_role;
grant execute on function public.subscribe_newsletter(text, text, text) to service_role;
grant execute on function public.confirm_newsletter(uuid) to service_role;
grant execute on function public.unsubscribe_newsletter(uuid) to service_role;
