import Link from "next/link";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { POLICY_UPDATED } from "@/lib/legal";
import { GETLAUNCH_FACEBOOK_URL } from "@/lib/social-links";


const policies = [
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/refunds", label: "Refund Policy" },
];

export function LegalPage({ title, summary, current, children }: { title: string; summary: string; current: string; children: ReactNode }) {
  return <div className="site-shell">
    <SiteHeader/>
    <main className="container legal-page">
      <header className="legal-header">
        <p className="eyebrow">Policies</p>
        <h1>{title}</h1>
        <p>{summary}</p>
        <p className="fine">Last updated {POLICY_UPDATED}</p>
        <nav className="legal-nav" aria-label="Policies">{policies.map(policy => <Link key={policy.href} href={policy.href} aria-current={policy.href === current ? "page" : undefined}>{policy.label}</Link>)}</nav>
      </header>
      <article className="legal-body">{children}</article>
    </main>
    <SiteFooter/>
  </div>;
}

// How customers reach GetLaunch PH about their account, privacy, or refunds. Add a contact email
// here once you have one; the Data Privacy Act expects a reachable contact for privacy requests.
export function LegalContact() {
  return <ul>
    <li>Message us on our <a href={GETLAUNCH_FACEBOOK_URL} target="_blank" rel="noopener noreferrer">GetLaunch PH Facebook page</a>.</li>
    <li>If you have an account, send a request from <Link href="/dashboard/support">Support</Link> in your dashboard.</li>
  </ul>;
}
