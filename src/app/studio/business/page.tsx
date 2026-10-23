import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BusinessStudio } from "@/features/business/business-studio";
import { requireUser } from "@/services/supabase-server";

export const metadata: Metadata = { title: "Business Site Studio", description: "Create a one-page website for your local business." };

type StoredText = Record<string, unknown> | null | undefined;
const text = (source: StoredText, key: string) => typeof source?.[key] === "string" ? source[key] as string : "";

export default async function BusinessStudioPage({ searchParams }: PageProps<"/studio/business">) {
  const params = await searchParams;
  if (typeof params.project !== "string") redirect("/dashboard/projects/new?type=business");

  const { supabase, user } = await requireUser();
  const { data: project } = await supabase.from("projects").select("id, name").eq("id", params.project).eq("owner_id", user.id).eq("project_type", "business").maybeSingle();
  if (!project) redirect("/dashboard/projects");

  const { data: profile } = await supabase.from("business_profiles").select("business_name, business_type, tagline, about, services, address, map_url, contact_details, hours, social_links, booking_enabled").eq("project_id", project.id).maybeSingle();
  const contact = profile?.contact_details as StoredText;
  const hours = profile?.hours as StoredText;
  const socials = profile?.social_links as StoredText;

  // Sample content helps first-time owners see what a finished page looks like.
  return <BusinessStudio initialDraft={profile ? {
    projectId: project.id,
    projectName: project.name,
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
    bookingEnabled: profile.booking_enabled === true,
  } : {
    projectId: project.id,
    projectName: project.name,
    businessName: project.name,
    businessType: "Home bakery",
    tagline: "Freshly baked ensaymada, pandesal, and celebration cakes every day.",
    about: "We are a family-run bakery serving our neighborhood since 2015. Everything is baked fresh each morning using our lola's recipes.",
    services: "Ensaymada and pandesal\nCustom celebration cakes\nParty trays and pasalubong boxes\nSame-day pickup and delivery",
    phone: "0917 123 4567",
    email: "",
    hours: "Monday to Saturday, 6:00 AM – 7:00 PM\nSunday, 7:00 AM – 12:00 NN",
    address: "Mandaue City, Cebu",
    mapUrl: "",
    facebookUrl: "",
    instagramUrl: "",
    tiktokUrl: "",
    bookingEnabled: false,
  }}/>;
}
