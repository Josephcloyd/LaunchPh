import type { Metadata } from "next";
import { AdminDashboardShell, AdminPageHeader } from "@/components/admin-dashboard-shell";
import { loadAdminTemplates } from "@/features/admin/admin-data";
import { FailedNotice } from "@/features/admin/admin-overview";
import { AdminTemplates } from "@/features/admin/admin-pages";
import { requireAdminPage } from "@/features/admin/require-admin";

export const metadata: Metadata = { title: "Templates · Administrator", robots: { index: false, follow: false } };

export default async function AdminTemplatesPage() {
  const { supabase, name } = await requireAdminPage("/admin/templates");
  const { rows, usage, failed } = await loadAdminTemplates(supabase);
  return <AdminDashboardShell adminName={name} current="/admin/templates"><div className="adm">
    <AdminPageHeader title="Templates" description="The designs customers start from, and how often each is used."/>
    <FailedNotice failed={failed}/>
    <AdminTemplates rows={rows} usage={usage}/>
  </div></AdminDashboardShell>;
}
