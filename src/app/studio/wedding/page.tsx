import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { WeddingStudio } from "@/features/wedding/wedding-studio";
import { readInvitationDesign, sampleInvitationDesign } from "@/lib/site-design";
import { requireUser } from "@/services/supabase-server";

export const metadata: Metadata = { title: "Invitation Studio", description: "Create and publish a personalized wedding or debut invitation." };
export default async function WeddingStudioPage({ searchParams }: PageProps<"/studio/wedding">) {
  const params = await searchParams;
  if (typeof params.project !== "string") redirect("/dashboard/projects/new");

  const { supabase, user } = await requireUser();
  const { data: project } = await supabase.from("projects").select("id, name").eq("id", params.project).eq("owner_id", user.id).eq("project_type", "wedding").maybeSingle();
  if (!project) redirect("/dashboard/projects");

  const { data: event } = await supabase.from("wedding_events").select("event_kind, partner_one_first_name, partner_one_middle_name, partner_one_last_name, partner_two_first_name, partner_two_middle_name, partner_two_last_name, celebrant_first_name, celebrant_middle_name, celebrant_last_name, event_date, venue_name, map_url, story, souvenir_message, photo_album_url, design").eq("project_id", project.id).maybeSingle();
  const date = event?.event_date
    ? new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(event.event_date))
    : "2026-12-18";
  // New projects created as a debut pass ?kind=debut until their first save.
  const eventKind = event?.event_kind === "debut" || (!event && params.kind === "debut") ? "debut" : "wedding";

  return <WeddingStudio initialDraft={{
    projectId: project.id,
    projectName: project.name,
    eventKind,
    brideFirstName: event?.partner_one_first_name ?? "Lea",
    brideMiddleName: event?.partner_one_middle_name ?? "",
    brideLastName: event?.partner_one_last_name ?? "Mendoza",
    groomFirstName: event?.partner_two_first_name ?? "Miguel",
    groomMiddleName: event?.partner_two_middle_name ?? "",
    groomLastName: event?.partner_two_last_name ?? "Santos",
    celebrantFirstName: event?.celebrant_first_name ?? "Bea",
    celebrantMiddleName: event?.celebrant_middle_name ?? "",
    celebrantLastName: event?.celebrant_last_name ?? "Reyes",
    date,
    venue: event?.venue_name ?? "Hillcreek Gardens, Tagaytay",
    mapUrl: event?.map_url ?? "",
    story: event?.story ?? (eventKind === "debut"
      ? "Eighteen years of family, friends, and memories — join us for an evening of roses, candles, and celebration."
      : "After seven years, three cities, and countless cups of coffee, we’re finally saying yes to forever."),
    souvenirMessage: event?.souvenir_message ?? "Thank you for being part of my eighteenth birthday. Your presence made the night unforgettable.",
    photoAlbumUrl: event?.photo_album_url ?? "",
    // New drafts start with sample photos so owners can see the design; they replace them.
    design: event ? readInvitationDesign(event.design) : sampleInvitationDesign(eventKind),
  }} userId={user.id}/>;
}
