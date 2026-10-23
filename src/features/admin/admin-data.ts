import "server-only";

import type { createSupabaseServerClient } from "@/services/supabase-server";

type Supabase = Awaited<ReturnType<typeof createSupabaseServerClient>>;

const PAID_STATUSES = ["paid", "partially_refunded"];
const MONTHS_SHOWN = 6;
const TIME_ZONE = "Asia/Manila";

export type MonthRevenue = { key: string; label: string; centavos: number; orders: number };
export type InboxItem = { id: string; kind: "website" | "job" | "support"; title: string; detail: string; email: string | null; status: string; createdAt: string };
export type RecentOrder = { id: string; reference: string; customer: string; status: string; totalCentavos: number; createdAt: string };
export type RecentCustomer = { id: string; name: string; createdAt: string; projects: number };
export type TemplateRow = { id: string; name: string; category: string; status: string; priceCentavos: number | null; updatedAt: string };
export type ProjectMix = { label: string; count: number; published: number };
export type PendingPayment = { id: string; reference: string; customer: string; item: string; projectName: string; method: string; customerReference: string; totalCentavos: number; submittedAt: string };

export type AdminOverviewData = {
  /** Customers' GCash, Maya, and bank payments waiting for an admin to check and confirm. */
  pendingPayments: PendingPayment[];
  revenue: MonthRevenue[];
  paidOrdersThisMonth: number;
  customers: { total: number; newThisMonth: number };
  projects: { total: number; published: number; mix: ProjectMix[] };
  inbox: InboxItem[];
  openRequests: number;
  recentOrders: RecentOrder[];
  recentCustomers: RecentCustomer[];
  templates: TemplateRow[];
  /** When the data was loaded, so relative times render consistently. */
  generatedAt: number;
  /** Sections whose query failed, so the page can say so instead of showing zeros. */
  failed: string[];
};

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

