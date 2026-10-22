-- Rate limits and server-only writes for public submissions (LAUNCH_CHECKLIST Phase 0).
-- Safe to apply more than once.

-- One row per allowed attempt. Only the service role and security definer functions use it.
create table if not exists public.rate_limit_events (
  id bigint generated always as identity primary key,
  bucket text not null,
  subject text not null,
  created_at timestamptz not null default now()
);
create index if not exists rate_limit_events_lookup_idx on public.rate_limit_events(bucket, subject, created_at);
create index if not exists rate_limit_events_created_idx on public.rate_limit_events(created_at);
alter table public.rate_limit_events enable row level security;
revoke all on public.rate_limit_events from anon, authenticated;

-- Records an attempt and returns true, or returns false when `subject` already made
-- `max_attempts` attempts in `bucket` within the window. Subjects are opaque strings
-- (hashed IPs from the app, guest ids from submit_wedding_rsvp).
create or replace function public.consume_rate_limit(bucket text, subject text, max_attempts integer, window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  recent integer;
begin
  -- Serialise attempts for the same subject so parallel requests can't slip past the limit.
  perform pg_advisory_xact_lock(hashtextextended(bucket || ':' || subject, 0));

  delete from public.rate_limit_events e
  where e.bucket = consume_rate_limit.bucket and e.subject = consume_rate_limit.subject
    and e.created_at < now() - make_interval(secs => window_seconds);

  select count(*) into recent from public.rate_limit_events e
  where e.bucket = consume_rate_limit.bucket and e.subject = consume_rate_limit.subject;
  if recent >= max_attempts then
    return false;
  end if;

  insert into public.rate_limit_events (bucket, subject) values (bucket, subject);

  -- Occasionally clear out subjects that never came back.
  if random() < 0.01 then
    delete from public.rate_limit_events where created_at < now() - interval '2 days';
  end if;
  return true;
end;
$$;

revoke all on function public.consume_rate_limit(text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, text, integer, integer) to service_role;

-- Inquiries are now written only by the server, after Turnstile and a rate limit check,
-- so nobody can bypass the form by inserting through the API with the public key.
drop policy if exists "public can submit website inquiries" on public.website_inquiries;
drop policy if exists "public can submit job application inquiries" on public.job_application_inquiries;

-- Support tickets: at most 5 per person per hour, however they're submitted.
create or replace function public.limit_support_tickets()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user not in ('anon', 'authenticated') or public.is_admin() then
    return new;
  end if;
  if (select count(*) from public.support_tickets t
      where t.user_id = new.user_id and t.created_at > now() - interval '1 hour') >= 5 then
    raise exception 'You''ve sent several requests in the last hour. Please wait a little before sending another.'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke all on function public.limit_support_tickets() from public, anon, authenticated;
drop trigger if exists limit_support_tickets on public.support_tickets;
create trigger limit_support_tickets
  before insert on public.support_tickets
  for each row execute function public.limit_support_tickets();

-- RSVPs: same as 202610140002_rsvp_portal.sql, plus at most 10 responses per guest per hour,
-- enforced here because guests call this function directly.
create or replace function public.submit_wedding_rsvp(
  invitation_token text,
  response_attending boolean,
  response_attendee_count integer,
  response_meal_notes text
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  matched_guest_id uuid;
  matched_project_id uuid;
  matched_owner_id uuid;
  matched_display_name text;
  allowed_party_size integer;
begin
  if length(invitation_token) not between 32 and 200
    or response_attending is null
    or response_attendee_count is null
    or length(coalesce(response_meal_notes, '')) > 500 then
    return false;
  end if;

  select g.id, g.project_id, p.owner_id, g.display_name, g.party_size
  into matched_guest_id, matched_project_id, matched_owner_id, matched_display_name, allowed_party_size
  from public.wedding_guests g
  join public.projects p on p.id = g.project_id
  join public.published_sites ps on ps.project_id = p.id
  where g.token_hash = encode(digest(invitation_token, 'sha256'), 'hex')
    and p.project_type = 'wedding'
    and p.status = 'published'
    and ps.is_live = true
  limit 1;

  if matched_guest_id is null then return false; end if;
  if response_attending and (response_attendee_count < 1 or response_attendee_count > allowed_party_size) then return false; end if;
  if not response_attending and response_attendee_count <> 0 then return false; end if;
  if not public.consume_rate_limit('rsvp', matched_guest_id::text, 10, 3600) then return false; end if;

  insert into public.rsvps (guest_id, attending, attendee_count, meal_notes, responded_at)
  values (matched_guest_id, response_attending, response_attendee_count, nullif(trim(response_meal_notes), ''), now())
  on conflict (guest_id) do update set
    attending = excluded.attending,
    attendee_count = excluded.attendee_count,
    meal_notes = excluded.meal_notes,
    responded_at = excluded.responded_at;

  insert into public.activity_logs (user_id, project_id, event_type, summary)
  values (
    matched_owner_id,
    matched_project_id,
    'rsvp_received',
    matched_display_name || case when response_attending then ' accepted the invitation.' else ' declined the invitation.' end
  );

  return true;
end;
$$;

revoke all on function public.submit_wedding_rsvp(text, boolean, integer, text) from public;
grant execute on function public.submit_wedding_rsvp(text, boolean, integer, text) to anon, authenticated;
