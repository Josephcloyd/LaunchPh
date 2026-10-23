import "server-only";

import type { AdminSupabase } from "@/features/admin/require-admin";
import { createSupabaseAdminClient } from "@/services/supabase-admin";

const PAID_STATUSES = ["paid", "partially_refunded"];
const MONTHS_SHOWN = 6;
const TIME_ZONE = "Asia/Manila";
const LIST_LIMIT = 200;

export type MonthRevenue = { key: string; label: string; centavos: number; orders: number };
export type RequestKind = "website" | "job" | "support";
export type InboxItem = { id: string; kind: RequestKind; title: string; detail: string; email: string | null; status: string; createdAt: string };
export type PendingPayment = { id: string; reference: string; customer: string; item: string; projectName: string; method: string; customerReference: string; totalCentavos: number; submittedAt: string };

// Statuses each kind of request can move through (as allowed by its table's check constraint).
export const requestStatuses: Record<RequestKind, string[]> = {
  website: ["new", "contacted", "scheduled", "closed"],
  job: ["new", "reviewing", "contacted", "closed"],
  support: ["open", "pending", "resolved", "closed"],
};
const isOpen = (status: string) => status !== "closed" && status !== "resolved";

/** "2026-10" for the calendar month a timestamp falls in, in Manila time. */
function manilaMonthKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit" }).format(date).slice(0, 7);
}

function lastMonths(now: Date): { key: string; label: string; start: Date }[] {
  const [year, month] = manilaMonthKey(now).split("-").map(Number);
  return Array.from({ length: MONTHS_SHOWN }, (_, i) => {
    const offset = MONTHS_SHOWN - 1 - i;
    const d = new Date(Date.UTC(year, month - 1 - offset, 1));
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    // Midnight on the 1st in Manila (UTC+8, no daylight saving).
    const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, -8));
    return { key, label: d.toLocaleDateString("en-PH", { month: "short", timeZone: "UTC" }), start };
  });
}

function fullName(profile: { full_name?: string | null; first_name?: string | null; last_name?: string | null } | null | undefined) {
  if (!profile) return "Unknown customer";
  return profile.full_name?.trim() || [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Unnamed customer";
}

/** Supabase returns a to-one embed as an object, but its untyped client claims an array. */
function one<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

/** Account emails live in Supabase Auth, not in profiles, so read them with the service role. */
async function loadEmails() {
  const emails = new Map<string, string>();
  const auth = createSupabaseAdminClient().auth.admin;
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await auth.listUsers({ page, perPage: 1000 });
    if (error) break;
    for (const user of data.users) if (user.email) emails.set(user.id, user.email);
    if (data.users.length < 1000) break;
  }
  return emails;
}

const websiteTypes: Record<string, string> = { local_business: "Local business", professional: "Professional", catalogue: "Catalogue", other: "Other" };

// ---------------------------------------------------------------- Overview

export type AdminOverviewData = {
  pendingPayments: PendingPayment[];
  revenue: MonthRevenue[];
  paidOrdersThisMonth: number;
  inbox: InboxItem[];
  openRequests: number;
  generatedAt: number;
  failed: string[];
};

