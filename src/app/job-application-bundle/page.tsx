import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Check, FileCheck2, Send, Sparkles } from "lucide-react";
import { submitJobApplicationInquiry } from "@/app/job-application-bundle/actions";
import { SiteHeader } from "@/components/site-header";
import { TurnstileWidget } from "@/components/turnstile-widget";

export const metadata: Metadata = {
  title: "Job Application Bundle",
  description: "Get a focused resume review, tailored cover letter, LinkedIn feedback, and practical application support.",
};

const inclusions = [
  "Resume review with clear, actionable improvements",
  "Cover letter tailored to a target role or job posting",
  "LinkedIn profile and professional-story review",
  "Portfolio positioning guidance when relevant",
  "Optional interview-preparation notes",
];

export default async function JobApplicationBundlePage({ searchParams }: PageProps<"/job-application-bundle">) {
  const params = await searchParams;
  // The separate resume builder is linked only once its address is configured.
  const resumeBuilderUrl = process.env.NEXT_PUBLIC_RESUME_BUILDER_URL?.startsWith("https://") ? process.env.NEXT_PUBLIC_RESUME_BUILDER_URL : null;
  return <div className="site-shell"><SiteHeader/><main className="container custom-service-page job-bundle-page">
    <section className="custom-service-intro"><p className="eyebrow"><Sparkles size={13}/> Career application support</p><h1>One focused package for your next opportunity.</h1><p>Bring the role you want and the materials you already have. We’ll help you turn them into a clear, consistent application that sounds like you.</p><div className="bundle-price"><strong>₱499</strong><span>one-time bundle</span></div><ul className="custom-feature-list">{inclusions.map(item => <li key={item}><span><Check size={15}/></span>{item}</li>)}</ul>{resumeBuilderUrl && <div className="custom-service-note glass"><FileCheck2 size={20}/><div><strong>Need a self-service resume builder?</strong><p>The builder now lives separately at <Link href={resumeBuilderUrl}>{new URL(resumeBuilderUrl).host} <ArrowUpRight size={12}/></Link>.</p></div></div>}</section>
    <section className="consultation-card glass" aria-labelledby="bundle-request-title"><div className="consultation-heading"><span><Send size={20}/></span><div><h2 id="bundle-request-title">Request your bundle</h2><p>Tell us where you’re applying and which materials need help.</p></div></div>
      {params.submitted ? <div className="consultation-success"><FileCheck2 size={32}/><h3>Application details received</h3><p>Your Job Application Bundle is ₱499. Continue to checkout to review the order.</p><Link className="btn btn-primary" href="/checkout?product=job-application-bundle">Continue to checkout — ₱499</Link></div> : <>{params.error && <div className="workspace-message error" role="alert">{String(params.error)}</div>}<form action={submitJobApplicationInquiry} className="consultation-form">
        <div className="name-grid"><div className="field"><label htmlFor="first-name">First name</label><input className="input" id="first-name" name="firstName" autoComplete="given-name" maxLength={60} required/></div><div className="field"><label htmlFor="middle-name">Middle name <span className="fine">(optional)</span></label><input className="input" id="middle-name" name="middleName" autoComplete="additional-name" maxLength={60}/></div><div className="field"><label htmlFor="last-name">Last name</label><input className="input" id="last-name" name="lastName" autoComplete="family-name" maxLength={60} required/></div></div>
        <div className="form-grid"><div className="field"><label htmlFor="email">Email address</label><input className="input" id="email" name="email" type="email" autoComplete="email" maxLength={200} required/></div><div className="field"><label htmlFor="phone">Phone number <span className="fine">(optional)</span></label><input className="input" id="phone" name="phone" type="tel" autoComplete="tel" maxLength={40}/></div></div>
        <div className="form-grid"><div className="field"><label htmlFor="target-role">Target role</label><input className="input" id="target-role" name="targetRole" maxLength={140} placeholder="e.g. Junior Data Analyst" required/></div><div className="field"><label htmlFor="experience-level">Experience level</label><select className="select" id="experience-level" name="experienceLevel" required><option value="student">Student or fresh graduate</option><option value="entry">Entry level</option><option value="mid">Mid-career</option><option value="senior">Senior or leadership</option><option value="career_change">Career changer</option></select></div></div>
        <fieldset className="bundle-options"><legend>What help do you need?</legend><label><input type="checkbox" name="requestedServices" value="resume_review" defaultChecked/><span>Resume review</span></label><label><input type="checkbox" name="requestedServices" value="cover_letter"/><span>Tailored cover letter</span></label><label><input type="checkbox" name="requestedServices" value="linkedin_review"/><span>LinkedIn review</span></label><label><input type="checkbox" name="requestedServices" value="portfolio_review"/><span>Portfolio review</span></label><label><input type="checkbox" name="requestedServices" value="interview_prep"/><span>Interview preparation</span></label></fieldset>
        <div className="form-grid"><div className="field"><label htmlFor="job-posting">Job posting URL <span className="fine">(optional)</span></label><input className="input" id="job-posting" name="jobPostingUrl" type="url" placeholder="https://…" maxLength={1000}/></div><div className="field"><label htmlFor="linkedin-url">LinkedIn URL <span className="fine">(optional)</span></label><input className="input" id="linkedin-url" name="linkedInUrl" type="url" placeholder="https://linkedin.com/in/…" maxLength={1000}/></div></div>
        <div className="field"><label htmlFor="message">What would you like to improve?</label><textarea className="textarea" id="message" name="message" minLength={20} maxLength={2000} placeholder="Tell us about your target role, current materials, deadline, and biggest concern." required/></div><div className="inquiry-honeypot" aria-hidden="true"><label htmlFor="website">Website</label><input id="website" name="website" tabIndex={-1} autoComplete="off"/></div><TurnstileWidget/><button className="btn btn-primary" type="submit">Submit application details</button><p className="fine">The complete bundle is ₱499. No payment is collected until secure payments are connected.</p>
      </form></>}
    </section>
  </main></div>;
}

