import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Gift, Sparkles } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { freeBuilders } from "@/lib/free-builders";

export const metadata: Metadata = {
  title: "Free Builders",
  description: "Free website and design tools from GetLaunch PH. No payment, no sign-up fees.",
};

export default function FreeBuildersPage() {
  return <div className="site-shell">
    <SiteHeader/>
    <main className="container free-builders-page">
      <header className="section-heading">
        <p className="eyebrow"><Gift size={13}/> Free Builders</p>
        <h1>Free tools to help you launch.</h1>
        <p>Builders we make available at no cost to Filipino creators, students, and small businesses. Use them as often as you like.</p>
      </header>

      {freeBuilders.length === 0 ? <section className="free-builders-empty glass">
        <span className="empty-icon"><Sparkles size={22}/></span>
        <h2>The first free builders are on the way.</h2>
        <p>We’re building free tools for you right now. Check back soon, or start a free draft of an invitation or business website in the meantime.</p>
        <Link className="btn btn-primary btn-small" href="/dashboard/projects/new">Start a free draft</Link>
      </section> : <div className="free-builders-grid">
        {freeBuilders.map(({ slug, name, description, category, href, status, icon: Icon }) => {
          const live = status === "live";
          const external = href.startsWith("http");
          const body = <>
            <div className="free-builder-top"><span className="product-icon"><Icon size={22}/></span><span className={`free-builder-badge ${live ? "live" : ""}`}>{live ? "Free" : "Coming soon"}</span></div>
            <p className="free-builder-category">{category}</p>
            <h2>{name}</h2>
            <p>{description}</p>
            {live && <span className="text-link">Open builder <ArrowUpRight size={15}/></span>}
          </>;
          if (!live) return <article className="free-builder-card glass is-soon" key={slug}>{body}</article>;
          return external
            ? <a className="free-builder-card glass" key={slug} href={href} target="_blank" rel="noreferrer">{body}</a>
            : <Link className="free-builder-card glass" key={slug} href={href}>{body}</Link>;
        })}
      </div>}
    </main>
    <SiteFooter/>
  </div>;
}
