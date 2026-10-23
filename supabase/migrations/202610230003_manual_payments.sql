-- Manual payments: customers pay by GCash, Maya, or bank transfer, submit their payment
-- reference, and an admin confirms it, which publishes the site (LAUNCH_CHECKLIST Phase 2).
-- Business sites are prepaid for 1, 3, 6, or 12 months and stay online 7 days past the
-- paid period. Safe to apply more than once.

-- ---------------------------------------------------------------- Catalogue and prices
alter table public.pricing_plans add column if not exists slug text;
alter table public.pricing_plans add column if not exists months integer check (months is null or months > 0);
create unique index if not exists pricing_plans_slug_idx on public.pricing_plans(slug);

insert into public.products (slug, name, product_type) values
  ('wedding-invitation', 'Wedding invitation', 'wedding'),
  ('debut-invitation', 'Debut invitation', 'wedding'),
  ('business-site', 'Business website', 'business')
on conflict (slug) do update set name = excluded.name, product_type = excluded.product_type, active = true;

-- Keep in sync with src/lib/checkout-products.ts, which shows these prices; charges always
-- use the database. 12 months is priced as 10 (two months free).
insert into public.pricing_plans (product_id, slug, name, price_centavos, billing_interval, months)
select p.id, plan.slug, plan.name, plan.price, plan.billing_interval, plan.months
from (values
  ('wedding-invitation', 'wedding-invitation', 'Wedding invitation', 79900, 'one_time', null::integer),
  ('debut-invitation', 'debut-invitation', 'Debut invitation', 99900, 'one_time', null),
  ('business-site', 'business-site-1m', 'Business website, 1 month', 29900, 'month', 1),
  ('business-site', 'business-site-3m', 'Business website, 3 months', 89700, 'month', 3),
  ('business-site', 'business-site-6m', 'Business website, 6 months', 179400, 'month', 6),
  ('business-site', 'business-site-12m', 'Business website, 12 months', 299000, 'month', 12)
) as plan(product_slug, slug, name, price, billing_interval, months)
join public.products p on p.slug = plan.product_slug
on conflict (slug) do update set
  product_id = excluded.product_id, name = excluded.name, price_centavos = excluded.price_centavos,
  billing_interval = excluded.billing_interval, months = excluded.months, active = true;

-- ---------------------------------------------------------------- Manual payment orders
alter table public.orders
  add column if not exists payment_method text check (payment_method in ('gcash', 'maya', 'bank')),
  add column if not exists customer_reference text check (length(customer_reference) between 4 and 60),
  add column if not exists submitted_at timestamptz,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references public.profiles(id) on delete set null,
  add column if not exists review_note text check (length(review_note) <= 300);

create index if not exists orders_awaiting_review_idx on public.orders(submitted_at) where status = 'pending' and submitted_at is not null;

-- One business subscription per project; renewals extend it.
create unique index if not exists subscriptions_project_unique_idx on public.subscriptions(project_id) where project_id is not null;

-- Expiry reminder emails already sent, so each is sent once per paid period.
create table if not exists public.subscription_reminders (
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  kind text not null check (kind in ('7_days', '1_day', 'offline')),
  period_ends_at timestamptz not null,
  sent_at timestamptz not null default now(),
  primary key (subscription_id, kind, period_ends_at)
);
alter table public.subscription_reminders enable row level security;
revoke all on public.subscription_reminders from anon, authenticated;

-- Creates a pending order with a server-side price. Called by the server (service role) for
-- the signed-in customer. Replaces that project's earlier orders the customer never paid for.
create or replace function public.create_manual_order(
  customer_id uuid,
  target_project_id uuid,
  plan_slug text,
  method text,
  referral text
)
returns table(order_id uuid, reference text, total_centavos integer)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  target public.projects%rowtype;
  plan record;
  kind text;
  expected_product text;
  discount integer := 0;
  new_reference text;
  new_order_id uuid;
  referral_owner uuid;
begin
  select * into target from public.projects where id = target_project_id and owner_id = customer_id;
  if not found then raise exception 'Project not found.' using errcode = 'P0002'; end if;
  if method not in ('gcash', 'maya', 'bank') then raise exception 'Choose a payment method.' using errcode = '22023'; end if;

  select pp.id, pp.slug, pp.name, pp.price_centavos, pp.months, pr.slug as product_slug into plan
  from public.pricing_plans pp join public.products pr on pr.id = pp.product_id
  where pp.slug = plan_slug and pp.active and pr.active;
  if not found then raise exception 'That plan is not available.' using errcode = '22023'; end if;

  -- The plan must match the project, so a debut can't be bought at the wedding price.
  if target.project_type = 'wedding' then
    select coalesce(event_kind, 'wedding') into kind from public.wedding_events where project_id = target.id;
    expected_product := case when kind = 'debut' then 'debut-invitation' else 'wedding-invitation' end;
    if plan.product_slug <> expected_product then
      raise exception 'That plan does not match this invitation.' using errcode = '22023';
    end if;
    if exists (
      select 1 from public.order_items oi join public.orders o on o.id = oi.order_id
      where oi.project_id = target.id and o.status in ('paid', 'partially_refunded')
    ) then
      raise exception 'This invitation is already paid for.' using errcode = '23505';
    end if;
  elsif target.project_type = 'business' then
    if plan.product_slug <> 'business-site' then raise exception 'That plan does not match this site.' using errcode = '22023'; end if;
  else
    raise exception 'This project type is not sold here.' using errcode = '22023';
  end if;

  -- ₱50 off a first purchase with someone else's code (REFERRAL_DISCOUNT_PESOS in src/lib/referral.ts).
  if referral is not null and length(trim(referral)) > 0 then
    select user_id into referral_owner from public.referral_codes where code = upper(trim(referral));
    if referral_owner is not null and referral_owner <> customer_id and not exists (
      select 1 from public.orders where user_id = customer_id and status in ('paid', 'partially_refunded')
    ) then
      discount := least(5000, plan.price_centavos);
    else
      referral := null;
    end if;
  else
    referral := null;
  end if;

  update public.orders o set status = 'failed', review_note = 'Replaced by a newer order.'
  where o.user_id = customer_id and o.status = 'pending' and o.submitted_at is null
    and exists (select 1 from public.order_items oi where oi.order_id = o.id and oi.project_id = target.id);

  loop
    new_reference := 'GL-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    exit when not exists (select 1 from public.orders where orders.reference = new_reference);
  end loop;

  insert into public.orders (user_id, reference, status, subtotal_centavos, total_centavos, payment_method, referral_code, discount_centavos)
  values (customer_id, new_reference, 'pending', plan.price_centavos, plan.price_centavos - discount, method, upper(trim(referral)), discount)
  returning id into new_order_id;

  insert into public.order_items (order_id, product_id, pricing_plan_id, description, quantity, unit_price_centavos, project_id)
  select new_order_id, pp.product_id, pp.id, plan.name, 1, plan.price_centavos, target.id
  from public.pricing_plans pp where pp.id = plan.id;

  return query select new_order_id, new_reference, plan.price_centavos - discount;
