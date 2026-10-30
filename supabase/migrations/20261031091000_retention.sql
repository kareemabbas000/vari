-- Data retention for the website forms, as stated in the privacy notice:
--   * contact enquiries are deleted 24 months after they were received
--   * newsletter sign-ups never confirmed are deleted after 30 days
--   * unsubscribed addresses are deleted 30 days after unsubscribing
-- Runs nightly via pg_cron.

create extension if not exists pg_cron with schema pg_catalog;

create or replace function public.purge_expired_form_data()
returns void
language sql
security invoker
set search_path = ''
as $$
  delete from public.contact_submissions where created_at < now() - interval '24 months';
  delete from public.newsletter_subscribers where status = 'pending' and last_requested_at < now() - interval '30 days';
  delete from public.newsletter_subscribers where status = 'unsubscribed' and unsubscribed_at < now() - interval '30 days';
$$;

revoke all on function public.purge_expired_form_data() from public, anon, authenticated;
grant execute on function public.purge_expired_form_data() to service_role;

select cron.schedule('vari-purge-expired-form-data', '17 3 * * *', $$select public.purge_expired_form_data()$$);