export async function loadAdminOverview(supabase: AdminSupabase): Promise<AdminOverviewData> {
  const now = new Date();
  const months = lastMonths(now);
  const [pending, paidOrders, websiteInquiries, jobInquiries, tickets] = await Promise.all([
    supabase.from("orders").select("id, reference, total_centavos, payment_method, customer_reference, submitted_at, profiles!orders_user_id_fkey(full_name, first_name, last_name), order_items(description, projects(name))").eq("status", "pending").not("submitted_at", "is", null).order("submitted_at", { ascending: true }).limit(25),
    supabase.from("orders").select("total_centavos, paid_at").in("status", PAID_STATUSES).gte("paid_at", months[0].start.toISOString()),
    supabase.from("website_inquiries").select("id, full_name, email, business_name, website_type, status, created_at").in("status", ["new", "contacted", "scheduled"]).order("created_at", { ascending: false }).limit(10),
    supabase.from("job_application_inquiries").select("id, first_name, last_name, email, target_role, status, created_at").in("status", ["new", "reviewing", "contacted"]).order("created_at", { ascending: false }).limit(10),
    supabase.from("support_tickets").select("id, subject, status, created_at, profiles!support_tickets_user_id_fkey(full_name, first_name, last_name)").in("status", ["open", "pending"]).order("created_at", { ascending: false }).limit(10),
  ]);

  const failed: string[] = [];
  const check = (label: string, result: { error: unknown }) => { if (result.error) failed.push(label); };
  check("payments to confirm", pending); check("revenue", paidOrders);
  check("website inquiries", websiteInquiries); check("job application inquiries", jobInquiries); check("support tickets", tickets);

  const revenue: MonthRevenue[] = months.map(({ key, label }) => ({ key, label, centavos: 0, orders: 0 }));
  for (const order of paidOrders.data ?? []) {
    if (!order.paid_at) continue;
    const bucket = revenue.find(month => month.key === manilaMonthKey(new Date(order.paid_at)));
    if (bucket) { bucket.centavos += order.total_centavos; bucket.orders += 1; }
  }

  const inbox: InboxItem[] = [
    ...(websiteInquiries.data ?? []).map(row => ({ id: row.id, kind: "website" as const, title: row.full_name, detail: `${row.business_name} · ${websiteTypes[row.website_type] ?? "Website"} site`, email: row.email, status: row.status, createdAt: row.created_at })),
    ...(jobInquiries.data ?? []).map(row => ({ id: row.id, kind: "job" as const, title: [row.first_name, row.last_name].join(" "), detail: `Applying for ${row.target_role}`, email: row.email, status: row.status, createdAt: row.created_at })),
    ...(tickets.data ?? []).map(row => ({ id: row.id, kind: "support" as const, title: row.subject, detail: fullName(one(row.profiles)), email: null, status: row.status, createdAt: row.created_at })),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return {
    pendingPayments: (pending.data ?? []).map(row => {
      const item = one(row.order_items as { description: string; projects: { name: string } | { name: string }[] | null }[] | null);
      return { id: row.id, reference: row.reference, customer: fullName(one(row.profiles)), item: item?.description ?? "Order", projectName: one(item?.projects)?.name ?? "", method: row.payment_method ?? "", customerReference: row.customer_reference ?? "", totalCentavos: row.total_centavos, submittedAt: row.submitted_at as string };
    }),
    revenue,
    paidOrdersThisMonth: revenue[revenue.length - 1].orders,
    inbox: inbox.slice(0, 8),
    openRequests: inbox.filter(item => item.status === "new" || item.status === "open").length,
    generatedAt: now.getTime(),
    failed,
  };
}

// ---------------------------------------------------------------- Requests

export type RequestRow = InboxItem & { phone: string | null; message: string; extra: string[] };

export async function loadAdminRequests(supabase: AdminSupabase) {
  const [website, job, tickets, emails] = await Promise.all([
    supabase.from("website_inquiries").select("id, full_name, email, phone, business_name, website_type, budget_range, domain_status, preferred_meeting_date, preferred_meeting_time, message, status, created_at").order("created_at", { ascending: false }).limit(LIST_LIMIT),
    supabase.from("job_application_inquiries").select("id, first_name, last_name, email, phone, target_role, experience_level, requested_services, job_posting_url, linkedin_url, message, status, created_at").order("created_at", { ascending: false }).limit(LIST_LIMIT),
    supabase.from("support_tickets").select("id, user_id, subject, message, status, created_at, profiles!support_tickets_user_id_fkey(full_name, first_name, last_name)").order("created_at", { ascending: false }).limit(LIST_LIMIT),
    loadEmails(),
  ]);
  const failed = [website.error && "website inquiries", job.error && "job application inquiries", tickets.error && "support tickets"].filter(Boolean) as string[];
  const rows: RequestRow[] = [
    ...(website.data ?? []).map(row => ({ id: row.id, kind: "website" as const, title: row.full_name, detail: `${row.business_name} · ${websiteTypes[row.website_type] ?? "Website"} site`, email: row.email, phone: row.phone, status: row.status, createdAt: row.created_at, message: row.message, extra: [`Budget: ${row.budget_range.replace(/_/g, " ")}`, `Domain: ${row.domain_status.replace(/_/g, " ")}`, `Meeting: ${row.preferred_meeting_date} ${String(row.preferred_meeting_time).slice(0, 5)}`] })),
    ...(job.data ?? []).map(row => ({ id: row.id, kind: "job" as const, title: [row.first_name, row.last_name].join(" "), detail: `Applying for ${row.target_role} · ${row.experience_level.replace(/_/g, " ")}`, email: row.email, phone: row.phone, status: row.status, createdAt: row.created_at, message: row.message, extra: [`Wants: ${(row.requested_services as string[]).map(s => s.replace(/_/g, " ")).join(", ")}`, ...(row.job_posting_url ? [`Job post: ${row.job_posting_url}`] : []), ...(row.linkedin_url ? [`LinkedIn: ${row.linkedin_url}`] : [])] })),
    ...(tickets.data ?? []).map(row => ({ id: row.id, kind: "support" as const, title: row.subject, detail: fullName(one(row.profiles)), email: emails.get(row.user_id) ?? null, phone: null, status: row.status, createdAt: row.created_at, message: row.message, extra: [] })),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { rows, openCount: rows.filter(row => isOpen(row.status)).length, failed };
}

// ---------------------------------------------------------------- Projects

export type ProjectRow = { id: string; name: string; type: string; owner: string; status: string; liveUrl: string | null; paidUntil: string | null; updatedAt: string };
export type ProjectMix = { label: string; count: number; published: number };

export async function loadAdminProjects(supabase: AdminSupabase) {
  const { data, error } = await supabase.from("projects")
    .select("id, name, project_type, status, updated_at, profiles(full_name, first_name, last_name), wedding_events(event_kind), published_sites(slug, is_live), subscriptions(current_period_ends_at)")
    .order("updated_at", { ascending: false }).limit(LIST_LIMIT);
  const typeLabel: Record<string, string> = { wedding: "Wedding invitation", debut: "Debut invitation", business: "Business website", portfolio: "Portfolio", resume: "Resume" };
  const rows: ProjectRow[] = (data ?? []).map(row => {
    const kind = row.project_type === "wedding" && one(row.wedding_events as { event_kind: string }[] | null)?.event_kind === "debut" ? "debut" : row.project_type;
    const site = one(row.published_sites as { slug: string; is_live: boolean }[] | null);
    const paidUntil = one(row.subscriptions as { current_period_ends_at: string | null }[] | null)?.current_period_ends_at ?? null;
    return { id: row.id, name: row.name, type: typeLabel[kind] ?? kind, owner: fullName(one(row.profiles)), status: row.status, liveUrl: site?.is_live && row.status === "published" ? `/${kind === "business" ? "site" : "wedding"}/${site.slug}` : null, paidUntil, updatedAt: row.updated_at };
  });
  const mixOrder = ["Wedding invitation", "Debut invitation", "Business website", "Portfolio", "Resume"];
  const mix: ProjectMix[] = mixOrder.map(label => ({ label, count: rows.filter(r => r.type === label).length, published: rows.filter(r => r.type === label && r.status === "published").length }));
  return { rows, mix, failed: error ? ["projects"] : [] };
}

// ---------------------------------------------------------------- Orders

export type OrderRow = { id: string; reference: string; customer: string; item: string; projectName: string; projectType: string | null; method: string | null; customerReference: string | null; status: string; submitted: boolean; totalCentavos: number; discountCentavos: number; note: string | null; createdAt: string; paidAt: string | null };

export async function loadAdminOrders(supabase: AdminSupabase) {
  const { data, error } = await supabase.from("orders")
    .select("id, reference, status, total_centavos, discount_centavos, payment_method, customer_reference, submitted_at, review_note, created_at, paid_at, profiles!orders_user_id_fkey(full_name, first_name, last_name), order_items(description, projects(name, project_type))")
    .order("created_at", { ascending: false }).limit(LIST_LIMIT);
  const rows: OrderRow[] = (data ?? []).map(row => {
    const item = one(row.order_items as { description: string; projects: { name: string; project_type: string } | { name: string; project_type: string }[] | null }[] | null);
    const project = one(item?.projects);
    return { id: row.id, reference: row.reference, customer: fullName(one(row.profiles)), item: item?.description ?? "Order", projectName: project?.name ?? "", projectType: project?.project_type ?? null, method: row.payment_method, customerReference: row.customer_reference, status: row.status, submitted: Boolean(row.submitted_at), totalCentavos: row.total_centavos, discountCentavos: row.discount_centavos, note: row.review_note, createdAt: row.created_at, paidAt: row.paid_at };
  });
  return { rows, failed: error ? ["orders"] : [] };
}

// ---------------------------------------------------------------- Customers

export type CustomerRow = { id: string; name: string; email: string | null; role: string; joinedAt: string; projects: number; paidOrders: number; spentCentavos: number };

export async function loadAdminCustomers(supabase: AdminSupabase) {
  // roles has no read policies (only is_admin() reads it), so fetch staff roles with the service role.
  const [{ data, error }, emails, staff] = await Promise.all([
    supabase.from("profiles")
      .select("id, full_name, first_name, last_name, created_at, projects(count), orders!orders_user_id_fkey(status, total_centavos)")
      .order("created_at", { ascending: false }).limit(LIST_LIMIT),
    loadEmails(),
    createSupabaseAdminClient().from("roles").select("user_id, role").neq("role", "customer"),
  ]);
  const roles = new Map((staff.data ?? []).map(row => [row.user_id, row.role as string]));
  const rows: CustomerRow[] = (data ?? []).map(row => {
    const paid = ((row.orders as { status: string; total_centavos: number }[] | null) ?? []).filter(order => PAID_STATUSES.includes(order.status));
    return { id: row.id, name: fullName(row), email: emails.get(row.id) ?? null, role: roles.get(row.id) ?? "customer", joinedAt: row.created_at, projects: one(row.projects as { count: number }[] | null)?.count ?? 0, paidOrders: paid.length, spentCentavos: paid.reduce((sum, order) => sum + order.total_centavos, 0) };
  });
  return { rows, failed: error ? ["customers"] : [] };
}

// ---------------------------------------------------------------- Templates

export type TemplateRow = { id: string; name: string; category: string; status: string; priceCentavos: number | null; updatedAt: string };

export async function loadAdminTemplates(supabase: AdminSupabase) {
  const [templates, projects] = await Promise.all([
    supabase.from("templates").select("id, name, category, status, price_centavos, updated_at").order("updated_at", { ascending: false }).limit(LIST_LIMIT),
    supabase.from("projects").select("project_type, status, wedding_events(event_kind)"),
  ]);
  const usage = { wedding: 0, debut: 0, business: 0 };
  for (const project of projects.data ?? []) {
    const kind = project.project_type === "wedding" && one(project.wedding_events as { event_kind: string }[] | null)?.event_kind === "debut" ? "debut" : project.project_type;
    if (kind in usage) usage[kind as keyof typeof usage] += 1;
  }
  return {
    rows: (templates.data ?? []).map(row => ({ id: row.id, name: row.name, category: row.category, status: row.status, priceCentavos: row.price_centavos, updatedAt: row.updated_at })) as TemplateRow[],
    usage,
    failed: templates.error ? ["templates"] : [],
  };
}
