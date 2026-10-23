"use server";

import { revalidatePath } from "next/cache";
import { businessDraftSchema } from "@/lib/business-schema";
import { refreshLiveContent } from "@/services/site-content";
import { requireUser } from "@/services/supabase-server";
import type { BusinessDraftSaveResult } from "@/types/business";

export async function saveBusinessDraft(input: unknown): Promise<BusinessDraftSaveResult> {
  const parsed = businessDraftSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the business details." };
  }

  const { supabase, user } = await requireUser();
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", parsed.data.projectId)
    .eq("owner_id", user.id)
    .eq("project_type", "business")
    .maybeSingle();

  if (!project) return { ok: false, message: "Business project not found." };

  const savedAt = new Date().toISOString();
  const site = parsed.data;
  const { error } = await supabase.from("business_profiles").upsert({
    project_id: project.id,
    business_name: site.businessName,
    business_type: site.businessType || null,
    tagline: site.tagline || null,
    about: site.about || null,
    services: site.services || null,
    address: site.address || null,
    map_url: site.mapUrl || null,
    contact_details: { phone: site.phone, email: site.email },
    hours: { text: site.hours },
    social_links: { facebook: site.facebookUrl, instagram: site.instagramUrl, tiktok: site.tiktokUrl },
    booking_enabled: site.bookingEnabled,
    updated_at: savedAt,
  }, { onConflict: "project_id" });

  if (error) return { ok: false, message: "Your changes could not be saved. Please try again." };

  await supabase.from("projects").update({ updated_at: savedAt }).eq("id", project.id).eq("owner_id", user.id);
  // Once paid and live, saved changes appear on the public page right away.
  await refreshLiveContent(supabase, project.id);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects");
  return { ok: true, savedAt };
}
