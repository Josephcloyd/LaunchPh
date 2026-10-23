import type { Metadata } from "next";
import { AdminDashboardShell, AdminPageHeader } from "@/components/admin-dashboard-shell";
import { loadAdminCustomers } from "@/features/admin/admin-data";
import { FailedNotice } from "@/features/admin/admin-overview";
import { AdminCustomers } from "@/features/admin/admin-pages";
import { requireAdminPage } from "@/features/admin/require-admin";

export const metadata: Metadata = { title: "Customers · Administrator", robots: { index: false, follow: false } };

export default async function AdminCustomersPage() {
  const { supabase, name } = await requireAdminPage("/admin/customers");
  const { rows, failed } = await loadAdminCustomers(supabase);
  return <AdminDashboardShell adminName={name} current="/admin/customers"><div className="adm">
    <AdminPageHeader title="Customers" description={`${rows.length} ${rows.length === 1 ? "account" : "accounts"}, newest first.`}/>
    <FailedNotice failed={failed}/>
    <AdminCustomers rows={rows}/>
  </div></AdminDashboardShell>;
}
