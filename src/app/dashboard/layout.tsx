import type { Metadata } from "next";
import { connection } from "next/server";
import { DashboardShell } from "@/components/dashboard-shell";
import { formatPersonName } from "@/lib/person-name";
import { requireUser } from "@/services/supabase-server";

export const metadata: Metadata = { title: "Workspace", robots: { index: false, follow: false } };

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  await connection();
  const { supabase, user } = await requireUser();
  const [{ data: profile }, { data: subscription }] = await Promise.all([
    supabase.from("profiles").select("first_name, middle_name, last_name, full_name").eq("id", user.id).maybeSingle(),
    supabase.from("subscriptions").select("status, pricing_plans(name)").eq("user_id", user.id).in("status", ["active", "trialing"]).maybeSingle(),
  ]);
  const name = formatPersonName({ firstName: profile?.first_name || user.user_metadata?.first_name, middleName: profile?.middle_name || user.user_metadata?.middle_name, lastName: profile?.last_name || user.user_metadata?.last_name }) || profile?.full_name?.trim() || user.user_metadata?.full_name || user.email?.split("@")[0] || "Creator";
  const initials = [profile?.first_name || user.user_metadata?.first_name, profile?.last_name || user.user_metadata?.last_name].filter(Boolean).map((part: string) => part[0]).join("").toUpperCase() || name.split(/\s+/).slice(0, 2).map((part: string) => part[0]).join("").toUpperCase();
  const planRelation = subscription?.pricing_plans as unknown as { name?: string } | null;
  return <DashboardShell user={{ name, initials, email: user.email ?? "", plan: planRelation?.name ?? "Free workspace" }}>{children}</DashboardShell>;
}
