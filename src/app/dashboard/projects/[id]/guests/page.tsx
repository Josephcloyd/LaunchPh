import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { GuestManager } from "@/features/wedding/guest-manager";
import { requireUser } from "@/services/supabase-server";
import type { WeddingGuestRecord } from "@/types/rsvp";

export default async function WeddingGuestsPage({ params }: PageProps<"/dashboard/projects/[id]/guests">) {
  const { id } = await params;
  const { supabase, user } = await requireUser();
  const { data: project } = await supabase.from("projects").select("id, name, status").eq("id", id).eq("owner_id", user.id).eq("project_type", "wedding").maybeSingle();
  if (!project) notFound();
  const [guestResult, siteResult] = await Promise.all([
    supabase.from("wedding_guests").select("id, display_name, party_size, created_at, rsvps(attending, attendee_count, meal_notes, responded_at)").eq("project_id", project.id).order("created_at", { ascending: true }),
    supabase.from("published_sites").select("is_live").eq("project_id", project.id).maybeSingle(),
  ]);
  return <div className="workspace-page"><header className="workspace-page-header"><div><Link className="back-link" href="/dashboard/projects"><ArrowLeft size={15}/> Projects</Link><p className="workspace-kicker">Wedding RSVPs</p><h1>{project.name}</h1><p>Prepare private invitation links and track every guest response.</p></div></header>{guestResult.error ? <div className="workspace-error"><h2>Guests could not be loaded.</h2><p>{guestResult.error.message}</p></div> : <GuestManager projectId={project.id} isPublished={project.status === "published" && siteResult.data?.is_live === true} guests={(guestResult.data ?? []) as unknown as WeddingGuestRecord[]}/>}</div>;
}

