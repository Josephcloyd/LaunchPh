import "server-only";

import { createClient } from "@supabase/supabase-js";

// Service-role client: bypasses RLS. Only for writes the public must not make directly,
// such as inquiries after the Turnstile and rate limit checks.
export function createSupabaseAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set.");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
