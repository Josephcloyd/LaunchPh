create table if not exists public.job_application_inquiries (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  middle_name text,
  last_name text not null,
  email text not null,
  phone text,
  target_role text not null,
  experience_level text not null check (experience_level in ('student', 'entry', 'mid', 'senior', 'career_change')),
  requested_services text[] not null,
  job_posting_url text,
  linkedin_url text,
  message text not null,
  status text not null default 'new' check (status in ('new', 'reviewing', 'contacted', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (cardinality(requested_services) between 1 and 5)
);

create index if not exists job_application_inquiries_status_created_idx
  on public.job_application_inquiries(status, created_at desc);

alter table public.job_application_inquiries enable row level security;

drop policy if exists "public can submit job application inquiries" on public.job_application_inquiries;
create policy "public can submit job application inquiries" on public.job_application_inquiries
  for insert to anon, authenticated
  with check (status = 'new');

drop policy if exists "admins manage job application inquiries" on public.job_application_inquiries;
create policy "admins manage job application inquiries" on public.job_application_inquiries
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

