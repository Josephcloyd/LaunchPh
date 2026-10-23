import Link from "next/link";
import { CreditCard, Gift, ReceiptText, ShieldCheck } from "lucide-react";
import { ReferralShare } from "@/features/dashboard/referral-card";
import { BUSINESS_GRACE_DAYS } from "@/lib/checkout-products";
import { REFERRAL_DISCOUNT_PESOS } from "@/lib/referral";
import { requireUser } from "@/services/supabase-server";

const longDate = (iso: string) => new Intl.DateTimeFormat("en-PH", { dateStyle: "long", timeZone: "Asia/Manila" }).format(new Date(iso));

function orderStatus(order: { status: string; submitted_at: string | null; review_note: string | null }) {
  if (order.status === "paid") return { label: "Paid", tone: "paid" };
  if (order.status === "pending") return { label: "Awaiting confirmation", tone: "pending" };
  if (order.status === "failed") return { label: "Not confirmed", tone: "failed", note: order.review_note };
  return { label: order.status.replace("_", " "), tone: order.status };
}

export default async function BillingPage() {
  const { supabase, user } = await requireUser();
  const [subscriptionResult, orderResult, referralResult] = await Promise.all([
    supabase.from("subscriptions").select("id, status, current_period_ends_at, project_id, projects(name)").eq("user_id", user.id).order("current_period_ends_at", { ascending: true }),
    // Orders the customer actually sent payment for; unsent ones were replaced or abandoned.
    supabase.from("orders").select("id, reference, status, total_centavos, paid_at, submitted_at, review_note, created_at").eq("user_id", user.id).or("submitted_at.not.is.null,status.eq.paid").order("created_at", { ascending: false }).limit(20),
    supabase.rpc("ensure_my_referral_code"),
  ]);
  const referralCode = typeof referralResult.data === "string" ? referralResult.data : null;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://launchph.ph";
  const sites = subscriptionResult.data ?? [];
  const now = new Date();
  return <div className="workspace-page"><header className="workspace-page-header"><div><p className="workspace-kicker">Billing</p><h1>Plan and purchases</h1><p>Your business site plans, payments, and referral code.</p></div></header><section className="settings-section referral-section"><div className="settings-section-title"><Gift size={18}/><div><h2>Refer a friend</h2><p>Friends who use your code get ₱{REFERRAL_DISCOUNT_PESOS} off their first purchase.</p></div></div>{referralCode ? <ReferralShare code={referralCode} link={`${appUrl}/r/${referralCode}`}/> : <p className="compact-empty">Your referral code is unavailable right now. Please try again later.</p>}</section><div className="settings-layout"><section className="settings-section"><div className="settings-section-title"><CreditCard size={18}/><div><h2>Business site plans</h2><p>Prepaid, with no automatic charges. We remind you before a plan ends.</p></div></div>{subscriptionResult.error ? <p className="compact-empty">Plan information is unavailable.</p> : sites.length === 0 ? <div className="compact-empty"><strong>No business site plans</strong><p>Invitations are a one-time purchase and don’t expire.</p></div> : sites.map(site => {
    const ends = site.current_period_ends_at ? new Date(site.current_period_ends_at) : null;
    const project = (Array.isArray(site.projects) ? site.projects[0] : site.projects) as { name?: string } | null;
    const active = ends && ends > now;
    return <div className="plan-line" key={site.id}><div><strong>{project?.name ?? "Business site"}</strong><span>{active ? "Active" : "Ended"}</span></div><p>{ends ? (active ? `Paid until ${longDate(ends.toISOString())}` : `Ended ${longDate(ends.toISOString())}; offline ${BUSINESS_GRACE_DAYS} days later`) : "No paid period yet"}</p><small><Link href={`/checkout?product=business-site&project=${site.project_id}`}>Renew or add months</Link></small></div>;
  })}</section><section className="settings-section"><div className="settings-section-title"><ShieldCheck size={18}/><div><h2>Enhanced Security Package</h2><p>Optional premium project access controls.</p></div></div><p className="compact-empty">No Enhanced Security Package is active. Core security remains included with every account.</p></section></div><section className="workspace-section workspace-section-main"><div className="workspace-section-head"><div><h2>Payments</h2><p>Orders you’ve sent payment for, newest first.</p></div><ReceiptText size={18}/></div>{orderResult.error ? <p className="compact-empty">Payment history is unavailable.</p> : (orderResult.data?.length ?? 0) === 0 ? <p className="compact-empty">No payments yet.</p> : <div className="table-wrap"><table className="data-table"><thead><tr><th>Reference</th><th>Date</th><th>Status</th><th>Total</th></tr></thead><tbody>{orderResult.data!.map(order => { const status = orderStatus(order); return <tr key={order.id}><td>{order.reference}</td><td>{new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeZone: "Asia/Manila" }).format(new Date(order.paid_at ?? order.submitted_at ?? order.created_at))}</td><td><span className={`status-pill ${status.tone}`}>{status.label}</span>{"note" in status && status.note && <small className="order-note">{status.note}</small>}</td><td>₱{(order.total_centavos / 100).toLocaleString("en-PH")}</td></tr>; })}</tbody></table></div>}</section></div>;
}
