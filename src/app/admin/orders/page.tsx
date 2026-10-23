import type { Metadata } from "next";
import { AdminDashboardShell, AdminPageHeader } from "@/components/admin-dashboard-shell";
import { loadAdminOrders } from "@/features/admin/admin-data";
import { FailedNotice } from "@/features/admin/admin-overview";
import { AdminOrders } from "@/features/admin/admin-pages";
import { requireAdminPage } from "@/features/admin/require-admin";

export const metadata: Metadata = { title: "Orders · Administrator", robots: { index: false, follow: false } };

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  const { supabase, name } = await requireAdminPage("/admin/orders");
  const show = String((await searchParams).show ?? "all");
  const { rows, failed } = await loadAdminOrders(supabase);
  return <AdminDashboardShell adminName={name} current="/admin/orders"><div className="adm">
    <AdminPageHeader title="Orders" description="Every order customers placed, with how they paid and its status."/>
    <FailedNotice failed={failed}/>
    <AdminOrders rows={rows} show={show}/>
  </div></AdminDashboardShell>;
}
