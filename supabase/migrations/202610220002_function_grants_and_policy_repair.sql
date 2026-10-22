-- Follow-up to the Phase 0 lockdown, from the Supabase Security Advisor.
-- Safe to apply more than once.

-- Signed-in only. Supabase grants execute to anon by default, so revoke from anon explicitly.
revoke all on function public.ensure_current_user_profile() from public, anon;
grant execute on function public.ensure_current_user_profile() to authenticated;
revoke all on function public.ensure_my_referral_code() from public, anon;
grant execute on function public.ensure_my_referral_code() to authenticated;

-- Trigger functions are never called through the API; triggers still fire without these grants.
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- Created by Supabase (not by these migrations) on some projects to auto-enable RLS on new tables.
do $$
begin
  if exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'rls_auto_enable' and p.pronargs = 0
      and p.prorettype = 'event_trigger'::regtype
  ) then
    revoke all on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end;
$$;

-- These read policies come from 202610080002_workspace_sessions.sql but were missing on the
-- development database. Without them, customers can't see their own subscription or add-ons.
drop policy if exists "subscriptions owner read" on public.subscriptions;
create policy "subscriptions owner read" on public.subscriptions
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "project add ons owner read" on public.project_add_ons;
create policy "project add ons owner read" on public.project_add_ons
  for select using (
    exists(select 1 from public.projects p where p.id = project_id and (p.owner_id = auth.uid() or public.is_admin()))
  );

drop policy if exists "security events owner read" on public.security_events;
create policy "security events owner read" on public.security_events
  for select using (user_id = auth.uid() or public.is_admin());
