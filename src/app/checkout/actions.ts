"use server";

import { z } from "zod";
import { POLICY_VERSION } from "@/lib/legal";
import { configuredPaymentAccounts } from "@/lib/payment-accounts";
import { normalizeReferralCode, referralMessages, type ReferralCheckResult } from "@/lib/referral";
import { withinRateLimit } from "@/services/abuse-protection";
import { appUrl, sendEmail } from "@/services/email";
import { createSupabaseAdminClient } from "@/services/supabase-admin";
import { createSupabaseServerClient, requireUser } from "@/services/supabase-server";
import type { MutationResult } from "@/types/workspace";

// Checks a code for display at checkout. Order creation must check it again on
// the server and compute the discount itself; never trust a discount sent by the browser.
export async function checkReferralCode(input: unknown): Promise<ReferralCheckResult> {
  const code = normalizeReferralCode(input);
  if (!code) return { ok: false, message: "Referral codes have 8 letters and numbers." };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("check_referral_code", { referral_code: code });
  if (error || typeof data !== "string") return { ok: false, message: "Referral codes can’t be checked right now. Please try again." };
  if (data !== "valid") return { ok: false, message: referralMessages[data] ?? referralMessages.not_found };
  return { ok: true, code, message: referralMessages.valid };
}

const paymentMethod = z.enum(["gcash", "maya", "bank"]);
const orderSchema = z.object({
  projectId: z.string().uuid(),
  plan: z.string().regex(/^[a-z0-9-]{3,40}$/),
  method: paymentMethod,
  referralCode: z.string().max(12).nullable(),
  acceptedPolicies: z.literal(true),
});

export type PlaceOrderResult = { ok: true; orderId: string; reference: string; totalCentavos: number } | { ok: false; message: string };

// Messages raised by create_manual_order that are safe to show the customer.
const orderMessages = ["Project not found.", "Choose a payment method.", "That plan is not available.", "That plan does not match this invitation.", "That plan does not match this site.", "This invitation is already paid for."];

export async function placeOrder(input: unknown): Promise<PlaceOrderResult> {
  const parsed = orderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: (input as { acceptedPolicies?: unknown } | null)?.acceptedPolicies !== true ? "Please tick the box to agree to the Terms of Service and Refund Policy." : "Choose a plan and a payment method." };
  const { user } = await requireUser();
  if (!configuredPaymentAccounts().some(account => account.method === parsed.data.method)) return { ok: false, message: "That payment method isn’t available yet." };
  if (!(await withinRateLimit("order", 20, 3600))) return { ok: false, message: "Too many orders in a short time. Please try again later." };

  // The database prices the order, so nothing sent by the browser affects the amount.
  const { data, error } = await createSupabaseAdminClient().rpc("create_manual_order", {
    customer_id: user.id,
    target_project_id: parsed.data.projectId,
    plan_slug: parsed.data.plan,
    method: parsed.data.method,
    referral: parsed.data.referralCode,
  }).single<{ order_id: string; reference: string; total_centavos: number }>();
  if (error || !data) return { ok: false, message: error && orderMessages.includes(error.message) ? error.message : "Your order couldn’t be created. Please try again." };
  // Evidence that the customer ticked "I agree" for this order, with the policy version.
  const { error: consentError } = await createSupabaseAdminClient().from("policy_acceptances").insert({ user_id: user.id, context: "checkout", policy_version: POLICY_VERSION, order_id: data.order_id });
  if (consentError) console.error("[checkout] Couldn't record policy acceptance:", consentError.message);
  // No revalidatePath here or below: it would re-render the whole checkout page before the
  // action finishes, leaving the next button disabled. Billing and admin render fresh anyway.
  return { ok: true, orderId: data.order_id, reference: data.reference, totalCentavos: data.total_centavos };
}

const referenceSchema = z.object({
  orderId: z.string().uuid(),
  method: paymentMethod,
  reference: z.string().trim().min(4, "Enter the reference number from your payment receipt.").max(60).regex(/^[A-Za-z0-9 -]+$/, "Use only letters, numbers, spaces, and dashes."),
});

export async function submitPaymentReference(input: unknown): Promise<MutationResult> {
  const parsed = referenceSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the reference number." };
  const { user } = await requireUser();
  const admin = createSupabaseAdminClient();
  // Customers can correct the reference while the order still awaits confirmation.
  const { data: order } = await admin.from("orders")
    .update({ customer_reference: parsed.data.reference, payment_method: parsed.data.method, submitted_at: new Date().toISOString() })
    .eq("id", parsed.data.orderId).eq("user_id", user.id).eq("status", "pending")
    .select("reference, total_centavos").maybeSingle();
  if (!order) return { ok: false, message: "This order can’t be updated. It may already be confirmed." };

  await admin.from("activity_logs").insert({ user_id: user.id, event_type: "payment_submitted", summary: `Sent payment details for order ${order.reference}.` });
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (adminEmail) {
    await sendEmail({
      to: adminEmail,
      subject: `Payment to confirm: ${order.reference}`,
      lines: [`A customer sent payment details for order ${order.reference} (₱${(order.total_centavos / 100).toLocaleString("en-PH")}).`, `${parsed.data.method.toUpperCase()} reference: ${parsed.data.reference}`, "Check that the money arrived in your account before confirming."],
      action: { label: "Review in admin", url: appUrl("/admin#payments") },
    });
  }
  return { ok: true, message: "Thanks! We’ll confirm your payment and email you when it’s live." };
}
