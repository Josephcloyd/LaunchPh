-- Deleting an account failed once the customer had saved any invitation revision:
-- project_revisions.created_by referenced the profile with no delete rule, which blocked the
-- delete before the cascade through projects could remove the revisions.
-- Found by the two-account isolation test (LAUNCH_CHECKLIST Phase 0). Safe to apply more than once.

-- Revisions belong to the owner's project, so they go with the account.
alter table public.project_revisions drop constraint if exists project_revisions_created_by_fkey;
alter table public.project_revisions
  add constraint project_revisions_created_by_fkey
  foreign key (created_by) references public.profiles(id) on delete cascade;

-- Keep security history for the project, but drop the link to a deleted person.
alter table public.security_events drop constraint if exists security_events_user_id_fkey;
alter table public.security_events
  add constraint security_events_user_id_fkey
  foreign key (user_id) references public.profiles(id) on delete set null;

-- orders.user_id is left as is and still blocks deletion: payment records likely need keeping
-- for tax and refunds, so account deletion (Phase 5) should anonymise the profile rather than
-- delete it when the customer has orders.
