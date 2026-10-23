-- Booking requests from visitors of a business site. The owner turns bookings on in the
-- editor; each request is saved here and emailed to the owner. Safe to apply more than once.

alter table public.business_profiles add column if not exists booking_enabled boolean not null default false;

create table if not exists public.business_bookings (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  customer_name text not null check (char_length(customer_name) between 1 and 120),
  phone text not null check (char_length(phone) between 1 and 40),
  email text check (email is null or char_length(email) <= 200),
  service text check (service is null or char_length(service) <= 200),
  preferred_date date not null,
  preferred_time time not null,
  message text check (message is null or char_length(message) <= 1000),
  status text not null default 'new' check (status in ('new', 'confirmed', 'declined', 'done')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists business_bookings_project_idx on public.business_bookings(project_id, created_at desc);
alter table public.business_bookings enable row level security;

-- Visitors never write directly: the server inserts after Turnstile and a rate limit check.
-- Owners read their bookings and may change only the status.
revoke all on public.business_bookings from anon, authenticated;
grant select on public.business_bookings to authenticated;
grant update (status, updated_at) on public.business_bookings to authenticated;

drop policy if exists "owners read their bookings" on public.business_bookings;
create policy "owners read their bookings" on public.business_bookings for select to authenticated
  using (public.is_admin() or exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));
drop policy if exists "owners update their bookings" on public.business_bookings;
create policy "owners update their bookings" on public.business_bookings for update to authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));

-- The live business behind a public slug, with the owner's account email to notify. Same
-- conditions as get_public_business_site, so expired sites stop taking bookings too.
create or replace function public.get_business_booking_target(requested_slug text)
returns table(project_id uuid, owner_email text, content jsonb)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, u.email::text, pr.content
  from public.published_sites ps
  join public.projects p on p.id = ps.project_id
  join public.project_revisions pr on pr.id = ps.active_revision_id and pr.project_id = p.id
  join auth.users u on u.id = p.owner_id
  where ps.slug = requested_slug
    and ps.is_live = true
    and p.status = 'published'
    and p.project_type = 'business'
    and exists (
      select 1 from public.subscriptions s
      where s.project_id = p.id and s.status = 'active'
        and s.current_period_ends_at > now() - interval '7 days'
    )
  limit 1;
$$;

revoke all on function public.get_business_booking_target(text) from public, anon, authenticated;
grant execute on function public.get_business_booking_target(text) to service_role;
