import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AdminDashboardShell } from "@/components/admin-dashboard-shell";
import { loadAdminOverview } from "@/features/admin/admin-data";
import { AdminOverview } from "@/features/admin/admin-overview";
import { formatPersonName } from "@/lib/person-name";
import { createSupabaseServerClient } from "@/services/supabase-server";

export const metadata: Metadata = { title: "Administrator", robots: { index: false, follow: false } };
export default async function AdminPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth?next=/admin");
  // Non-admins get a 404 so the admin area is not advertised.
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin !== true) notFound();

  const [{ data: profile }, data] = await Promise.all([
    supabase.from("profiles").select("first_name, middle_name, last_name, full_name").eq("id", user.id).maybeSingle(),
    loadAdminOverview(supabase),
  ]);
  const name = formatPersonName({ firstName: profile?.first_name, middleName: profile?.middle_name, lastName: profile?.last_name }) || profile?.full_name?.trim() || user.email?.split("@")[0] || "Admin";

  return <AdminDashboardShell adminName={name}><AdminOverview data={data} adminName={name}/></AdminDashboardShell>;
}
