import "server-only";

import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { createSupabaseAdminClient } from "@/services/supabase-admin";

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

async function clientIp() {
  const requestHeaders = await headers();
  return requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || requestHeaders.get("x-real-ip")?.trim() || "unknown";
}

// Checks the Turnstile token the widget adds to the form. Without a secret configured,
// development lets submissions through and production refuses them.
export async function verifyTurnstile(token: FormDataEntryValue | null) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return process.env.NODE_ENV !== "production";
  if (typeof token !== "string" || !token || token.length > 2048) return false;
  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      body: new URLSearchParams({ secret, response: token, remoteip: await clientIp() }),
      cache: "no-store",
    });
    const result = (await response.json()) as { success?: boolean };
    return result.success === true;
  } catch {
    return false;
  }
}

// Allows `maxAttempts` per visitor per window and records this attempt. Visitors are identified
// by an HMAC of their IP keyed with a server secret, so raw IPs are never stored. Fails closed.
export async function withinRateLimit(bucket: string, maxAttempts: number, windowSeconds: number) {
  const subject = createHmac("sha256", process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").update(await clientIp()).digest("hex");
  const { data, error } = await createSupabaseAdminClient().rpc("consume_rate_limit", {
    bucket,
    subject,
    max_attempts: maxAttempts,
    window_seconds: windowSeconds,
  });
  return !error && data === true;
}
