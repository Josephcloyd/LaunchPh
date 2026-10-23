"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requestStatuses } from "@/features/admin/admin-data";
import { siteSlug } from "@/lib/slug";
import { appUrl, sendEmail } from "@/services/email";
import { buildSiteContent } from "@/services/site-content";
import { createSupabaseAdminClient } from "@/services/supabase-admin";
import { createSupabaseServerClient } from "@/services/supabase-server";
import type { MutationResult } from "@/types/workspace";

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: isAdmin } = await supabase.rpc("is_admin");
  return isAdmin === true ? user : null;
}

async function customerEmail(userId: string) {
  const { data } = await createSupabaseAdminClient().auth.admin.getUserById(userId);
  return data.user?.email ?? null;
}

const longDate = (iso: string) => new Intl.DateTimeFormat("en-PH", { dateStyle: "long", timeZone: "Asia/Manila" }).format(new Date(iso));
const orderId = z.string().uuid();

// Confirm only after checking that the money arrived in the account: this marks the order paid
// and publishes (or extends) the customer's site.
export async function confirmPayment(id: string): Promise<MutationResult> {
  const reviewer = await requireAdmin();
  if (!reviewer) return { ok: false, message: "Only admins can confirm payments." };
  if (!orderId.safeParse(id).success) return { ok: false, message: "Order not found." };
  const admin = createSupabaseAdminClient();

  const { data: order } = await admin.from("orders").select("user_id, reference, order_items(project_id, projects(project_type))").eq("id", id).maybeSingle();
  const item = Array.isArray(order?.order_items) ? order.order_items[0] : order?.order_items;
  if (!order || !item?.project_id) return { ok: false, message: "Order not found." };
  const built = await buildSiteContent(admin, item.project_id);
  if (!built.ok) return { ok: false, message: `${built.message}. Ask the customer to finish and save it, then confirm.` };

  const { data, error } = await admin.rpc("confirm_manual_order", {
    target_order_id: id,
    reviewer_id: reviewer.id,
    content: built.content,
    new_slug: siteSlug(...built.slugParts),
  }).single<{ slug: string; paid_until: string | null }>();
  if (error || !data) {
    const reused = error?.code === "23505" || error?.message.includes("duplicate key");
    return { ok: false, message: reused ? "That payment reference was already used for another order. Check your account before confirming." : error?.message ?? "The payment couldn’t be confirmed." };
  }

  const project = Array.isArray(item.projects) ? item.projects[0] : item.projects;
  const isBusiness = project?.project_type === "business";
  const liveUrl = appUrl(`/${isBusiness ? "site" : "wedding"}/${data.slug}`);
  const to = await customerEmail(order.user_id);
  if (to) {
    await sendEmail({
      to,
      subject: isBusiness ? "Your business site is live" : "Your invitation is live",
      lines: [
        `We’ve confirmed your payment for order ${order.reference}. Thank you!`,
        isBusiness && data.paid_until ? `Your business site is online and paid until ${longDate(data.paid_until)}. We’ll email you before then so you can renew.` : "Your invitation is online now. Changes you save in the editor appear on it right away.",
      ],
      action: { label: isBusiness ? "View your site" : "View your invitation", url: liveUrl },
    });
  }
  revalidatePath("/admin");
  return { ok: true, message: `Confirmed ${order.reference}. Live at ${liveUrl}` };
}

const rejectSchema = z.object({ id: orderId, note: z.string().trim().min(3, "Say briefly why, for the customer.").max(300) });

export async function rejectPayment(id: string, note: string): Promise<MutationResult> {
  const reviewer = await requireAdmin();
  if (!reviewer) return { ok: false, message: "Only admins can reject payments." };
  const parsed = rejectSchema.safeParse({ id, note });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the reason." };
  const admin = createSupabaseAdminClient();
  const { data: order } = await admin.from("orders")
    .update({ status: "failed", review_note: parsed.data.note, reviewed_at: new Date().toISOString(), reviewed_by: reviewer.id })
    .eq("id", parsed.data.id).eq("status", "pending")
    .select("user_id, reference, order_items(project_id)").maybeSingle();
  if (!order) return { ok: false, message: "This order is no longer waiting for review." };

  const item = Array.isArray(order.order_items) ? order.order_items[0] : order.order_items;
  const to = await customerEmail(order.user_id);
  if (to) {
    await sendEmail({
      to,
      subject: `We couldn’t confirm your payment for ${order.reference}`,
      lines: [`We couldn’t confirm the payment for order ${order.reference}.`, `Reason: ${parsed.data.note}`, "If you’ve already paid, reply to this email with a screenshot of your receipt, or start a new order."],
      action: item?.project_id ? { label: "Go to my projects", url: appUrl("/dashboard/projects") } : undefined,
    });
  }
  revalidatePath("/admin");
  return { ok: true, message: `Rejected ${order.reference}. The customer was told why.` };
}

