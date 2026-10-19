import Link from "next/link";
import { ArrowUpRight, Check, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Brand } from "@/components/brand";
import { HeroShowcase } from "@/components/hero-showcase";
import { PortfolioShowcase } from "@/components/portfolio-showcase";

const products = [
  { name: "Free draft", price: "₱0", detail: "Design and preview before paying", items: ["Wedding, debut, or business site", "Visual editor", "Mobile and desktop preview"], cta: "Create a draft", href: "/dashboard/projects/new" },
  { name: "Wedding Invitation", price: "₱799", suffix: " one-time", detail: "Publish one hosted wedding invitation", items: ["Your invitation link", "Private guest RSVP links", "Publish and update controls", "Core security included"], cta: "Create my invitation", href: "/dashboard/projects/new", featured: true },
  { name: "Debut Invitation", price: "₱999", suffix: " one-time", detail: "Publish one hosted debut invitation", items: ["Your invitation link", "Private guest RSVP links", "Digital souvenirs: keepsake card and photo album", "Core security included"], cta: "Create my debut invitation", href: "/dashboard/projects/new?type=debut" },
  { name: "Business Website", price: "₱299", suffix: " / month", detail: "A one-page site for your business", items: ["Contact details and opening hours", "Embedded Google Map", "Facebook, Instagram, and TikTok links", "Hosting and HTTPS included"], cta: "Create my business site", href: "/dashboard/projects/new?type=business" },
  { name: "Job Application Bundle", price: "₱499", suffix: " one-time", detail: "Focused support for one job application", items: ["Resume review", "Tailored cover letter guidance", "LinkedIn and portfolio feedback", "Interview-preparation notes"], cta: "Request my bundle", href: "/job-application-bundle" },
  { name: "Custom Website", price: "Let’s talk", detail: "Built with a developer for your business", items: ["Free project consultation", "Scope matched to your budget", "Responsive custom design", "Your own domain"], cta: "Request a consultation", href: "/custom-website" },
];

export default function Home() {
  return (
    <div className="site-shell">
      <SiteHeader />
      <main>
        <section className="hero">
          <div className="container hero-grid">
            <div className="hero-copy">
              <p className="eyebrow"><Sparkles size={13} /> Proudly built for Filipino creators</p>
              <h1>Your ideas, <em>beautifully</em> launched.</h1>
              <p>Create professional websites and invitations, or get focused support for your next job application—all designed for Filipinos ready to move forward.</p>
              <div className="hero-actions">
                <Link className="btn btn-primary" href="/templates">Explore templates <ArrowUpRight size={17} /></Link>
                <Link className="btn btn-secondary" href="/free-builders">See Free Builders</Link>
              </div>
              <div className="hero-proof">
                <span><Check size={15} /> No coding required</span>
                <span><Check size={15} /> Secure by default</span>
                <span><Check size={15} /> Pay in pesos</span>
              </div>
            </div>
            <HeroShowcase />
          </div>
        </section>

        <section className="container stats-band" aria-label="GetLaunch PH highlights">
          <div className="stats-intro">Everything you need to go from idea to ready-to-share.</div>
          <div><strong>5</strong><span>products to launch with</span></div>
          <div><strong>₱0</strong><span>to start creating</span></div>
          <div><strong>24/7</strong><span>access to your work</span></div>
        </section>

        <section className="section" id="products">
          <div className="container">
            <div className="section-heading"><p className="eyebrow">Products</p><h2>Launch professionally, without the agency price.</h2><p>Start free and pay only when you publish, in pesos. Core security is always included, and a friend’s referral code takes ₱50 off your first purchase.</p></div>
            <div className="price-grid">
              {products.map((product) => (
                <article className={`price-card ${product.featured ? "featured" : "glass"}`} key={product.name}>
                  {product.featured && <span className="tag">Most popular</span>}
                  <h3>{product.name}</h3><p className={product.featured ? "" : "muted"}>{product.detail}</p>
                  <div className="price">{product.price}<small>{product.suffix}</small></div>
                  <ul>{product.items.map(item => <li key={item}><Check size={15}/>{item}</li>)}</ul>
                  <Link className={`btn ${product.featured ? "" : "btn-primary"}`} href={product.href}>{product.cta}</Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="about">
          <div className="container process-wrap">
            <div className="section-heading"><p className="eyebrow">Simple by design</p><h2>From blank page to beautifully done.</h2><p>GetLaunch PH handles the complicated parts, so you can stay focused on what you want to say.</p></div>
            <div className="process-list">
              <div className="process-step glass"><span className="step-no">01</span><div><h3>Choose your starting point</h3><p>Browse curated templates for weddings, portfolios, and small businesses, or request career-application support.</p></div></div>
              <div className="process-step glass"><span className="step-no">02</span><div><h3>Make every detail yours</h3><p>Edit content, colors, fonts, sections, and imagery in a friendly visual workspace.</p></div></div>
              <div className="process-step glass"><span className="step-no">03</span><div><h3>Publish or download</h3><p>Share a secure link, publish your site, or export a print-ready document.</p></div></div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container cta-panel glass">
            <div><p className="eyebrow">Ready when you are</p><h2>Give your next idea the launch it deserves.</h2><p>Start free. Upgrade when you’re ready to publish.</p></div>
            <Link className="btn btn-primary" href="/templates">Start creating <ArrowUpRight size={17}/></Link>
          </div>
        </section>

        <section className="section" id="work">
          <div className="container">
            <div className="section-heading"><p className="eyebrow">Recent work</p><h2>Websites we’ve built and launched.</h2><p>Real sites for real clients, from a Cebu law office to a bilingual destination wedding.</p></div>
            <PortfolioShowcase/>
          </div>
        </section>
      </main>
      <footer className="footer"><div className="container footer-grid"><Brand/><div className="footer-links"><Link href="/templates">Templates</Link><Link href="/#products">Products</Link><Link href="/auth">Sign in</Link><span>© 2026 GetLaunch PH</span></div></div></footer>
    </div>
  );
}
