import type { Metadata } from "next";
import { Marketplace } from "@/features/marketplace/marketplace";
import { SiteHeader } from "@/components/site-header";
import { Brand } from "@/components/brand";
import Link from "next/link";

export const metadata: Metadata = { title: "Templates", description: "Explore GetLaunch PH templates for invitations, portfolios, and business websites." };

export default function TemplatesPage() {
  return <div className="site-shell"><SiteHeader/><main className="container"><section className="page-hero"><p className="eyebrow">Template marketplace</p><h1>Start with something beautiful.</h1><p>Each template is thoughtfully designed, easy to customize, and ready for the way Filipinos work and celebrate.</p></section><Marketplace/></main><footer className="footer"><div className="container footer-grid"><Brand/><div className="footer-links"><Link href="/">Home</Link><Link href="/#products">Products</Link><Link href="/auth">Sign in</Link></div></div></footer></div>;
}
