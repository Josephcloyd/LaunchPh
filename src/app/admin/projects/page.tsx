import type { Metadata } from "next";
import { AdminDashboardShell, AdminPageHeader } from "@/components/admin-dashboard-shell";
import { loadAdminProjects } from "@/features/admin/admin-data";
import { FailedNotice } from "@/features/admin/admin-overview";
import { AdminProjects } from "@/features/admin/admin-pages";
import { requireAdminPage } from "@/features/admin/require-admin";

export const metadata: Metadata = { title: "Projects · Administrator", robots: { index: false, follow: false } };

export default async function AdminProjectsPage({ searchParams }: PageProps<"/admin/projects">) {
  const { supabase, name } = await requireAdminPage("/admin/projects");
  const show = String((await searchParams).show ?? "all");
  const { rows, mix, failed } = await loadAdminProjects(supabase);
  return <AdminDashboardShell adminName={name} current="/admin/projects"><div className="adm">
    <AdminPageHeader title="Projects" description="Every invitation and website customers have created, newest activity first."/>
    <FailedNotice failed={failed}/>
    <AdminProjects rows={rows} mix={mix} show={["published", "draft"].includes(show) ? show : "all"} now={new Date().getTime()}/>
  </div></AdminDashboardShell>;
}
