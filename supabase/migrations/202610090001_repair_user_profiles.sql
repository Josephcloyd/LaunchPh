-- Repair accounts created before the profile trigger was installed.
-- Safe to apply more than once.

insert into public.profiles (id, full_name, locale)
select
  id,
  coalesce(nullif(trim(raw_user_meta_data ->> 'full_name'), ''), split_part(email, '@', 1)),
  'en-PH'
from auth.users
on conflict (id) do nothing;

insert into public.roles (user_id, role)
select id, 'customer'
from auth.users
on conflict (user_id) do nothing;

create or replace function public.ensure_current_user_profile()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  insert into public.profiles (id, full_name, locale)
  select
    id,
    coalesce(nullif(trim(raw_user_meta_data ->> 'full_name'), ''), split_part(email, '@', 1)),
    'en-PH'
  from auth.users
  where id = current_user_id
  on conflict (id) do nothing;

  insert into public.roles (user_id, role)
  values (current_user_id, 'customer')
  on conflict (user_id) do nothing;
end;
$$;

revoke all on function public.ensure_current_user_profile() from public;
grant execute on function public.ensure_current_user_profile() to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, locale)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)),
    'en-PH'
  )
  on conflict (id) do nothing;

  insert into public.roles (user_id, role)
  values (new.id, 'customer')
  on conflict (user_id) do nothing;

  if to_regclass('public.user_preferences') is not null then
    execute 'insert into public.user_preferences (user_id, timezone) values ($1, $2) on conflict (user_id) do nothing'
      using new.id, coalesce(nullif(new.raw_user_meta_data ->> 'timezone', ''), 'Asia/Manila');
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
