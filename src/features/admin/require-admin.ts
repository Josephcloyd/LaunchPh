import "server-only";

import { notFound, redirect } from "next/navigation";
import { formatPersonName } from "@/lib/person-name";
import { createSupabaseServerClient } from "@/services/supabase-server";

// Every admin page starts here. Signed-out visitors go to sign-in; signed-in non-admins get a
// 404 so the admin area isn't advertised (the proxy does the same before the page renders).
export async function requireAdminPage(path: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth?next=${encodeURIComponent(path)}`);
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin !== true) notFound();

  const { data: profile } = await supabase.from("profiles").select("first_name, middle_name, last_name, full_name").eq("id", user.id).maybeSingle();
  const name = formatPersonName({ firstName: profile?.first_name, middleName: profile?.middle_name, lastName: profile?.last_name }) || profile?.full_name?.trim() || user.email?.split("@")[0] || "Admin";
  return { supabase, user, name };
}

export type AdminSupabase = Awaited<ReturnType<typeof requireAdminPage>>["supabase"];
