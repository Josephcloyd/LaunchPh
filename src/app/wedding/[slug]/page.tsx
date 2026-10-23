import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Brand } from "@/components/brand";
import { DebutSouvenir } from "@/components/debut-souvenir";
import { MadeByCredit } from "@/components/made-by-credit";
import { WeddingInvitation } from "@/components/wedding-invitation";
import { formatEventDate, hasEventDateArrived } from "@/lib/event-date";
import { formatPersonName } from "@/lib/person-name";
import { weddingInvitationSchema } from "@/lib/wedding-schema";
import { createSupabaseServerClient } from "@/services/supabase-server";

export const metadata: Metadata = {
  title: "Invitation",
  description: "An invitation published with GetLaunch PH.",
  robots: { index: false, follow: false },
};

export default async function PublishedWeddingPage({ params }: PageProps<"/wedding/[slug]">) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_public_wedding_invitation", { requested_slug: slug }).maybeSingle();
  const row = data as { content?: unknown } | null;
  if (error || !row?.content || typeof row.content !== "object") notFound();

  const parsed = weddingInvitationSchema.safeParse(row.content);
  if (!parsed.success) notFound();
  const invitation = parsed.data;
  return <main className="published-wedding-page">
    <WeddingInvitation {...invitation}/>
    {invitation.eventKind === "debut" && hasEventDateArrived(invitation.date) && <DebutSouvenir
      celebrantName={formatPersonName({ firstName: invitation.celebrantFirstName, middleName: invitation.celebrantMiddleName, lastName: invitation.celebrantLastName })}
      displayDate={formatEventDate(invitation.date)}
      message={invitation.souvenirMessage}
      photoAlbumUrl={invitation.photoAlbumUrl}
    />}
    <footer className="published-wedding-brand"><Brand href="/"/><MadeByCredit/></footer>
  </main>;
}