end;
$$;

-- Marks a submitted order paid, records the payment, extends a business subscription, and
-- publishes the site with `content` (built by the server from the saved draft). A payment
-- reference can confirm only one order. Called by the server (service role) for an admin.
create or replace function public.confirm_manual_order(
  target_order_id uuid,
  reviewer_id uuid,
  content jsonb,
  new_slug text
)
returns table(slug text, paid_until timestamptz)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  target_order public.orders%rowtype;
  item record;
  owner uuid;
  ends_at timestamptz;
  revision_id uuid;
  site_slug text;
begin
  select * into target_order from public.orders where id = target_order_id for update;
  if not found then raise exception 'Order not found.' using errcode = 'P0002'; end if;
  if target_order.status <> 'pending' or target_order.customer_reference is null then
    raise exception 'Only submitted, unconfirmed orders can be confirmed.' using errcode = '22023';
  end if;

  select oi.project_id, oi.pricing_plan_id, pp.months, p.project_type, p.owner_id into item
  from public.order_items oi
  join public.pricing_plans pp on pp.id = oi.pricing_plan_id
  join public.projects p on p.id = oi.project_id
  where oi.order_id = target_order.id
  limit 1;
  if item.project_id is null then raise exception 'This order has no project.' using errcode = 'P0002'; end if;
  owner := item.owner_id;

  update public.orders set status = 'paid', paid_at = now(), reviewed_at = now(), reviewed_by = reviewer_id
  where id = target_order.id;

  -- provider_payment_id is unique, so the same GCash/Maya/bank reference can't pay twice.
  insert into public.payments (order_id, provider, provider_payment_id, idempotency_key, status, amount_centavos, confirmed_at)
  values (target_order.id, 'manual-' || target_order.payment_method,
          target_order.payment_method || ':' || upper(regexp_replace(target_order.customer_reference, '\s', '', 'g')),
          target_order.id::text, 'paid', target_order.total_centavos, now());

  if item.project_type = 'business' then
    insert into public.subscriptions (user_id, pricing_plan_id, status, current_period_ends_at, project_id)
    values (owner, item.pricing_plan_id, 'active', now() + make_interval(months => item.months), item.project_id)
    on conflict (project_id) where project_id is not null do update set
      pricing_plan_id = excluded.pricing_plan_id,
      status = 'active',
      current_period_ends_at = greatest(subscriptions.current_period_ends_at, now()) + make_interval(months => item.months),
      updated_at = now()
    returning current_period_ends_at into ends_at;
  end if;

  insert into public.project_revisions (project_id, revision, content, created_by)
  values (item.project_id, coalesce((select max(revision) from public.project_revisions where project_id = item.project_id), 0) + 1, content, owner)
  returning id into revision_id;

  insert into public.published_sites (project_id, slug, active_revision_id, is_live, published_at, updated_at)
  values (item.project_id, new_slug, revision_id, true, now(), now())
  on conflict (project_id) do update set
    active_revision_id = excluded.active_revision_id, is_live = true,
    published_at = coalesce(published_sites.published_at, now()), updated_at = now()
  returning published_sites.slug into site_slug;

  update public.projects set status = 'published', updated_at = now() where id = item.project_id;

  insert into public.notifications (user_id, notification_type, title, body, action_url)
  values (owner, 'payment_confirmed', 'Payment confirmed',
          case when item.project_type = 'business' then 'Your business site is live.' else 'Your invitation is live.' end,
          case when item.project_type = 'business' then '/site/' else '/wedding/' end || site_slug);

  return query select site_slug, ends_at;
end;
$$;

revoke all on function public.create_manual_order(uuid, uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.create_manual_order(uuid, uuid, text, text, text) to service_role;
revoke all on function public.confirm_manual_order(uuid, uuid, jsonb, text) from public, anon, authenticated;
grant execute on function public.confirm_manual_order(uuid, uuid, jsonb, text) to service_role;

-- ---------------------------------------------------------------- Business site expiry
-- A business site is public while its subscription is active and paid up, plus a 7-day grace
-- period, so expired sites go offline on time without a scheduled job. Renewing brings it back.
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
    and exists (
      select 1 from public.subscriptions s
      where s.project_id = p.id and s.status = 'active'
        and s.current_period_ends_at > now() - interval '7 days'
    )
  limit 1;
$$;

revoke all on function public.get_public_business_site(text) from public;
grant execute on function public.get_public_business_site(text) to anon, authenticated;
