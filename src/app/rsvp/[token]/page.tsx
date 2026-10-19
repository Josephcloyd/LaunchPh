import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Brand } from "@/components/brand";
import { DebutSouvenir } from "@/components/debut-souvenir";
import { MadeByCredit } from "@/components/made-by-credit";
import { WeddingInvitation } from "@/components/wedding-invitation";
import { RsvpForm } from "@/features/wedding/rsvp-form";
import { formatEventDate, hasEventDateArrived } from "@/lib/event-date";
import { formatPersonName } from "@/lib/person-name";
import { weddingInvitationSchema } from "@/lib/wedding-schema";
import { createSupabaseServerClient } from "@/services/supabase-server";

export const metadata: Metadata = { title: "RSVP", description: "Respond to a private invitation.", robots: { index: false, follow: false } };
type RsvpInvitationRow = { display_name: string; party_size: number; invitation_content: unknown; current_attending: boolean | null; current_attendee_count: number | null; current_meal_notes: string | null };

export default async function RsvpPage({ params }: PageProps<"/rsvp/[token]">) {
  const { token } = await params;
  if (token.length < 32 || token.length > 200) notFound();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_wedding_rsvp_invitation", { invitation_token: token }).maybeSingle();
  const row = data as RsvpInvitationRow | null;
  if (error || !row) notFound();
  const invitation = weddingInvitationSchema.safeParse(row.invitation_content);
  if (!invitation.success) notFound();
  const content = invitation.data;
  // After a debut, each guest's private link also carries a keepsake with their name.
  const souvenir = content.eventKind === "debut" && hasEventDateArrived(content.date) ? <DebutSouvenir
    celebrantName={formatPersonName({ firstName: content.celebrantFirstName, middleName: content.celebrantMiddleName, lastName: content.celebrantLastName })}
    displayDate={formatEventDate(content.date)}
    message={content.souvenirMessage}
    photoAlbumUrl={content.photoAlbumUrl}
    guestName={row.display_name}
  /> : null;
  return <main className="rsvp-public-page"><div className="published-wedding-brand"><Brand href="/"/></div><WeddingInvitation {...content}/>{souvenir}<RsvpForm token={token} displayName={row.display_name} partySize={row.party_size} initialAttending={row.current_attending} initialAttendeeCount={row.current_attendee_count} initialNotes={row.current_meal_notes ?? ""}/><MadeByCredit prefix="Private RSVP"/></main>;
}
