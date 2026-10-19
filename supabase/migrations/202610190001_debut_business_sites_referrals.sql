-- Debut invitations reuse the invitation editor, publishing, and RSVP portal.
alter table public.wedding_events
  add column if not exists event_kind text not null default 'wedding',
  add column if not exists celebrant_first_name text,
  add column if not exists celebrant_middle_name text,
  add column if not exists celebrant_last_name text;

alter table public.wedding_events drop constraint if exists wedding_events_event_kind_check;
alter table public.wedding_events
  add constraint wedding_events_event_kind_check check (event_kind in ('wedding', 'debut'));

-- One-page business sites (₱299 per month).
alter table public.business_profiles
  add column if not exists tagline text,
  add column if not exists about text,
  add column if not exists services text,
  add column if not exists address text,
  add column if not exists map_url text,
  add column if not exists social_links jsonb not null default '{}'::jsonb;

create or replace function public.get_public_business_site(requested_slug text)
returns table(content jsonb)
language sql
stable
security definer
set search_path = public
as $$
  select pr.content
  from public.published_sites ps
  join public.projects p on p.id = ps.project_id
  join public.project_revisions pr on pr.id = ps.active_revision_id and pr.project_id = p.id
  where ps.slug = requested_slug
    and ps.is_live = true
    and p.status = 'published'
    and p.project_type = 'business'
  limit 1;
$$;

revoke all on function public.get_public_business_site(text) from public;
grant execute on function public.get_public_business_site(text) to anon, authenticated;

-- Referral codes: a new customer using someone's code receives ₱50 off.
create table if not exists public.referral_codes (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  code text not null unique check (code ~ '^[A-Z0-9]{8}$'),
  created_at timestamptz not null default now()
);

alter table public.referral_codes enable row level security;

drop policy if exists "referral codes owner read" on public.referral_codes;
create policy "referral codes owner read" on public.referral_codes
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

alter table public.orders
  add column if not exists referral_code text,
  add column if not exists discount_centavos integer not null default 0 check (discount_centavos >= 0);

create or replace function public.ensure_my_referral_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_code text;
  candidate text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select code into existing_code from public.referral_codes where user_id = auth.uid();
  if existing_code is not null then
    return existing_code;
  end if;

  loop
    candidate := upper(substr(md5(random()::text || clock_timestamp()::text || auth.uid()::text), 1, 8));
    begin
      insert into public.referral_codes (user_id, code) values (auth.uid(), candidate);
      return candidate;
    exception when unique_violation then
      -- Either the random code collided or a parallel request created this user's code.
      select code into existing_code from public.referral_codes where user_id = auth.uid();
      if existing_code is not null then
        return existing_code;
      end if;
    end;
  end loop;
end;
$$;

revoke all on function public.ensure_my_referral_code() from public;
grant execute on function public.ensure_my_referral_code() to authenticated;

-- Returns 'valid', 'not_found', 'own_code', or 'returning_customer'.
-- Order creation must call this again on the server before applying a discount.
create or replace function public.check_referral_code(referral_code text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when rc.user_id is null then 'not_found'
    when rc.user_id = auth.uid() then 'own_code'
    when auth.uid() is not null and exists (
      select 1 from public.orders o
      where o.user_id = auth.uid() and o.status in ('paid', 'partially_refunded')
    ) then 'returning_customer'
    else 'valid'
  end
  from (select 1) as input
  left join public.referral_codes rc on rc.code = upper(trim(referral_code));
$$;

revoke all on function public.check_referral_code(text) from public;
grant execute on function public.check_referral_code(text) to anon, authenticated;
