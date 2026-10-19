"use server";

import { z } from "zod";
import { createSupabaseServerClient } from "@/services/supabase-server";
import type { RsvpSubmissionResult } from "@/types/rsvp";

const rsvpSchema = z.object({
  token: z.string().min(32).max(200),
  attending: z.boolean(),
  attendeeCount: z.number().int().min(0).max(20),
  notes: z.string().trim().max(500),
});

export async function submitWeddingRsvp(input: unknown): Promise<RsvpSubmissionResult> {
  const parsed = rsvpSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check your response." };
  if (parsed.data.attending && parsed.data.attendeeCount < 1) return { ok: false, message: "Choose how many guests will attend." };
  if (!parsed.data.attending && parsed.data.attendeeCount !== 0) return { ok: false, message: "A declined invitation must have zero attendees." };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("submit_wedding_rsvp", {
    invitation_token: parsed.data.token,
    response_attending: parsed.data.attending,
    response_attendee_count: parsed.data.attendeeCount,
    response_meal_notes: parsed.data.notes,
  });
  if (error || data !== true) return { ok: false, message: "This response could not be saved. The invitation link may have expired." };
  return { ok: true, message: "Your RSVP has been sent to the couple." };
}

