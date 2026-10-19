import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { Brand } from "@/components/brand";
import { Checkout } from "@/features/checkout/checkout";
import { checkReferralCode } from "@/app/checkout/actions";
import { resolveCheckoutProduct } from "@/lib/checkout-products";
import { REFERRAL_COOKIE } from "@/lib/referral";

export const metadata: Metadata = { title: "Checkout", description: "Secure GetLaunch PH checkout." };
export default async function CheckoutPage({ searchParams }: PageProps<"/checkout">) {
  const params = await searchParams;
  const productKey = resolveCheckoutProduct(params.product);
  const browseHref = productKey === "job-application-bundle" ? "/job-application-bundle" : "/templates";
  // A code from ?ref= or a /r/ share link is applied automatically when still valid.
  const savedCode = typeof params.ref === "string" ? params.ref : (await cookies()).get(REFERRAL_COOKIE)?.value;
  const savedReferral = savedCode ? await checkReferralCode(savedCode) : null;
  return <div className="site-shell"><header className="site-header"><div className="container nav-wrap glass"><Brand/><Link className="fine" href={browseHref}>← Continue browsing</Link></div></header><Checkout productKey={productKey} initialReferralCode={savedReferral?.ok ? savedReferral.code : null}/></div>;
}