export async function loadAdminOverview(supabase: Supabase): Promise<AdminOverviewData> {
  const now = new Date();
  const months = lastMonths(now);
  const thisMonthStart = months[months.length - 1].start.toISOString();

  const [pending, paidOrders, customerTotal, customerNew, projects, weddingEvents, websiteInquiries, jobInquiries, tickets, orders, profiles, templates] = await Promise.all([
    supabase.from("orders").select("id, reference, total_centavos, payment_method, customer_reference, submitted_at, profiles!orders_user_id_fkey(full_name, first_name, last_name), order_items(description, projects(name))").eq("status", "pending").not("submitted_at", "is", null).order("submitted_at", { ascending: true }).limit(25),
    supabase.from("orders").select("total_centavos, paid_at").in("status", PAID_STATUSES).gte("paid_at", months[0].start.toISOString()),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", thisMonthStart),
    supabase.from("projects").select("id, project_type, status"),
    supabase.from("wedding_events").select("project_id, event_kind"),
    supabase.from("website_inquiries").select("id, full_name, email, business_name, website_type, status, created_at").in("status", ["new", "contacted", "scheduled"]).order("created_at", { ascending: false }).limit(10),
    supabase.from("job_application_inquiries").select("id, first_name, last_name, email, target_role, status, created_at").in("status", ["new", "reviewing", "contacted"]).order("created_at", { ascending: false }).limit(10),
    supabase.from("support_tickets").select("id, subject, status, created_at, profiles!support_tickets_user_id_fkey(full_name, first_name, last_name)").in("status", ["open", "pending"]).order("created_at", { ascending: false }).limit(10),
    supabase.from("orders").select("id, reference, status, total_centavos, created_at, profiles!orders_user_id_fkey(full_name, first_name, last_name)").order("created_at", { ascending: false }).limit(8),
    supabase.from("profiles").select("id, full_name, first_name, last_name, created_at, projects(count)").order("created_at", { ascending: false }).limit(6),
    supabase.from("templates").select("id, name, category, status, price_centavos, updated_at").order("updated_at", { ascending: false }).limit(10),
  ]);

  const failed: string[] = [];
  const check = (label: string, result: { error: unknown }) => { if (result.error) failed.push(label); };
  check("payments to confirm", pending); check("revenue", paidOrders); check("customers", customerTotal); check("projects", projects);
  check("website inquiries", websiteInquiries); check("job application inquiries", jobInquiries);
  check("support tickets", tickets); check("orders", orders); check("templates", templates);

  const revenue: MonthRevenue[] = months.map(({ key, label }) => ({ key, label, centavos: 0, orders: 0 }));
  for (const order of paidOrders.data ?? []) {
    if (!order.paid_at) continue;
    const bucket = revenue.find(month => month.key === manilaMonthKey(new Date(order.paid_at)));
    if (bucket) { bucket.centavos += order.total_centavos; bucket.orders += 1; }
  }

  const debutIds = new Set((weddingEvents.data ?? []).filter(event => event.event_kind === "debut").map(event => event.project_id));
  const mixOrder = ["Wedding invitations", "Debut invitations", "Business websites", "Portfolios", "Resumes"];
  const mix = new Map(mixOrder.map(label => [label, { label, count: 0, published: 0 }]));
  const typeLabel: Record<string, string> = { wedding: "Wedding invitations", business: "Business websites", portfolio: "Portfolios", resume: "Resumes" };
  for (const project of projects.data ?? []) {
    const label = project.project_type === "wedding" && debutIds.has(project.id) ? "Debut invitations" : typeLabel[project.project_type];
    const row = label ? mix.get(label) : undefined;
    if (!row) continue;
    row.count += 1;
    if (project.status === "published") row.published += 1;
  }

  const websiteTypes: Record<string, string> = { local_business: "Local business", professional: "Professional", catalogue: "Catalogue", other: "Other" };
  const inbox: InboxItem[] = [
    ...(websiteInquiries.data ?? []).map(row => ({ id: row.id, kind: "website" as const, title: row.full_name, detail: `${row.business_name} · ${websiteTypes[row.website_type] ?? "Website"} site`, email: row.email, status: row.status, createdAt: row.created_at })),
    ...(jobInquiries.data ?? []).map(row => ({ id: row.id, kind: "job" as const, title: [row.first_name, row.last_name].join(" "), detail: `Applying for ${row.target_role}`, email: row.email, status: row.status, createdAt: row.created_at })),
    ...(tickets.data ?? []).map(row => ({ id: row.id, kind: "support" as const, title: row.subject, detail: fullName(one(row.profiles)), email: null, status: row.status, createdAt: row.created_at })),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const allProjects = projects.data ?? [];
  return {
    pendingPayments: (pending.data ?? []).map(row => {
      const item = one(row.order_items as { description: string; projects: { name: string } | { name: string }[] | null }[] | null);
      return { id: row.id, reference: row.reference, customer: fullName(one(row.profiles)), item: item?.description ?? "Order", projectName: one(item?.projects)?.name ?? "", method: row.payment_method ?? "", customerReference: row.customer_reference ?? "", totalCentavos: row.total_centavos, submittedAt: row.submitted_at as string };
    }),
    revenue,
    paidOrdersThisMonth: revenue[revenue.length - 1].orders,
    customers: { total: customerTotal.count ?? 0, newThisMonth: customerNew.count ?? 0 },
    projects: { total: allProjects.length, published: allProjects.filter(project => project.status === "published").length, mix: [...mix.values()] },
    inbox: inbox.slice(0, 8),
    openRequests: inbox.filter(item => item.status === "new" || item.status === "open").length,
    recentOrders: (orders.data ?? []).map(row => ({ id: row.id, reference: row.reference, customer: fullName(one(row.profiles)), status: row.status, totalCentavos: row.total_centavos, createdAt: row.created_at })),
    recentCustomers: (profiles.data ?? []).map(row => ({ id: row.id, name: fullName(row), createdAt: row.created_at, projects: one(row.projects as { count: number }[] | null)?.count ?? 0 })),
    templates: (templates.data ?? []).map(row => ({ id: row.id, name: row.name, category: row.category, status: row.status, priceCentavos: row.price_centavos, updatedAt: row.updated_at })),
    generatedAt: now.getTime(),
    failed,
  };
}
