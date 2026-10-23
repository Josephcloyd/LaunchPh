"use server";

import { revalidatePath } from "next/cache";
import { formatPersonName } from "@/lib/person-name";
import { weddingDraftSchema } from "@/lib/wedding-schema";
import { refreshLiveContent } from "@/services/site-content";
import { requireUser } from "@/services/supabase-server";
import type { WeddingDraftSaveResult } from "@/types/wedding";

export async function saveWeddingDraft(input: unknown): Promise<WeddingDraftSaveResult> {
  const parsed = weddingDraftSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the invitation details." };
  }

  const { supabase, user } = await requireUser();
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", parsed.data.projectId)
    .eq("owner_id", user.id)
    .eq("project_type", "wedding")
    .maybeSingle();

  if (!project) return { ok: false, message: "Wedding project not found." };

  const savedAt = new Date().toISOString();
  const bride = formatPersonName({
    firstName: parsed.data.brideFirstName,
    middleName: parsed.data.brideMiddleName,
    lastName: parsed.data.brideLastName,
  });
  const groom = formatPersonName({
    firstName: parsed.data.groomFirstName,
    middleName: parsed.data.groomMiddleName,
    lastName: parsed.data.groomLastName,
  });

  const { error } = await supabase.from("wedding_events").upsert({
    project_id: project.id,
    event_kind: parsed.data.eventKind,
    celebrant_first_name: parsed.data.celebrantFirstName || null,
    celebrant_middle_name: parsed.data.celebrantMiddleName || null,
    celebrant_last_name: parsed.data.celebrantLastName || null,
    partner_one: bride,
    partner_two: groom,
    partner_one_first_name: parsed.data.brideFirstName,
    partner_one_middle_name: parsed.data.brideMiddleName || null,
    partner_one_last_name: parsed.data.brideLastName,
    partner_two_first_name: parsed.data.groomFirstName,
    partner_two_middle_name: parsed.data.groomMiddleName || null,
    partner_two_last_name: parsed.data.groomLastName,
    event_date: `${parsed.data.date}T00:00:00+08:00`,
    venue_name: parsed.data.venue,
    map_url: parsed.data.mapUrl || null,
    story: parsed.data.story,
    souvenir_message: parsed.data.souvenirMessage || null,
    photo_album_url: parsed.data.photoAlbumUrl || null,
    rsvp_enabled: false,
    photo_uploads_enabled: false,
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

