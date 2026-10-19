// A new customer who uses someone's referral code receives this discount once,
// on any product. Subscriptions receive it on the first month only.
export const REFERRAL_DISCOUNT_PESOS = 50;
export const REFERRAL_COOKIE = "launchph_ref";
export const REFERRAL_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export function normalizeReferralCode(value: unknown) {
  if (typeof value !== "string") return null;
  const code = value.trim().toUpperCase();
  return /^[A-Z0-9]{8}$/.test(code) ? code : null;
}

export type ReferralCheckResult = { ok: true; code: string; message: string } | { ok: false; message: string };

export const referralMessages: Record<string, string> = {
  valid: `Referral code applied. You save ₱${REFERRAL_DISCOUNT_PESOS}.`,
  not_found: "That referral code was not found. Check the spelling and try again.",
  own_code: "You can’t use your own referral code. Share it with a friend instead.",
  returning_customer: "Referral discounts are for first-time customers only.",
};
