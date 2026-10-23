"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { bookingStatuses } from "@/lib/booking";
import { requireUser } from "@/services/supabase-server";

const inputSchema = z.object({ projectId: z.string().uuid(), bookingId: z.string().uuid(), status: z.enum(bookingStatuses) });

export async function updateBookingStatus(projectId: string, bookingId: string, status: string): Promise<{ ok: boolean; message: string }> {
  const parsed = inputSchema.safeParse({ projectId, bookingId, status });
  if (!parsed.success) return { ok: false, message: "That status isn’t available." };
  const { supabase } = await requireUser();
  // RLS limits this to the owner's own bookings, and only the status can change.
  const { data, error } = await supabase.from("business_bookings")
    .update({ status: parsed.data.status, updated_at: new Date().toISOString() })
    .eq("id", parsed.data.bookingId).eq("project_id", parsed.data.projectId)
    .select("id");
  if (error || !data?.length) return { ok: false, message: "The booking could not be updated. Please try again." };
  revalidatePath(`/dashboard/projects/${parsed.data.projectId}/bookings`);
  return { ok: true, message: "Saved." };
}
