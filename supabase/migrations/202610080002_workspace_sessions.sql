-- Session-aware customer workspace additions. Apply after 202610080001_initial_schema.sql.

alter table public.profiles
  add column if not exists timezone text not null default 'Asia/Manila';

create table if not exists public.user_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  timezone text not null default 'Asia/Manila',
  project_view text not null default 'list' check (project_view in ('list','grid')),
  project_sort text not null default 'updated' check (project_sort in ('updated','name')),
  email_notifications boolean not null default true,
  notification_preferences jsonb not null default '{}'::jsonb,
  privacy_preferences jsonb not null default '{}'::jsonb,
  last_project_id uuid references public.projects(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  event_type text not null,
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  notification_type text not null,
  title text not null,
  body text,
  action_url text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists activity_logs_user_created_idx on public.activity_logs(user_id, created_at desc);
create index if not exists notifications_user_unread_idx on public.notifications(user_id, read_at, created_at desc);
create index if not exists projects_owner_status_updated_idx on public.projects(owner_id, status, updated_at desc);

alter table public.user_preferences enable row level security;
alter table public.activity_logs enable row level security;
alter table public.notifications enable row level security;
alter table public.subscriptions enable row level security;
alter table public.project_add_ons enable row level security;
alter table public.security_events enable row level security;

drop policy if exists "preferences owner access" on public.user_preferences;
create policy "preferences owner access" on public.user_preferences
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "activity owner read" on public.activity_logs;
create policy "activity owner read" on public.activity_logs
  for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "activity owner insert" on public.activity_logs;
create policy "activity owner insert" on public.activity_logs
  for insert with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "notifications owner access" on public.notifications;
create policy "notifications owner access" on public.notifications
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

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

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, locale, timezone)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)),
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Backfill users created before this migration.
insert into public.profiles (id, full_name, locale, timezone)
select id, coalesce(nullif(trim(raw_user_meta_data ->> 'full_name'), ''), split_part(email, '@', 1)), 'en-PH', coalesce(nullif(raw_user_meta_data ->> 'timezone', ''), 'Asia/Manila')
from auth.users
on conflict (id) do nothing;

insert into public.roles (user_id, role)
select id, 'customer' from auth.users
on conflict (user_id) do nothing;

insert into public.user_preferences (user_id, timezone)
select id, coalesce(nullif(raw_user_meta_data ->> 'timezone', ''), 'Asia/Manila') from auth.users
on conflict (user_id) do nothing;
