"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/services/supabase-server";

const ticketSchema = z.object({ subject: z.string().trim().min(4).max(120), message: z.string().trim().min(15).max(3000) });

export type SupportTicketResult = { ok: true } | { ok: false; message: string };

export async function createSupportTicket(subject: string, message: string): Promise<SupportTicketResult> {
  const parsed = ticketSchema.safeParse({ subject, message });
  if (!parsed.success) return { ok: false, message: "Add a clear subject and at least 15 characters." };
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("support_tickets").insert({ user_id: user.id, subject: parsed.data.subject, message: parsed.data.message, status: "open", priority: "normal" });
  if (error) return { ok: false, message: error.message };
  await supabase.from("activity_logs").insert({ user_id: user.id, event_type: "support_ticket_created", summary: `Opened support request “${parsed.data.subject}”.` });
  return { ok: true };
}

export async function submitSupportTicket(formData: FormData) {
  const result = await createSupportTicket(String(formData.get("subject") ?? ""), String(formData.get("message") ?? ""));
  if (!result.ok) redirect(`/dashboard/support?error=${encodeURIComponent(result.message)}`);
  redirect("/dashboard/support?submitted=1");
}
