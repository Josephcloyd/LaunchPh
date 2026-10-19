import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AdminDashboardShell } from "@/components/admin-dashboard-shell";
import { AdminOverview } from "@/features/admin/admin-overview";
import { createSupabaseServerClient } from "@/services/supabase-server";

export const metadata: Metadata = { title: "Administrator", robots: { index: false, follow: false } };
export default async function AdminPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth?next=/admin");
  // Non-admins get a 404 so the admin area is not advertised.
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin !== true) notFound();
  return <AdminDashboardShell><AdminOverview/></AdminDashboardShell>;
}
