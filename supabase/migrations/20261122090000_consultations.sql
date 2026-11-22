-- Free consultation calls: requests sent from the "free 30-minute project call" offer on the
-- website (articles and blog), handled in the control panel under Inbox → Free consultation calls.
--
-- Same security model as the contact form:
--   * Row Level Security on, nothing for anon: the browser can neither read nor write.
--   * The website writes only through submit_consultation(), executable by service_role
--     alone (the /api/consultation route). It validates every field and throttles abuse.
--   * The team reads (viewer), updates (editor) and deletes (admin) in the panel.
-- Cheap by design: one insert per request, an index for the panel's list and the throttle.
-- Safe to run more than once.

create table if not exists public.consultation_requests (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  name            text not null check (char_length(name) between 1 and 120),
  email           text not null check (char_length(email) <= 254 and email ~ '^[^@\s]+@[^@\s]+\.[a-zA-Z]{2,63}$'),
  phone           text check (char_length(phone) <= 40),
  preferred_time  text check (char_length(preferred_time) <= 200),
  timezone        text check (char_length(timezone) <= 64),
  project_type    text not null default 'unsure' check (project_type in ('interior', 'visualization', 'architecture', 'unsure')),
  message         text check (char_length(message) <= 2000),
  locale          text not null default 'en' check (char_length(locale) <= 8),
  source_path     text check (char_length(source_path) <= 300),
  source_title    text check (char_length(source_title) <= 200),
  trigger         text check (char_length(trigger) <= 30),
  ip_hash         text check (char_length(ip_hash) <= 128),
  user_agent      text check (char_length(user_agent) <= 400),
  status          text not null default 'new' check (status in ('new', 'contacted', 'scheduled', 'done', 'no_show', 'archived', 'spam')),
  scheduled_at    timestamptz,
  notes           text check (char_length(notes) <= 4000),
  notified_at     timestamptz,
  handled_by      uuid references public.profiles (id) on delete set null
);

comment on table public.consultation_requests is 'Free 30-minute consultation call requests from the website. Written only via public.submit_consultation (service_role).';

create index if not exists consultation_requests_created_idx on public.consultation_requests (created_at desc);
create index if not exists consultation_requests_new_idx on public.consultation_requests (status) where status = 'new';
create index if not exists consultation_requests_email_created_idx on public.consultation_requests (email, created_at desc);
create index if not exists consultation_requests_ip_created_idx on public.consultation_requests (ip_hash, created_at desc) where ip_hash is not null;

drop trigger if exists consultation_requests_updated on public.consultation_requests;
create trigger consultation_requests_updated before update on public.consultation_requests for each row execute function public.set_updated_at();
drop trigger if exists consultation_requests_audit on public.consultation_requests;
create trigger consultation_requests_audit after update or delete on public.consultation_requests for each row execute function public.audit_row();

-- Lock down, then let the team in.
alter table public.consultation_requests enable row level security;
revoke all on table public.consultation_requests from anon, authenticated;
grant select, update, delete on public.consultation_requests to authenticated;

drop policy if exists "team reads consultations" on public.consultation_requests;
drop policy if exists "editors update consultations" on public.consultation_requests;
drop policy if exists "admins delete consultations" on public.consultation_requests;
create policy "team reads consultations" on public.consultation_requests for select to authenticated using ((select public.has_role('viewer')));
create policy "editors update consultations" on public.consultation_requests for update to authenticated using ((select public.has_role('editor'))) with check ((select public.has_role('editor')));
create policy "admins delete consultations" on public.consultation_requests for delete to authenticated using ((select public.has_role('admin')));

-- Store a request. Raises 'invalid_email', 'invalid_name' or 'rate_limited'.
create or replace function public.submit_consultation(
  p_name            text,
  p_email           text,
  p_phone           text default null,
  p_preferred_time  text default null,
  p_timezone        text default null,
  p_project_type    text default null,
  p_message         text default null,
  p_locale          text default 'en',
  p_source_path     text default null,
  p_source_title    text default null,
  p_trigger         text default null,
  p_ip_hash         text default null,
  p_user_agent      text default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_email text := lower(btrim(p_email));
  v_name  text := left(btrim(coalesce(p_name, '')), 120);
  v_id    uuid;
begin
  if v_email is null or char_length(v_email) > 254 or v_email !~ '^[^@\s]+@[^@\s]+\.[a-zA-Z]{2,63}$' then
    raise exception 'invalid_email' using errcode = '22023';
  end if;
  if v_name = '' then
    raise exception 'invalid_name' using errcode = '22023';
  end if;

  -- Throttle: 3 per email per 10 minutes, 6 per sender per hour.
  if (select count(*) from public.consultation_requests c
       where c.email = v_email and c.created_at > now() - interval '10 minutes') >= 3
     or (p_ip_hash is not null and (select count(*) from public.consultation_requests c
       where c.ip_hash = p_ip_hash and c.created_at > now() - interval '1 hour') >= 6) then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  insert into public.consultation_requests
    (name, email, phone, preferred_time, timezone, project_type, message, locale, source_path, source_title, trigger, ip_hash, user_agent)
  values (
    v_name,
    v_email,
    nullif(left(btrim(p_phone), 40), ''),
    nullif(left(btrim(p_preferred_time), 200), ''),
    nullif(left(btrim(p_timezone), 64), ''),
    case when p_project_type in ('interior', 'visualization', 'architecture') then p_project_type else 'unsure' end,
    nullif(left(btrim(p_message), 2000), ''),
    coalesce(nullif(left(btrim(p_locale), 8), ''), 'en'),
    left(p_source_path, 300),
    left(p_source_title, 200),
    left(p_trigger, 30),
    left(p_ip_hash, 128),
    left(p_user_agent, 400)
  )
  returning id into v_id;

  return v_id;
end;
$$;

-- Record that the studio notification email went out.
create or replace function public.mark_consultation_notified(p_id uuid)
returns void
language sql
security invoker
set search_path = ''
as $$
  update public.consultation_requests set notified_at = now() where id = p_id;
$$;

revoke all on function public.submit_consultation(text, text, text, text, text, text, text, text, text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.mark_consultation_notified(uuid) from public, anon, authenticated;
grant execute on function public.submit_consultation(text, text, text, text, text, text, text, text, text, text, text, text, text) to service_role;
grant execute on function public.mark_consultation_notified(uuid) to service_role;

-- Retention, as for contact enquiries: requests are deleted 24 months after they arrived.
create or replace function public.purge_expired_consultations()
returns void
language sql
security invoker
set search_path = ''
as $$
  delete from public.consultation_requests where created_at < now() - interval '24 months';
$$;
revoke all on function public.purge_expired_consultations() from public, anon, authenticated;
grant execute on function public.purge_expired_consultations() to service_role;

select cron.unschedule('vari-purge-consultations') where exists (select 1 from cron.job where jobname = 'vari-purge-consultations');
select cron.schedule('vari-purge-consultations', '23 3 * * *', $$select public.purge_expired_consultations()$$);