const requestTables = { website: "website_inquiries", job: "job_application_inquiries", support: "support_tickets" } as const;

// Move an inquiry or ticket along (e.g. new → contacted → closed). Runs with the admin's own
// session; RLS lets admins update these tables.
export async function updateRequestStatus(kind: string, id: string, status: string): Promise<MutationResult> {
  if (!(await requireAdmin())) return { ok: false, message: "Only admins can update requests." };
  if (!(kind in requestTables) || !orderId.safeParse(id).success) return { ok: false, message: "Request not found." };
  const requestKind = kind as keyof typeof requestTables;
  if (!requestStatuses[requestKind].includes(status)) return { ok: false, message: "That status isn’t allowed." };
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from(requestTables[requestKind]).update({ status, updated_at: new Date().toISOString() }).eq("id", id).select("id").maybeSingle();
  if (error || !data) return { ok: false, message: "The status couldn’t be changed." };
  revalidatePath("/admin");
  revalidatePath("/admin/requests");
  return { ok: true, message: `Marked as ${status}.` };
}

const refundSchema = z.object({ id: orderId, note: z.string().trim().min(3, "Say briefly why, for your records and the customer.").max(300) });

// Record a refund after sending the money back by GCash, Maya, or bank. A refunded invitation is
// unpublished, as the Refund Policy says. Business site plans keep their paid-until date; change
// it in Supabase if the refund should shorten the plan.
export async function refundOrder(id: string, note: string): Promise<MutationResult> {
  const reviewer = await requireAdmin();
  if (!reviewer) return { ok: false, message: "Only admins can refund orders." };
  const parsed = refundSchema.safeParse({ id, note });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the reason." };
  const admin = createSupabaseAdminClient();
  const { data: order } = await admin.from("orders")
    .update({ status: "refunded", review_note: `Refunded: ${parsed.data.note}`, reviewed_at: new Date().toISOString(), reviewed_by: reviewer.id })
    .eq("id", parsed.data.id).in("status", ["paid", "partially_refunded"])
    .select("user_id, reference, order_items(project_id, projects(project_type))").maybeSingle();
  if (!order) return { ok: false, message: "Only paid orders can be refunded." };

  const item = Array.isArray(order.order_items) ? order.order_items[0] : order.order_items;
  const project = Array.isArray(item?.projects) ? item.projects[0] : item?.projects;
  const isInvitation = project?.project_type === "wedding";
  if (isInvitation && item?.project_id) {
    await admin.from("published_sites").update({ is_live: false, updated_at: new Date().toISOString() }).eq("project_id", item.project_id);
    await admin.from("projects").update({ status: "draft", updated_at: new Date().toISOString() }).eq("id", item.project_id);
  }
  await admin.from("notifications").insert({ user_id: order.user_id, notification_type: "order_refunded", title: "Refund sent", body: `Order ${order.reference} was refunded.${isInvitation ? " The invitation is no longer published." : ""}`, action_url: "/dashboard/billing" });
  const to = await customerEmail(order.user_id);
  if (to) await sendEmail({ to, subject: `Refund for order ${order.reference}`, lines: [`We’ve refunded order ${order.reference}.`, `Note: ${parsed.data.note}`, ...(isInvitation ? ["The invitation has been unpublished. Your content is still in your account."] : [])], action: { label: "View billing", url: appUrl("/dashboard/billing") } });
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  return { ok: true, message: `Refunded ${order.reference}.${isInvitation ? " The invitation was unpublished." : " The plan's paid-until date is unchanged."}` };
}
