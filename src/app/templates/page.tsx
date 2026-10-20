import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HeroBackdrop } from "@/components/hero-backdrop";
import { PageMotion } from "@/components/page-motion";
import { SocialIcon } from "@/components/social-icons";
import { TemplateShowcase, templates } from "@/features/marketplace/template-showcase";
import { GETLAUNCH_FACEBOOK_URL } from "@/lib/social-links";

export const metadata: Metadata = { title: "Templates", description: "Explore GetLaunch PH templates for wedding invitations, debut invitations, and business websites." };

/** Stagger index for the CSS intro animation. */
const order = (i: number) => ({ "--i": i }) as React.CSSProperties;

export default function TemplatesPage() {
  return <div className="site-shell home-shell">
    <PageMotion/>
    <SiteHeader/>
    <main>
      <section className="tpl-hero">
        <HeroBackdrop/>
        <div className="container tpl-hero-inner">
          <p className="eyebrow intro-rise" style={order(0)}><Sparkles size={13}/> Templates</p>
          <h1 className="intro-rise" style={order(1)}>Start with something <em>beautiful.</em></h1>
          <p className="intro-rise" style={order(2)}>Every design is ready for the way Filipinos work and celebrate. Make it yours in minutes, preview it for free, and publish when it’s perfect.</p>
          <nav className="tpl-jump intro-rise" style={order(3)} aria-label="Jump to a template">
            {templates.map(template => <a key={template.id} href={`#${template.id}`}>{template.name}<span>{template.price}</span></a>)}
          </nav>
        </div>
      </section>

      <section className="container">
        <TemplateShowcase/>
      </section>

      <section className="section">
        <div className="container cta-panel glass" data-reveal>
          <div className="cta-glow" aria-hidden="true" data-parallax="-40"/>
          <div><p className="eyebrow">Need something different?</p><h2>We’ll build it <em>with you.</em></h2><p>More templates are on the way. For a fully custom site with your own domain, start with a free consultation.</p></div>
          <div className="cta-actions">
            <Link className="btn btn-primary" href="/custom-website">Request a consultation <ArrowUpRight size={17}/></Link>
            <a className="btn btn-secondary" href={GETLAUNCH_FACEBOOK_URL} target="_blank" rel="noopener noreferrer"><SocialIcon platform="facebook" size={16}/> Message us</a>
          </div>
        </div>
      </section>
    </main>
    <SiteFooter/>
  </div>;
}
