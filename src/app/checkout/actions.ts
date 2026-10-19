"use server";

import { normalizeReferralCode, referralMessages, type ReferralCheckResult } from "@/lib/referral";
import { createSupabaseServerClient } from "@/services/supabase-server";

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
