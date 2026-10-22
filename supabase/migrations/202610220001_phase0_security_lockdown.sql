-- Phase 0 security lockdown (see LAUNCH_CHECKLIST.md).
-- 1. Row Level Security on the five tables that never had it.
-- 2. Publishing a paid project (wedding, debut, business) only through publish_project(),
--    which checks for a paid order or an active subscription first.

-- Catalogue tables: prices are public, changes are admin-only.
alter table public.products enable row level security;
alter table public.pricing_plans enable row level security;
alter table public.add_ons enable row level security;

drop policy if exists "active products are public" on public.products;
create policy "active products are public" on public.products
  for select to anon, authenticated
  using (active or public.is_admin());

drop policy if exists "admins manage products" on public.products;
create policy "admins manage products" on public.products
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "active pricing plans are public" on public.pricing_plans;
create policy "active pricing plans are public" on public.pricing_plans
  for select to anon, authenticated
  using (active or public.is_admin());

drop policy if exists "admins manage pricing plans" on public.pricing_plans;
create policy "admins manage pricing plans" on public.pricing_plans
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "active add ons are public" on public.add_ons;
create policy "active add ons are public" on public.add_ons
  for select to anon, authenticated
  using (active or public.is_admin());

drop policy if exists "admins manage add ons" on public.add_ons;
create policy "admins manage add ons" on public.add_ons
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Custom domains: owners can see theirs; verification status is set by admins only.
alter table public.domains enable row level security;

drop policy if exists "domains owner read" on public.domains;
create policy "domains owner read" on public.domains
  for select to authenticated
  using (
    exists (
      select 1 from public.published_sites ps
      join public.projects p on p.id = ps.project_id
      where ps.id = published_site_id and (p.owner_id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists "admins manage domains" on public.domains;
create policy "admins manage domains" on public.domains
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Visitor messages from business sites hold names, emails, and messages.
-- There is deliberately no insert policy: public submissions must go through a
-- rate-limited security definer function when the contact form is built.
alter table public.contact_submissions enable row level security;

drop policy if exists "contact submissions owner read" on public.contact_submissions;
create policy "contact submissions owner read" on public.contact_submissions
  for select to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and (p.owner_id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists "admins manage contact submissions" on public.contact_submissions;
create policy "admins manage contact submissions" on public.contact_submissions
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Tie purchases to the project they pay for. Only the server (service role) writes these.
alter table public.order_items
  add column if not exists project_id uuid references public.projects(id) on delete set null;
alter table public.subscriptions
  add column if not exists project_id uuid references public.projects(id) on delete set null;

create index if not exists order_items_project_idx on public.order_items(project_id);
create index if not exists subscriptions_project_idx on public.subscriptions(project_id);

-- Owners keep their "for all" access to projects and published_sites for editing,
-- but these triggers stop them making a paid project public through the API.
-- Requests from the API run as anon or authenticated; publish_project() (security definer),
-- the service role, and admins are allowed through.
create or replace function public.guard_project_publication()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user not in ('anon', 'authenticated') or public.is_admin() then
    return new;
  end if;

  -- Otherwise a free project could be published, then switched to a paid type.
  if tg_op = 'UPDATE' and new.project_type is distinct from old.project_type then
    raise exception 'Project type cannot be changed.' using errcode = '42501';
  end if;

  if new.status = 'published'
    and new.project_type in ('wedding', 'business')
    and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    raise exception 'Paid projects are published after checkout.' using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_project_publication on public.projects;
create trigger guard_project_publication
  before insert or update on public.projects
  for each row execute function public.guard_project_publication();

create or replace function public.guard_site_publication()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user not in ('anon', 'authenticated') or public.is_admin() then
    return new;
  end if;

  if tg_op = 'UPDATE' and new.project_id is distinct from old.project_id then
    raise exception 'A published site cannot be moved to another project.' using errcode = '42501';
  end if;

  if new.is_live and (tg_op = 'INSERT' or not old.is_live) then
    raise exception 'Sites go live through publish_project().' using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_site_publication on public.published_sites;
create trigger guard_site_publication
  before insert or update on public.published_sites
  for each row execute function public.guard_site_publication();

-- The one route to publishing. Returns false when the project isn't found, isn't the
-- caller's, or hasn't been paid for. Weddings and debuts need a paid order item for this
-- project; business sites need an active subscription for it. Admins may publish without
-- payment (e.g. a complimentary site). Creating the published_sites row (slug and revision)
-- is checkout work; this only switches an existing row live.
create or replace function public.publish_project(target_project_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.projects%rowtype;
begin
  select * into target from public.projects where id = target_project_id;
  if not found or not coalesce(target.owner_id = auth.uid() or public.is_admin(), false) then
    return false;
  end if;

  if not public.is_admin() then
    if target.project_type = 'wedding' and not exists (
      select 1 from public.order_items oi
      join public.orders o on o.id = oi.order_id
      where oi.project_id = target.id
        and o.user_id = target.owner_id
        and o.status in ('paid', 'partially_refunded')
    ) then
      return false;
    end if;

    -- Grace periods for failed renewals are added with recurring billing (Phase 2).
    if target.project_type = 'business' and not exists (
      select 1 from public.subscriptions s
      where s.project_id = target.id
        and s.user_id = target.owner_id
        and s.status = 'active'
        and (s.current_period_ends_at is null or s.current_period_ends_at > now())
    ) then
      return false;
    end if;
  end if;

  update public.projects set status = 'published', updated_at = now() where id = target.id;
  update public.published_sites
  set is_live = true, published_at = coalesce(published_at, now()), updated_at = now()
  where project_id = target.id;

  return true;
end;
$$;

-- Supabase grants execute to anon by default, so revoking from public alone isn't enough.
revoke all on function public.publish_project(uuid) from public, anon;
grant execute on function public.publish_project(uuid) to authenticated;
