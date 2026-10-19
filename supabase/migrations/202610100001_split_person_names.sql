-- Store person names as separate fields while retaining full_name for backwards compatibility.

alter table public.profiles
  add column if not exists first_name text,
  add column if not exists middle_name text,
  add column if not exists last_name text;

alter table public.website_inquiries
  add column if not exists first_name text,
  add column if not exists middle_name text,
  add column if not exists last_name text;

with profile_names as (
  select id, regexp_split_to_array(trim(full_name), '\s+') as parts
  from public.profiles
  where nullif(trim(full_name), '') is not null
)
update public.profiles as profile
set
  first_name = coalesce(profile.first_name, names.parts[1]),
  middle_name = coalesce(
    profile.middle_name,
    case when cardinality(names.parts) > 2
      then array_to_string(names.parts[2:cardinality(names.parts) - 1], ' ')
    end
  ),
  last_name = coalesce(
    profile.last_name,
    case when cardinality(names.parts) > 1 then names.parts[cardinality(names.parts)] else '' end
  )
from profile_names as names
where profile.id = names.id;

with inquiry_names as (
  select id, regexp_split_to_array(trim(full_name), '\s+') as parts
  from public.website_inquiries
)
update public.website_inquiries as inquiry
set
  first_name = coalesce(inquiry.first_name, names.parts[1]),
  middle_name = coalesce(
    inquiry.middle_name,
    case when cardinality(names.parts) > 2
      then array_to_string(names.parts[2:cardinality(names.parts) - 1], ' ')
    end
  ),
  last_name = coalesce(
    inquiry.last_name,
    case when cardinality(names.parts) > 1 then names.parts[cardinality(names.parts)] else '' end
  )
from inquiry_names as names
where inquiry.id = names.id;

alter table public.website_inquiries
  alter column first_name set not null,
  alter column last_name set not null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  legacy_full_name text := nullif(trim(new.raw_user_meta_data ->> 'full_name'), '');
  given_name text := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'first_name'), ''),
    nullif(split_part(legacy_full_name, ' ', 1), ''),
    split_part(new.email, '@', 1)
  );
  additional_name text := nullif(trim(new.raw_user_meta_data ->> 'middle_name'), '');
  family_name text := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'last_name'), ''),
    case when legacy_full_name like '% %' then regexp_replace(legacy_full_name, '^.*\s', '') end,
    ''
  );
  display_name text;
begin
  display_name := concat_ws(' ', given_name, additional_name, nullif(family_name, ''));

  insert into public.profiles (id, first_name, middle_name, last_name, full_name, locale, timezone)
  values (
    new.id,
    given_name,
    additional_name,
    family_name,
    display_name,
    'en-PH',
    coalesce(nullif(new.raw_user_meta_data ->> 'timezone', ''), 'Asia/Manila')
  )
  on conflict (id) do nothing;

  insert into public.roles (user_id, role)
  values (new.id, 'customer')
  on conflict (user_id) do nothing;

  insert into public.user_preferences (user_id, timezone)
  values (new.id, coalesce(nullif(new.raw_user_meta_data ->> 'timezone', ''), 'Asia/Manila'))
  on conflict (user_id) do nothing;

  return new;
end;
$$;

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

  insert into public.profiles (id, first_name, middle_name, last_name, full_name, locale)
  select
    id,
    coalesce(
      nullif(trim(raw_user_meta_data ->> 'first_name'), ''),
      nullif(split_part(nullif(trim(raw_user_meta_data ->> 'full_name'), ''), ' ', 1), ''),
      split_part(email, '@', 1)
    ),
    nullif(trim(raw_user_meta_data ->> 'middle_name'), ''),
    coalesce(
      nullif(trim(raw_user_meta_data ->> 'last_name'), ''),
      case
        when nullif(trim(raw_user_meta_data ->> 'full_name'), '') like '% %'
          then regexp_replace(trim(raw_user_meta_data ->> 'full_name'), '^.*\s', '')
        else ''
      end
    ),
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

