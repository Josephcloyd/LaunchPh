alter table public.wedding_events
  add column if not exists partner_one_first_name text,
  add column if not exists partner_one_middle_name text,
  add column if not exists partner_one_last_name text,
  add column if not exists partner_two_first_name text,
  add column if not exists partner_two_middle_name text,
  add column if not exists partner_two_last_name text,
  add column if not exists updated_at timestamptz not null default now();

update public.wedding_events
set
  partner_one_first_name = coalesce(partner_one_first_name, partner_one),
  partner_one_last_name = coalesce(partner_one_last_name, ''),
  partner_two_first_name = coalesce(partner_two_first_name, partner_two),
  partner_two_last_name = coalesce(partner_two_last_name, '')
where partner_one_first_name is null or partner_two_first_name is null;

alter table public.published_sites enable row level security;

drop policy if exists "published sites owner access" on public.published_sites;
create policy "published sites owner access" on public.published_sites
  for all to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and (p.owner_id = auth.uid() or public.is_admin())
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id and (p.owner_id = auth.uid() or public.is_admin())
    )
  );

create or replace function public.get_public_wedding_invitation(requested_slug text)
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
    and p.project_type = 'wedding'
  limit 1;
$$;

revoke all on function public.get_public_wedding_invitation(text) from public;
grant execute on function public.get_public_wedding_invitation(text) to anon, authenticated;

