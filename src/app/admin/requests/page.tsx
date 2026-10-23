import type { Metadata } from "next";
import { AdminDashboardShell, AdminPageHeader } from "@/components/admin-dashboard-shell";
import { loadAdminRequests } from "@/features/admin/admin-data";
import { FailedNotice } from "@/features/admin/admin-overview";
import { AdminRequests } from "@/features/admin/admin-pages";
import { requireAdminPage } from "@/features/admin/require-admin";

export const metadata: Metadata = { title: "Requests · Administrator", robots: { index: false, follow: false } };

export default async function AdminRequestsPage({ searchParams }: PageProps<"/admin/requests">) {
  const { supabase, name } = await requireAdminPage("/admin/requests");
  const params = await searchParams;
  const kind = ["website", "job", "support"].includes(String(params.kind)) ? String(params.kind) : "all";
  const { rows, openCount, failed } = await loadAdminRequests(supabase);
  return <AdminDashboardShell adminName={name} current="/admin/requests"><div className="adm">
    <AdminPageHeader title="Requests" description={`Custom-website and job-application inquiries, and support tickets. ${openCount} open.`}/>
    <FailedNotice failed={failed}/>
    <AdminRequests rows={rows} kind={kind} show={params.show === "all" ? "all" : "open"}/>
  </div></AdminDashboardShell>;
}
