-- Fix: profiles_guard ran as SECURITY DEFINER, so current_user was always the owner and
-- the "role/email only via the server" rule never fired (a viewer could promote itself).
-- Decide from the request's JWT role instead: browser sessions carry 'authenticated' or
-- 'anon'; the server's secret key carries 'service_role'; SQL maintenance has no JWT.
create or replace function public.profiles_guard()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  jwt_role text := coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', '');
begin
  if tg_op = 'UPDATE' then
    if (new.role is distinct from old.role or new.email is distinct from old.email)
       and jwt_role in ('authenticated', 'anon') then
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
    update public.audit_log set actor_email = null where actor = old.id;
    return old;
  end if;
  return null;
end;
$$;
