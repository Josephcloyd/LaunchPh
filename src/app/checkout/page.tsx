import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { Checkout } from "@/features/checkout/checkout";
import { ManualCheckout, type AwaitingOrder } from "@/features/checkout/manual-checkout";
import { checkReferralCode } from "@/app/checkout/actions";
import { isProjectProduct, resolveCheckoutProduct } from "@/lib/checkout-products";
import { configuredPaymentAccounts, type PaymentMethod } from "@/lib/payment-accounts";
import { REFERRAL_COOKIE } from "@/lib/referral";
import { createSupabaseServerClient } from "@/services/supabase-server";

export const metadata: Metadata = { title: "Checkout", description: "Secure GetLaunch PH checkout." };
export default async function CheckoutPage({ searchParams }: PageProps<"/checkout">) {
  const params = await searchParams;
  const productKey = resolveCheckoutProduct(params.product);
  const browseHref = productKey === "job-application-bundle" ? "/job-application-bundle" : "/templates";
  // A code from ?ref= or a /r/ share link is applied automatically when still valid.
  const savedCode = typeof params.ref === "string" ? params.ref : (await cookies()).get(REFERRAL_COOKIE)?.value;
  const savedReferral = savedCode ? await checkReferralCode(savedCode) : null;
  const header = <header className="site-header"><div className="container nav-wrap glass"><Brand/><Link className="fine" href={browseHref}>← Continue browsing</Link></div></header>;
  if (!isProjectProduct(productKey)) return <div className="site-shell">{header}<Checkout productKey={productKey} initialReferralCode={savedReferral?.ok ? savedReferral.code : null}/></div>;

  // Invitations and business sites are bought for a project the customer owns.
  const projectId = typeof params.project === "string" ? params.project : null;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth?next=${encodeURIComponent(`/checkout?product=${productKey}${projectId ? `&project=${projectId}` : ""}`)}`);
  if (!projectId) redirect(productKey === "business-site" ? "/dashboard/projects/new?type=business" : "/dashboard/projects");
  const { data: project } = await supabase.from("projects").select("id, name, project_type").eq("id", projectId).eq("owner_id", user.id).maybeSingle();
  if (!project) redirect("/dashboard/projects");

  // Send the customer to the product that matches the project, e.g. a debut to the debut price.
  let expectedProduct = "business-site";
  if (project.project_type === "wedding") {
    const { data: event } = await supabase.from("wedding_events").select("event_kind").eq("project_id", project.id).maybeSingle();
    expectedProduct = event?.event_kind === "debut" ? "debut-invitation" : "wedding-invitation";
  } else if (project.project_type !== "business") redirect("/dashboard/projects");
  if (expectedProduct !== productKey) redirect(`/checkout?product=${expectedProduct}&project=${project.id}`);

  const [{ data: site }, { data: subscription }, { data: submitted }] = await Promise.all([
    supabase.from("published_sites").select("slug, is_live").eq("project_id", project.id).maybeSingle(),
    supabase.from("subscriptions").select("current_period_ends_at").eq("project_id", project.id).maybeSingle(),
    supabase.from("orders").select("reference, total_centavos, payment_method, customer_reference, order_items!inner(project_id)")
      .eq("user_id", user.id).eq("status", "pending").not("submitted_at", "is", null).eq("order_items.project_id", project.id)
      .order("submitted_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const liveUrl = site?.is_live ? `/${project.project_type === "business" ? "site" : "wedding"}/${site.slug}` : null;
  const awaiting: AwaitingOrder | null = submitted?.customer_reference
    ? { reference: submitted.reference, totalCentavos: submitted.total_centavos, method: submitted.payment_method as PaymentMethod, customerReference: submitted.customer_reference }
    : null;

  return <div className="site-shell">{header}<ManualCheckout
    productKey={productKey}
    project={{ id: project.id, name: project.name }}
    accounts={configuredPaymentAccounts()}
    initialReferralCode={savedReferral?.ok ? savedReferral.code : null}
    liveUrl={liveUrl}
    paidUntil={subscription?.current_period_ends_at ?? null}
    awaiting={awaiting}
    emailEnabled={Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)}
  /></div>;
}
