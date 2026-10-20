import Link from "next/link";
import { ArrowDown, ArrowUpRight, Check, FileX, MessagesSquare, Plus, SearchX, Sparkles, Wallet } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HeroShowcase } from "@/components/hero-showcase";
import { PortfolioShowcase } from "@/components/portfolio-showcase";
import { HeroBackdrop } from "@/components/hero-backdrop";
import { PageMotion } from "@/components/page-motion";
import { SocialIcon } from "@/components/social-icons";
import { GETLAUNCH_FACEBOOK_URL } from "@/lib/social-links";

const products = [
  { name: "Free draft", price: "₱0", detail: "Design and preview before paying", items: ["Wedding, debut, or business site", "Visual editor", "Mobile and desktop preview"], cta: "Create a draft", href: "/dashboard/projects/new" },
  { name: "Wedding Invitation", price: "₱799", suffix: " one-time", detail: "Publish one hosted wedding invitation", items: ["Your invitation link", "Private guest RSVP links", "Publish and update controls", "Core security included"], cta: "Create my invitation", href: "/dashboard/projects/new", featured: true },
  { name: "Debut Invitation", price: "₱999", suffix: " one-time", detail: "Publish one hosted debut invitation", items: ["Your invitation link", "Private guest RSVP links", "Digital souvenirs: keepsake card and photo album", "Core security included"], cta: "Create my debut invitation", href: "/dashboard/projects/new?type=debut" },
  { name: "Business Website", price: "₱299", suffix: " / month", detail: "A one-page site for your business", items: ["Contact details and opening hours", "Embedded Google Map", "Facebook, Instagram, and TikTok links", "Hosting and HTTPS included"], cta: "Create my business site", href: "/dashboard/projects/new?type=business" },
  { name: "Job Application Bundle", price: "₱499", suffix: " one-time", detail: "Focused support for one job application", items: ["Resume review", "Tailored cover letter guidance", "LinkedIn and portfolio feedback", "Interview-preparation notes"], cta: "Request my bundle", href: "/job-application-bundle" },
  { name: "Custom Website", price: "Let’s talk", detail: "Built with a developer for your business", items: ["Free project consultation", "Scope matched to your budget", "Responsive custom design", "Your own domain"], cta: "Request a consultation", href: "/custom-website" },
];

const problems = [
  { icon: Wallet, title: "Agency quotes that blow the budget", copy: "Custom builds often start with a big upfront quote, then add fees for hosting, changes, and fixes." },
  { icon: MessagesSquare, title: "RSVPs lost in group chats", copy: "Tracking who’s coming through Messenger, texts, and spreadsheets gets messy fast, especially with a long guest list." },
  { icon: SearchX, title: "A Facebook page isn’t a website", copy: "Customers search Google for your hours, location, and contact details. Without a site, they may find a competitor first." },
  { icon: FileX, title: "Applications that blend in", copy: "Generic resumes and copy-paste cover letters make it hard to stand out for the role you really want." },
];

const faqs = [
  { question: "Do I need to know how to code?", answer: "Not at all. You edit everything in a visual workspace: type your details, choose colors and fonts, and preview on mobile and desktop before you publish." },
  { question: "Can I try it before paying?", answer: "Yes. Creating a draft is free. You only pay when you’re ready to publish your invitation or website." },
  { question: "How do I pay?", answer: "All prices are in Philippine pesos. Checkout supports cards, GCash, Maya, and bank transfer." },
  { question: "How do guests RSVP to my wedding or debut?", answer: "Every guest gets a private RSVP link. Their responses appear in your dashboard, so you always know who’s coming." },
  { question: "Can I edit my invitation after publishing?", answer: "Yes. Publish and update controls let you change details like the schedule or venue and update your live page." },
  { question: "What’s included in the ₱299/month business website?", answer: "A one-page site with your contact details, opening hours, an embedded Google Map, and links to your Facebook, Instagram, and TikTok. Hosting and HTTPS are included." },
  { question: "Can I use my own domain name?", answer: "Your own domain is part of our Custom Website service. Request a free consultation and we’ll scope the project to your budget." },
  { question: "How does the referral discount work?", answer: "Every account has a referral code. When a new customer uses your code on their first purchase, they get ₱50 off." },
];

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Organization", name: "GetLaunch PH", sameAs: [GETLAUNCH_FACEBOOK_URL] },
    {
      "@type": "FAQPage",
      mainEntity: faqs.map(({ question, answer }) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })),
    },
  ],
};

const marquee = ["Wedding invitations", "Debut invitations", "Business websites", "Job applications", "Custom websites", "Pay in pesos"];

const headline: { word: string; accent?: boolean }[] = [
  { word: "Your" }, { word: "ideas," }, { word: "beautifully", accent: true }, { word: "launched." },
];

/** Stagger index for the CSS intro animation. */
const order = (i: number) => ({ "--i": i }) as React.CSSProperties;

