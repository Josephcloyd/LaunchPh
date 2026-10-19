-- Digital souvenirs for debut invitations: a thank-you keepsake card guests can
-- save, and an optional link to the celebrant's photo album.
alter table public.wedding_events
  add column if not exists souvenir_message text,
  add column if not exists photo_album_url text;
