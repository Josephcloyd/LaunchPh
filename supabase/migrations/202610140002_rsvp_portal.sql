create or replace function public.get_wedding_rsvp_invitation(invitation_token text)
returns table(
  guest_id uuid,
  display_name text,
  party_size integer,
  invitation_content jsonb,
  current_attending boolean,
  current_attendee_count integer,
  current_meal_notes text
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    g.id,
    g.display_name,
    g.party_size,
    pr.content,
    r.attending,
    r.attendee_count,
    r.meal_notes
  from public.wedding_guests g
  join public.projects p on p.id = g.project_id
  join public.published_sites ps on ps.project_id = p.id
  join public.project_revisions pr on pr.id = ps.active_revision_id and pr.project_id = p.id
  left join public.rsvps r on r.guest_id = g.id
  where g.token_hash = encode(digest(invitation_token, 'sha256'), 'hex')
    and length(invitation_token) between 32 and 200
    and p.project_type = 'wedding'
    and p.status = 'published'
    and ps.is_live = true
  limit 1;
$$;

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

revoke all on function public.get_wedding_rsvp_invitation(text) from public;
revoke all on function public.submit_wedding_rsvp(text, boolean, integer, text) from public;
grant execute on function public.get_wedding_rsvp_invitation(text) to anon, authenticated;
grant execute on function public.submit_wedding_rsvp(text, boolean, integer, text) to anon, authenticated;

