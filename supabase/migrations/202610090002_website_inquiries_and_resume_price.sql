-- Public custom-website consultation requests and updated resume pricing.

create table if not exists public.website_inquiries (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  business_name text not null,
  website_type text not null check (website_type in ('local_business', 'professional', 'catalogue', 'other')),
  budget_range text not null check (budget_range in ('under_10000', '10000_25000', '25000_50000', '50000_plus', 'not_sure')),
  domain_status text not null check (domain_status in ('need_domain', 'have_domain', 'not_sure')),
  preferred_meeting_date date not null,
  preferred_meeting_time time not null,
  timezone text not null default 'Asia/Manila',
  message text not null,
  status text not null default 'new' check (status in ('new', 'contacted', 'scheduled', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists website_inquiries_status_created_idx
  on public.website_inquiries(status, created_at desc);

alter table public.website_inquiries enable row level security;

drop policy if exists "public can submit website inquiries" on public.website_inquiries;
create policy "public can submit website inquiries" on public.website_inquiries
  for insert to anon, authenticated
  with check (status = 'new');

drop policy if exists "admins manage website inquiries" on public.website_inquiries;
create policy "admins manage website inquiries" on public.website_inquiries
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

update public.templates
set price_centavos = 5000, updated_at = now()
where lower(category) like '%resume%'
  and coalesce(price_centavos, 0) > 0;
