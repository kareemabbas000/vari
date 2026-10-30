-- Trigger functions must never be callable over the API (advisor 0028/0029).
-- Triggers still fire: EXECUTE is not checked when a trigger runs.
-- has_role()/my_role() stay executable on purpose: RLS policies call them as the
-- requesting user, and they only reveal the caller's own role.
revoke all on function public.audit_row() from public, anon, authenticated;
revoke all on function public.profiles_guard() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;
