import type { Metadata } from "next";
import Link from "next/link";
import { BriefcaseBusiness, CalendarDays, Check, ExternalLink, Globe2, MessageSquareText, Store, WalletCards } from "lucide-react";
import { submitWebsiteInquiry } from "@/app/custom-website/actions";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Custom Business Websites",
  description: "Request a consultation for a custom local-business website with your own domain.",
};

const features = [
  "One-on-one project consultation",
  "Responsive design for phones and computers",
  "Your existing domain or help choosing a new one",
  "Pages and features scoped to your budget",
  "Basic SEO, performance, and secure deployment",
];

export default async function CustomWebsitePage({ searchParams }: PageProps<"/custom-website">) {
  const params = await searchParams;
  return (
    <div className="site-shell">
      <SiteHeader/>
      <main className="container custom-service-page">
        <section className="custom-service-intro">
          <p className="eyebrow">Developer-built websites</p>
          <h1>A website shaped around your business.</h1>
          <p>Tell us what you need, choose a comfortable budget range, and request a meeting with the developer. You’ll receive a scoped proposal before any work begins.</p>
          <ul className="custom-feature-list">{features.map(feature => <li key={feature}><span><Check size={15}/></span>{feature}</li>)}</ul>
          <div className="custom-service-note glass"><Globe2 size={20}/><div><strong>Own-domain ready</strong><p>Connect a domain you already own or ask for help choosing one. Registration and third-party service fees are quoted separately.</p></div></div>
          <div className="custom-service-note glass"><BriefcaseBusiness size={20}/><div><strong>Recent work</strong><p>See sites the developer has built: <a href="https://canoy-law.com" target="_blank" rel="noreferrer">Canoy Law <ExternalLink size={11}/></a>, a law office in Cebu, and <a href="https://vanessaandthomas.ch" target="_blank" rel="noreferrer">Thomas &amp; Vanessa <ExternalLink size={11}/></a>, a bilingual wedding site.</p></div></div>
          <div className="custom-service-note glass"><Store size={20}/><div><strong>Just need a simple page?</strong><p>Our <Link href="/dashboard/projects/new?type=business">₱299/month business website</Link> gives you a one-page site with your map, hours, and social media that you can edit yourself.</p></div></div>
        </section>

        <section className="consultation-card glass" aria-labelledby="consultation-title">
          <div className="consultation-heading"><span><MessageSquareText size={20}/></span><div><h2 id="consultation-title">Request a consultation</h2><p>Share your goals and preferred meeting schedule.</p></div></div>
          {params.submitted ? <div className="consultation-success"><CalendarDays size={32}/><h3>Request received</h3><p>The developer will contact you by email to confirm the meeting schedule.</p><Link className="btn btn-primary" href="/">Return home</Link></div> : <>
            {params.error && <div className="workspace-message error" role="alert">{String(params.error)}</div>}
            <form action={submitWebsiteInquiry} className="consultation-form">
              <div className="name-grid"><div className="field"><label htmlFor="first-name">First name</label><input className="input" id="first-name" name="firstName" autoComplete="given-name" maxLength={60} required/></div><div className="field"><label htmlFor="middle-name">Middle name <span className="fine">(optional)</span></label><input className="input" id="middle-name" name="middleName" autoComplete="additional-name" maxLength={60}/></div><div className="field"><label htmlFor="last-name">Last name</label><input className="input" id="last-name" name="lastName" autoComplete="family-name" maxLength={60} required/></div></div>
              <div className="form-grid"><div className="field"><label htmlFor="email">Email address</label><input className="input" id="email" name="email" type="email" autoComplete="email" maxLength={200} required/></div><div className="field"><label htmlFor="phone">Phone number <span className="fine">(optional)</span></label><input className="input" id="phone" name="phone" type="tel" autoComplete="tel" maxLength={40}/></div></div>
              <div className="field"><label htmlFor="business-name">Business or project name</label><input className="input" id="business-name" name="businessName" maxLength={140} required/></div>
              <div className="form-grid"><div className="field"><label htmlFor="website-type">Website type</label><select className="select" id="website-type" name="websiteType" required><option value="local_business">Local business website</option><option value="professional">Professional or portfolio site</option><option value="catalogue">Product or service catalogue</option><option value="other">Something else</option></select></div><div className="field"><label htmlFor="budget-range"><WalletCards size={14}/> Budget range</label><select className="select" id="budget-range" name="budgetRange" required><option value="under_10000">Under ₱10,000</option><option value="10000_25000">₱10,000–₱25,000</option><option value="25000_50000">₱25,000–₱50,000</option><option value="50000_plus">₱50,000+</option><option value="not_sure">Not sure yet</option></select></div></div>
              <div className="field"><label htmlFor="domain-status">Domain</label><select className="select" id="domain-status" name="domainStatus" required><option value="need_domain">I need a new domain</option><option value="have_domain">I already own a domain</option><option value="not_sure">I need advice</option></select></div>
              <div className="form-grid"><div className="field"><label htmlFor="preferred-date">Preferred meeting date</label><input className="input" id="preferred-date" name="preferredDate" type="date" required/></div><div className="field"><label htmlFor="preferred-time">Preferred time</label><input className="input" id="preferred-time" name="preferredTime" type="time" required/></div></div>
              <div className="field"><label htmlFor="message">What should the website help you achieve?</label><textarea className="textarea" id="message" name="message" minLength={20} maxLength={2000} placeholder="Tell us about your business, required pages, and important features." required/></div>
              <div className="inquiry-honeypot" aria-hidden="true"><label htmlFor="website">Website</label><input id="website" name="website" tabIndex={-1} autoComplete="off"/></div>
              <button className="btn btn-primary" type="submit">Request consultation</button>
              <p className="fine">This is a meeting request, not an automatic booking. The developer will confirm availability by email.</p>
            </form>
          </>}
        </section>
      </main>
    </div>
  );
}
