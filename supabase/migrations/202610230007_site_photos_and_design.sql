-- Photos and style choices for invitations and business sites. Safe to apply more than once.

-- Each editor's style and photo choices: theme, font, layout, cover photo, gallery, logo.
-- Shapes are validated by the app (src/lib/site-design.ts).
alter table public.wedding_events add column if not exists design jsonb not null default '{}'::jsonb;
alter table public.business_profiles add column if not exists design jsonb not null default '{}'::jsonb;

-- Public bucket so published pages can show photos directly. Files live under the uploader's
-- own folder with random names: <user id>/<uuid>.webp. The browser resizes photos before upload.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-photos', 'site-photos', true, 3145728, array['image/webp', 'image/jpeg'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- How many photos an account has stored, for the upload quota.
create or replace function public.site_photo_count(uid uuid)
returns integer
language sql
stable
security definer
set search_path = public, storage
as $$
  select count(*)::integer from storage.objects o
  where o.bucket_id = 'site-photos' and o.name like uid::text || '/%';
$$;
revoke all on function public.site_photo_count(uuid) from public, anon;
grant execute on function public.site_photo_count(uuid) to authenticated, service_role;

drop policy if exists "site photos: owners upload to their folder" on storage.objects;
create policy "site photos: owners upload to their folder" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'site-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.site_photo_count(auth.uid()) < 150
  );

drop policy if exists "site photos: owners list their folder" on storage.objects;
create policy "site photos: owners list their folder" on storage.objects for select to authenticated
  using (bucket_id = 'site-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "site photos: owners delete from their folder" on storage.objects;
create policy "site photos: owners delete from their folder" on storage.objects for delete to authenticated
  using (bucket_id = 'site-photos' and (storage.foldername(name))[1] = auth.uid()::text);
