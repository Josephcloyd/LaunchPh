create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_path text,
  locale text not null default 'en-PH',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.roles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  role text not null default 'customer' check (role in ('customer','support','admin')),
  granted_by uuid references public.profiles(id),
  granted_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  product_type text not null check (product_type in ('wedding','resume','portfolio','business')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.pricing_plans (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  price_centavos integer not null check (price_centavos >= 0),
  currency text not null default 'PHP',
  billing_interval text check (billing_interval in ('one_time','month','year')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.templates (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id),
  name text not null,
  slug text not null unique,
  category text not null,
  description text,
  status text not null default 'draft' check (status in ('draft','mapping','review','published','archived')),
  preview_path text,
  price_centavos integer check (price_centavos >= 0),
  created_by uuid references public.profiles(id),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.template_versions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.templates(id) on delete cascade,
  version integer not null,
  schema jsonb not null default '{}'::jsonb,
  editable_regions jsonb not null default '[]'::jsonb,
  validated_at timestamptz,
  created_at timestamptz not null default now(),
  unique(template_id, version)
);

create table public.template_assets (
  id uuid primary key default gen_random_uuid(),
  template_version_id uuid not null references public.template_versions(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  byte_size bigint not null check (byte_size >= 0),
  scan_status text not null default 'pending' check (scan_status in ('pending','clean','quarantined','rejected')),
  created_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  template_id uuid references public.templates(id),
  name text not null,
  project_type text not null check (project_type in ('wedding','resume','portfolio','business')),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  thumbnail_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_revisions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  revision integer not null,
  content jsonb not null default '{}'::jsonb,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  unique(project_id, revision)
);

create table public.project_settings (
  project_id uuid primary key references public.projects(id) on delete cascade,
  search_indexing boolean not null default false,
  password_hash text,
  shared_link_expires_at timestamptz,
  upload_policy jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.published_sites (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.projects(id) on delete cascade,
  slug text not null unique,
  active_revision_id uuid references public.project_revisions(id),
  is_live boolean not null default false,
  published_at timestamptz,
  updated_at timestamptz not null default now()
);

create table public.domains (
  id uuid primary key default gen_random_uuid(),
  published_site_id uuid not null references public.published_sites(id) on delete cascade,
  hostname text not null unique,
  verification_status text not null default 'pending',
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  pricing_plan_id uuid not null references public.pricing_plans(id),
  provider_customer_id text,
  provider_subscription_id text unique,
  status text not null,
  current_period_ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  reference text not null unique,
  status text not null default 'pending' check (status in ('pending','paid','failed','refunded','partially_refunded')),
  subtotal_centavos integer not null check (subtotal_centavos >= 0),
  fees_centavos integer not null default 0,
  tax_centavos integer not null default 0,
  total_centavos integer not null check (total_centavos >= 0),
  currency text not null default 'PHP',
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id),
  pricing_plan_id uuid references public.pricing_plans(id),
  description text not null,
  quantity integer not null default 1 check (quantity > 0),
  unit_price_centavos integer not null check (unit_price_centavos >= 0)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  provider text not null,
  provider_payment_id text not null unique,
  idempotency_key text not null unique,
  status text not null,
  amount_centavos integer not null,
  currency text not null default 'PHP',
  provider_payload jsonb not null default '{}'::jsonb,
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.add_ons (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null,
  price_centavos integer not null check (price_centavos >= 0),
  active boolean not null default true
);

create table public.project_add_ons (
  project_id uuid not null references public.projects(id) on delete cascade,
  add_on_id uuid not null references public.add_ons(id),
  order_item_id uuid references public.order_items(id),
  settings jsonb not null default '{}'::jsonb,
  enabled_at timestamptz not null default now(),
  primary key (project_id, add_on_id)
);

create table public.security_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  user_id uuid references public.profiles(id),
  event_type text not null,
  ip_hash text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.wedding_events (
  project_id uuid primary key references public.projects(id) on delete cascade,
  partner_one text not null,
  partner_two text not null,
  event_date timestamptz not null,
  venue_name text,
  venue_address text,
  map_url text,
  story text,
  rsvp_enabled boolean not null default true,
  photo_uploads_enabled boolean not null default false
);

create table public.wedding_guests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  display_name text not null,
  token_hash text not null unique,
  party_size integer not null default 1 check (party_size > 0),
  created_at timestamptz not null default now()
);

create table public.rsvps (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null unique references public.wedding_guests(id) on delete cascade,
  attending boolean,
  attendee_count integer check (attendee_count >= 0),
  meal_notes text,
  responded_at timestamptz not null default now()
);

create table public.wedding_photos (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  guest_id uuid references public.wedding_guests(id) on delete set null,
  storage_path text not null,
  mime_type text not null,
  byte_size bigint not null check (byte_size > 0),
  moderation_status text not null default 'pending' check (moderation_status in ('pending','approved','rejected','quarantined')),
  created_at timestamptz not null default now()
);

create table public.resume_documents (
  project_id uuid primary key references public.projects(id) on delete cascade,
  page_size text not null default 'A4' check (page_size in ('A4','LETTER','SHORT_BOND','LONG_BOND','LEGAL')),
  content jsonb not null default '{}'::jsonb,
  export_path text,
  exported_at timestamptz,
  updated_at timestamptz not null default now()
);

create table public.business_profiles (
  project_id uuid primary key references public.projects(id) on delete cascade,
  business_name text not null,
  business_type text,
  contact_details jsonb not null default '{}'::jsonb,
  hours jsonb not null default '{}'::jsonb,
  booking_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  sender_name text not null,
  sender_email text not null,
  message text not null,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  subject text not null,
  message text not null,
  status text not null default 'open' check (status in ('open','pending','resolved','closed')),
  priority text not null default 'normal',
  assigned_to uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id),
  action text not null,
  resource_type text not null,
  resource_id uuid,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create index projects_owner_idx on public.projects(owner_id, updated_at desc);
create index templates_marketplace_idx on public.templates(status, category, published_at desc);
create index orders_user_idx on public.orders(user_id, created_at desc);
create index security_events_project_idx on public.security_events(project_id, created_at desc);
create index wedding_guests_project_idx on public.wedding_guests(project_id);
create index wedding_photos_project_idx on public.wedding_photos(project_id, moderation_status);
create index support_tickets_user_idx on public.support_tickets(user_id, created_at desc);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.roles where user_id = auth.uid() and role = 'admin') $$;

alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.projects enable row level security;
alter table public.project_revisions enable row level security;
alter table public.project_settings enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.wedding_events enable row level security;
alter table public.wedding_guests enable row level security;
alter table public.rsvps enable row level security;
alter table public.wedding_photos enable row level security;
alter table public.resume_documents enable row level security;
alter table public.business_profiles enable row level security;
alter table public.support_tickets enable row level security;
alter table public.templates enable row level security;
alter table public.template_versions enable row level security;
alter table public.template_assets enable row level security;
alter table public.audit_logs enable row level security;

create policy "profiles read own" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "profiles update own" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "projects owner access" on public.projects for all using (owner_id = auth.uid() or public.is_admin()) with check (owner_id = auth.uid() or public.is_admin());
create policy "project revisions owner access" on public.project_revisions for all using (exists(select 1 from public.projects p where p.id = project_id and (p.owner_id = auth.uid() or public.is_admin())));
create policy "project settings owner access" on public.project_settings for all using (exists(select 1 from public.projects p where p.id = project_id and (p.owner_id = auth.uid() or public.is_admin())));
create policy "orders owner read" on public.orders for select using (user_id = auth.uid() or public.is_admin());
create policy "order items owner read" on public.order_items for select using (exists(select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())));
create policy "payments owner read" on public.payments for select using (exists(select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())));
create policy "wedding owner access" on public.wedding_events for all using (exists(select 1 from public.projects p where p.id = project_id and (p.owner_id = auth.uid() or public.is_admin())));
create policy "wedding guests owner access" on public.wedding_guests for all using (exists(select 1 from public.projects p where p.id = project_id and (p.owner_id = auth.uid() or public.is_admin())));
create policy "rsvp owner read" on public.rsvps for select using (exists(select 1 from public.wedding_guests g join public.projects p on p.id = g.project_id where g.id = guest_id and (p.owner_id = auth.uid() or public.is_admin())));
create policy "wedding photos owner access" on public.wedding_photos for all using (exists(select 1 from public.projects p where p.id = project_id and (p.owner_id = auth.uid() or public.is_admin())));
create policy "resume owner access" on public.resume_documents for all using (exists(select 1 from public.projects p where p.id = project_id and (p.owner_id = auth.uid() or public.is_admin())));
create policy "business owner access" on public.business_profiles for all using (exists(select 1 from public.projects p where p.id = project_id and (p.owner_id = auth.uid() or public.is_admin())));
create policy "support owner access" on public.support_tickets for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy "published templates are public" on public.templates for select using (status = 'published' or public.is_admin());
create policy "template versions public through template" on public.template_versions for select using (exists(select 1 from public.templates t where t.id = template_id and (t.status = 'published' or public.is_admin())));
create policy "admins manage templates" on public.templates for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage template versions" on public.template_versions for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage template assets" on public.template_assets for all using (public.is_admin()) with check (public.is_admin());
create policy "admins read audit logs" on public.audit_logs for select using (public.is_admin());

insert into public.add_ons (slug, name, description, price_centavos)
values ('enhanced-security', 'Enhanced Security Package', 'Optional project access and monitoring controls.', 20000)
on conflict (slug) do nothing;
