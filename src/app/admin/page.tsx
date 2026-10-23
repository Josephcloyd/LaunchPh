import type { Metadata } from "next";
import { AdminDashboardShell } from "@/components/admin-dashboard-shell";
import { loadAdminOverview } from "@/features/admin/admin-data";
import { AdminOverview } from "@/features/admin/admin-overview";
import { requireAdminPage } from "@/features/admin/require-admin";

export const metadata: Metadata = { title: "Administrator", robots: { index: false, follow: false } };

export default async function AdminPage() {
  const { supabase, name } = await requireAdminPage("/admin");
  const data = await loadAdminOverview(supabase);
  return <AdminDashboardShell adminName={name} current="/admin"><AdminOverview data={data} adminName={name}/></AdminDashboardShell>;
}
