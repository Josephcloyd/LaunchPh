-- A record of each time a customer agreed to the policies (Terms of Service, Privacy Policy,
-- Refund Policy): when, where (sign-up or checkout), and which version. Safe to apply more than once.

create table if not exists public.policy_acceptances (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  context text not null check (context in ('signup', 'checkout')),
  policy_version text not null check (length(policy_version) between 1 and 40),
  order_id uuid references public.orders(id) on delete set null,
  accepted_at timestamptz not null default now()
);
create index if not exists policy_acceptances_user_idx on public.policy_acceptances(user_id, accepted_at desc);

alter table public.policy_acceptances enable row level security;
revoke all on public.policy_acceptances from anon, authenticated;
grant select on public.policy_acceptances to authenticated;

-- Customers can see their own records; only the server writes them.
drop policy if exists "policy acceptances owner read" on public.policy_acceptances;
create policy "policy acceptances owner read" on public.policy_acceptances
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- The sign-up form sends the policy version the customer ticked in the account's metadata;
-- record it when the account is created, using the server's clock.
create or replace function public.record_signup_policy_acceptance()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(new.raw_user_meta_data ->> 'policy_version', '') <> '' then
    insert into public.policy_acceptances (user_id, context, policy_version)
    values (new.id, 'signup', left(new.raw_user_meta_data ->> 'policy_version', 40));
  end if;
  return new;
end;
$$;

revoke all on function public.record_signup_policy_acceptance() from public, anon, authenticated;
drop trigger if exists record_signup_policy_acceptance on auth.users;
create trigger record_signup_policy_acceptance
  after insert on auth.users
  for each row execute function public.record_signup_policy_acceptance();
