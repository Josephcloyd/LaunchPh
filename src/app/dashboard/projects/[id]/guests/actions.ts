"use server";

import { createHash, randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/services/supabase-server";
import type { GuestMutationResult } from "@/types/rsvp";

const projectIdSchema = z.string().uuid();
const guestIdSchema = z.string().uuid();
const newGuestSchema = z.object({
  displayName: z.string().trim().min(1, "Enter the guest or family name.").max(120),
  partySize: z.coerce.number().int().min(1).max(20),
});

function createInvitationToken() {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  return { token, tokenHash };
}

async function requireOwnedWedding(projectId: string) {
  const parsedId = projectIdSchema.safeParse(projectId);
  if (!parsedId.success) return null;
  const { supabase, user } = await requireUser();
  const { data } = await supabase.from("projects").select("id, name").eq("id", parsedId.data).eq("owner_id", user.id).eq("project_type", "wedding").maybeSingle();
  return data ? { supabase, user, project: data } : null;
}

export async function addWeddingGuest(projectId: string, input: unknown): Promise<GuestMutationResult> {
  const parsed = newGuestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the guest details." };
  const context = await requireOwnedWedding(projectId);
  if (!context) return { ok: false, message: "Wedding project not found." };

  const { token, tokenHash } = createInvitationToken();
  const { error } = await context.supabase.from("wedding_guests").insert({
    project_id: context.project.id,
    display_name: parsed.data.displayName,
    party_size: parsed.data.partySize,
    token_hash: tokenHash,
  });
  if (error) return { ok: false, message: "The guest could not be added." };

  await context.supabase.from("activity_logs").insert({ user_id: context.user.id, project_id: context.project.id, event_type: "wedding_guest_added", summary: `Added ${parsed.data.displayName} to the guest list.` });
  revalidatePath(`/dashboard/projects/${context.project.id}/guests`);
  return { ok: true, message: "Guest added. Copy the private invitation link now.", invitePath: `/rsvp/${token}` };
}

export async function regenerateWeddingGuestLink(projectId: string, guestId: string): Promise<GuestMutationResult> {
  const parsedGuestId = guestIdSchema.safeParse(guestId);
  if (!parsedGuestId.success) return { ok: false, message: "Invalid guest." };
  const context = await requireOwnedWedding(projectId);
  if (!context) return { ok: false, message: "Wedding project not found." };

  const { token, tokenHash } = createInvitationToken();
  const { data, error } = await context.supabase.from("wedding_guests").update({ token_hash: tokenHash }).eq("id", parsedGuestId.data).eq("project_id", context.project.id).select("display_name").maybeSingle();
  if (error || !data) return { ok: false, message: "A new link could not be created." };

  await context.supabase.from("activity_logs").insert({ user_id: context.user.id, project_id: context.project.id, event_type: "wedding_guest_link_reset", summary: `Created a new private invitation link for ${data.display_name}.` });
  return { ok: true, message: "New private link created. The previous link no longer works.", invitePath: `/rsvp/${token}` };
}

export async function deleteWeddingGuest(projectId: string, guestId: string): Promise<GuestMutationResult> {
  const parsedGuestId = guestIdSchema.safeParse(guestId);
  if (!parsedGuestId.success) return { ok: false, message: "Invalid guest." };
  const context = await requireOwnedWedding(projectId);
  if (!context) return { ok: false, message: "Wedding project not found." };

  const { data, error } = await context.supabase.from("wedding_guests").delete().eq("id", parsedGuestId.data).eq("project_id", context.project.id).select("display_name").maybeSingle();
  if (error || !data) return { ok: false, message: "The guest could not be removed." };

  await context.supabase.from("activity_logs").insert({ user_id: context.user.id, project_id: context.project.id, event_type: "wedding_guest_removed", summary: `Removed ${data.display_name} from the guest list.` });
  revalidatePath(`/dashboard/projects/${context.project.id}/guests`);
  return { ok: true, message: "Guest removed." };
}

