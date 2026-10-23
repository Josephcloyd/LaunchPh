import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { businessSiteSchema } from "@/lib/business-schema";
import { formatPersonName } from "@/lib/person-name";
import { weddingInvitationSchema } from "@/lib/wedding-schema";

type StoredText = Record<string, unknown> | null | undefined;
const text = (source: StoredText, key: string) => typeof source?.[key] === "string" ? source[key] as string : "";
const manilaDate = (value: string) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));

export type SiteContentResult =
  | { ok: true; content: Record<string, unknown>; slugParts: string[] }
  | { ok: false; message: string };

// The public snapshot of a project's saved draft, in the shape the public pages parse
// (weddingInvitationSchema / businessSiteSchema). Fails when the draft is incomplete.
export async function buildSiteContent(client: SupabaseClient, projectId: string): Promise<SiteContentResult> {
  const { data: project } = await client.from("projects").select("project_type").eq("id", projectId).maybeSingle();
  if (project?.project_type === "wedding") {
    const { data: event } = await client.from("wedding_events").select("event_kind, partner_one_first_name, partner_one_middle_name, partner_one_last_name, partner_two_first_name, partner_two_middle_name, partner_two_last_name, celebrant_first_name, celebrant_middle_name, celebrant_last_name, event_date, venue_name, map_url, story, souvenir_message, photo_album_url").eq("project_id", projectId).maybeSingle();
    if (!event) return { ok: false, message: "The invitation hasn’t been saved yet." };
    const parsed = weddingInvitationSchema.safeParse({
      eventKind: event.event_kind === "debut" ? "debut" : "wedding",
      brideFirstName: event.partner_one_first_name ?? "",
      brideMiddleName: event.partner_one_middle_name ?? "",
      brideLastName: event.partner_one_last_name ?? "",
      groomFirstName: event.partner_two_first_name ?? "",
      groomMiddleName: event.partner_two_middle_name ?? "",
      groomLastName: event.partner_two_last_name ?? "",
      celebrantFirstName: event.celebrant_first_name ?? "",
      celebrantMiddleName: event.celebrant_middle_name ?? "",
      celebrantLastName: event.celebrant_last_name ?? "",
      date: manilaDate(event.event_date),
      venue: event.venue_name ?? "",
      mapUrl: event.map_url ?? "",
      story: event.story ?? "",
      souvenirMessage: event.souvenir_message ?? "",
      photoAlbumUrl: event.photo_album_url ?? "",
    });
    if (!parsed.success) return { ok: false, message: `The invitation is incomplete: ${parsed.error.issues[0]?.message ?? "check its details"}` };
    const invitation = parsed.data;
    const slugParts = invitation.eventKind === "debut"
      ? [formatPersonName({ firstName: invitation.celebrantFirstName, lastName: invitation.celebrantLastName }), "debut"]
      : [invitation.brideFirstName, "and", invitation.groomFirstName];
    return { ok: true, content: invitation, slugParts };
  }

  if (project?.project_type === "business") {
    const { data: profile } = await client.from("business_profiles").select("business_name, business_type, tagline, about, services, address, map_url, contact_details, hours, social_links").eq("project_id", projectId).maybeSingle();
    if (!profile) return { ok: false, message: "The business site hasn’t been saved yet." };
    const contact = profile.contact_details as StoredText, hours = profile.hours as StoredText, socials = profile.social_links as StoredText;
    const parsed = businessSiteSchema.safeParse({
      businessName: profile.business_name,
      businessType: profile.business_type ?? "",
      tagline: profile.tagline ?? "",
      about: profile.about ?? "",
      services: profile.services ?? "",
      phone: text(contact, "phone"),
      email: text(contact, "email"),
      hours: text(hours, "text"),
      address: profile.address ?? "",
      mapUrl: profile.map_url ?? "",
      facebookUrl: text(socials, "facebook"),
      instagramUrl: text(socials, "instagram"),
      tiktokUrl: text(socials, "tiktok"),
    });
    if (!parsed.success) return { ok: false, message: `The business site is incomplete: ${parsed.error.issues[0]?.message ?? "check its details"}` };
    return { ok: true, content: parsed.data, slugParts: [parsed.data.businessName] };
  }

  return { ok: false, message: "This project can’t be published." };
}

// After the owner saves a live site, update the published snapshot so the change shows
// publicly. Runs with the owner's session; RLS limits it to their own project.
export async function refreshLiveContent(client: SupabaseClient, projectId: string) {
  const { data: site } = await client.from("published_sites").select("active_revision_id, is_live").eq("project_id", projectId).maybeSingle();
  if (!site?.is_live || !site.active_revision_id) return;
  const built = await buildSiteContent(client, projectId);
  if (!built.ok) return;
  await client.from("project_revisions").update({ content: built.content }).eq("id", site.active_revision_id).eq("project_id", projectId);
}