export default function Home() {
  return (
    <div className="site-shell home-shell">
      <PageMotion />
      <SiteHeader />
      <main>
        <section className="hero">
          <HeroBackdrop />
          <div className="container hero-grid">
            <div className="hero-copy">
              <p className="eyebrow intro-rise" style={order(0)}><Sparkles size={13} /> Proudly built for Filipino creators</p>
              <h1 aria-label="Your ideas, beautifully launched.">
                {headline.map(({ word, accent }, i) => (
                  <span className="word-mask" aria-hidden="true" key={word}>
                    <span className="word" style={order(i)}>{accent ? <em>{word}</em> : word}</span>
                  </span>
                ))}
              </h1>
              <p className="intro-rise" style={order(4)}>Create professional websites and invitations, or get focused support for your next job application—all designed for Filipinos ready to move forward.</p>
              <div className="hero-actions intro-rise" style={order(5)}>
                <Link className="btn btn-primary" href="/templates">Explore templates <ArrowUpRight size={17} /></Link>
                <Link className="btn btn-secondary" href="/free-builders">See Free Builders</Link>
              </div>
              <div className="hero-proof intro-rise" style={order(6)}>
                <span><Check size={15} /> No coding required</span>
                <span><Check size={15} /> Secure by default</span>
                <span><Check size={15} /> Pay in pesos</span>
              </div>
            </div>
            <HeroShowcase />
          </div>
        </section>

        <div className="marquee" role="region" aria-label="What you can launch with GetLaunch PH">
          {[0, 1].map((copy) => (
            <ul className="marquee-track" key={copy} aria-hidden={copy === 1 || undefined}>
              {marquee.map((item) => <li key={item}>{item}<span aria-hidden="true">✦</span></li>)}
            </ul>
          ))}
        </div>

        {/* 2 · Social proof */}
        <section className="section" id="work">
          <div className="container">
            <div className="section-heading" data-reveal><p className="eyebrow">Trusted by real clients</p><h2>Websites we’ve built and <em>launched.</em></h2><p>Real sites for real clients, from a Cebu law office to a bilingual destination wedding.</p></div>
            <div data-reveal><PortfolioShowcase/></div>
            <div className="proof-facebook glass" data-reveal data-spotlight>
              <span className="proof-facebook-icon"><SocialIcon platform="facebook" size={22}/></span>
              <div>
                <h3>See our latest launches on Facebook</h3>
                <p>New client work, behind-the-scenes builds, and promos are posted first on our page.</p>
              </div>
              <a className="btn btn-secondary" href={GETLAUNCH_FACEBOOK_URL} target="_blank" rel="noopener noreferrer">Follow GetLaunch PH <ArrowUpRight size={16}/></a>
            </div>
          </div>
        </section>

        {/* 3 · Problem */}
        <section className="section" id="problem">
          <div className="container">
            <div className="section-heading" data-reveal><p className="eyebrow">Sound familiar?</p><h2>Getting online shouldn’t cost a fortune, <em>or your whole weekend.</em></h2></div>
            <div className="problem-grid">
              {problems.map(({ icon: Icon, title, copy }) => (
                <article className="problem-card glass" key={title} data-reveal data-spotlight>
                  <span className="problem-icon"><Icon size={20}/></span>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </article>
              ))}
            </div>
            <p className="problem-turn" data-reveal>There’s a simpler way <ArrowDown size={22}/></p>
          </div>
        </section>

        {/* 4 · Solution */}
        <section className="section" id="products">
          <div className="container">
            <div className="section-heading" data-reveal><p className="eyebrow">The solution</p><h2>Launch professionally, without the <em>agency price.</em></h2><p>Start free and pay only when you publish, in pesos. Core security is always included, and a friend’s referral code takes ₱50 off your first purchase.</p></div>
            <div className="price-grid">
              {products.map((product) => (
                <article className={`price-card ${product.featured ? "featured" : "glass"}`} key={product.name} data-reveal data-spotlight>
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

        {/* 5 · How it works */}
        <section className="section" id="how-it-works">
          <div className="container process-wrap">
            <div className="section-heading" data-reveal><p className="eyebrow">How it works</p><h2>From blank page to <em>beautifully done.</em></h2><p>GetLaunch PH handles the complicated parts, so you can stay focused on what you want to say.</p></div>
            <div className="process-list">
              <div className="process-step glass" data-reveal data-spotlight><span className="step-no">01</span><div><h3>Choose your starting point</h3><p>Browse curated templates for weddings, portfolios, and small businesses, or request career-application support.</p></div></div>
              <div className="process-step glass" data-reveal data-spotlight><span className="step-no">02</span><div><h3>Make every detail yours</h3><p>Edit content, colors, fonts, sections, and imagery in a friendly visual workspace.</p></div></div>
              <div className="process-step glass" data-reveal data-spotlight><span className="step-no">03</span><div><h3>Publish or download</h3><p>Share a secure link, publish your site, or export a print-ready document.</p></div></div>
            </div>
          </div>
        </section>

        {/* 6 · FAQs */}
        <section className="section" id="faqs">
          <div className="container faq-wrap">
            <div className="section-heading faq-heading" data-reveal>
              <p className="eyebrow">FAQs</p>
              <h2>Questions, <em>answered.</em></h2>
              <p>Can’t find what you’re looking for? Send us a message on Facebook and we’ll help you out.</p>
              <a className="btn btn-secondary" href={GETLAUNCH_FACEBOOK_URL} target="_blank" rel="noopener noreferrer"><SocialIcon platform="facebook" size={16}/> Message us</a>
            </div>
            <div className="faq-list">
              {faqs.map(({ question, answer }) => (
                <details className="faq-item" key={question} data-reveal>
                  <summary>{question}<Plus size={18} aria-hidden="true"/></summary>
                  <p>{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* 7 · CTA */}
        <section className="section">
          <div className="container cta-panel glass" data-reveal>
            <div className="cta-glow" aria-hidden="true" data-parallax="-40" />
            <div><p className="eyebrow">Ready when you are</p><h2>Give your next idea the launch it <em>deserves.</em></h2><p>Start free. Upgrade when you’re ready to publish.</p></div>
            <div className="cta-actions">
              <Link className="btn btn-primary" href="/templates">Start creating <ArrowUpRight size={17}/></Link>
              <a className="btn btn-secondary" href={GETLAUNCH_FACEBOOK_URL} target="_blank" rel="noopener noreferrer"><SocialIcon platform="facebook" size={16}/> Follow on Facebook</a>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter/>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />
    </div>
  );
}
