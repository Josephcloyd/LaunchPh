import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { BookingManager, type BookingRecord } from "@/features/business/booking-manager";
import { requireUser } from "@/services/supabase-server";

export const metadata = { title: "Bookings" };

export default async function BusinessBookingsPage({ params }: PageProps<"/dashboard/projects/[id]/bookings">) {
  const { id } = await params;
  const { supabase, user } = await requireUser();
  const { data: project } = await supabase.from("projects").select("id, name").eq("id", id).eq("owner_id", user.id).eq("project_type", "business").maybeSingle();
  if (!project) notFound();
  const [bookingResult, profileResult] = await Promise.all([
    supabase.from("business_bookings").select("id, customer_name, phone, email, service, preferred_date, preferred_time, message, status, created_at").eq("project_id", project.id).order("created_at", { ascending: false }).limit(500),
    supabase.from("business_profiles").select("booking_enabled").eq("project_id", project.id).maybeSingle(),
  ]);
  return <div className="workspace-page"><header className="workspace-page-header"><div><Link className="back-link" href="/dashboard/projects"><ArrowLeft size={15}/> Projects</Link><p className="workspace-kicker">Bookings</p><h1>{project.name}</h1><p>Booking requests from your website. Call or message each customer to confirm, then update the status.</p></div></header>{bookingResult.error ? <div className="workspace-error"><h2>Bookings could not be loaded.</h2><p>Please refresh the page.</p></div> : <BookingManager projectId={project.id} enabled={profileResult.data?.booking_enabled === true} accountEmail={user.email ?? ""} bookings={(bookingResult.data ?? []) as BookingRecord[]}/>}</div>;
}
