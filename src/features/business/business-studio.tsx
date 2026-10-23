"use client";

import Link from "next/link";
import { ArrowLeft, CalendarCheck, Check, ExternalLink, Eye, LoaderCircle, MapPinned, Send, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { saveBusinessDraft } from "@/app/studio/business/actions";
import { BusinessSite } from "@/components/business-site";
import { buildGoogleMapsSearchUrl } from "@/lib/google-maps";
import { useAutosave } from "@/lib/use-autosave";
import type { BusinessDraft } from "@/types/business";

type TextField = Exclude<keyof BusinessDraft, "projectId" | "projectName" | "bookingEnabled">;

export function BusinessStudio({ initialDraft }: { initialDraft: BusinessDraft }) {
  const [draft, setDraft] = useState(initialDraft);
  const { saveState, saveMessage } = useAutosave(draft, saveBusinessDraft);

  function field(key: TextField, label: string, options: { optional?: boolean; maxLength: number; type?: string; placeholder?: string; help?: string; multiline?: boolean }) {
    const id = `business-${key}`;
    const props = { id, value: draft[key], maxLength: options.maxLength, placeholder: options.placeholder, onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(current => ({ ...current, [key]: event.target.value })) };
    return <div className="field">
      <label htmlFor={id}>{label}{options.optional && <> <span className="fine">(optional)</span></>}</label>
      {options.multiline ? <textarea className="textarea" {...props}/> : <input className="input" type={options.type ?? "text"} {...props}/>}
      {options.help && <span className="field-help">{options.help}</span>}
    </div>;
  }

  const SaveIcon = saveState === "saving" ? LoaderCircle : saveState === "error" ? TriangleAlert : Check;

  return <div className="site-shell studio-layout">
    <header className="studio-topbar">
      <div className="studio-title">
        <Link className="icon-button" href="/dashboard" aria-label="Back to dashboard"><ArrowLeft size={17}/></Link>
        <div><h1>{draft.projectName}</h1><span className={`save-status ${saveState}`} role="status"><SaveIcon size={12}/>{saveMessage}</span></div>
      </div>
      <div className="top-actions">
        <button className="btn btn-secondary btn-small" type="button" onClick={() => document.querySelector(".business-site")?.scrollIntoView({ behavior: "smooth" })}><Eye size={15}/> Preview</button>
        <Link className="btn btn-primary btn-small" href={`/checkout?product=business-site&project=${draft.projectId}`}><Send size={15}/> Publish · ₱499/month</Link>
      </div>
    </header>
    <div className="studio-body">
      <aside className="editor-panel" aria-label="Business site settings">
        {saveState === "error" && <div className="notice error-notice" style={{marginBottom:20}}>Your page is still visible here, but the latest changes are not stored yet.</div>}
        <section className="editor-section"><h2>Business</h2><div className="form-stack">
          {field("businessName", "Business name", { maxLength: 120 })}
          {field("businessType", "Type of business", { optional: true, maxLength: 60, placeholder: "e.g. Salon, carinderia, law office" })}
          {field("tagline", "Tagline", { optional: true, maxLength: 140, placeholder: "One sentence about what you do best" })}
          {field("about", "About", { optional: true, maxLength: 1000, multiline: true })}
          {field("services", "Products or services", { optional: true, maxLength: 1500, multiline: true, help: "Put each product or service on its own line." })}
        </div></section>
        <section className="editor-section"><h2>Contact and hours</h2><div className="form-stack">
          {field("phone", "Phone number", { optional: true, maxLength: 40, type: "tel", placeholder: "0917 123 4567" })}
          {field("email", "Email address", { optional: true, maxLength: 200, type: "email" })}
          {field("hours", "Opening hours", { optional: true, maxLength: 300, multiline: true, placeholder: "Monday to Saturday, 9:00 AM – 6:00 PM" })}
        </div></section>
        <section className="editor-section"><h2>Location</h2><div className="form-stack">
          <div className="field">
            <label htmlFor="business-address">Address <span className="fine">(shown on the map)</span></label>
            <input id="business-address" className="input" value={draft.address} maxLength={240} onChange={event => setDraft(current => ({ ...current, address: event.target.value }))}/>
            <a className="maps-search-link" href={buildGoogleMapsSearchUrl(draft.address)} target="_blank" rel="noreferrer" aria-disabled={!draft.address.trim()}><MapPinned size={14}/> Check this address on Google Maps <ExternalLink size={12}/></a>
          </div>
          {field("mapUrl", "Google Maps link", { optional: true, maxLength: 2048, type: "url", placeholder: "Paste your Google Maps share link", help: "Used for the Get directions button. In Google Maps, open your business, choose Share, then paste the link here." })}
        </div></section>
        <section className="editor-section"><h2>Social media</h2><div className="form-stack">
          {field("facebookUrl", "Facebook page", { optional: true, maxLength: 500, type: "url", placeholder: "https://facebook.com/yourpage" })}
          {field("instagramUrl", "Instagram", { optional: true, maxLength: 500, type: "url", placeholder: "https://instagram.com/yourname" })}
          {field("tiktokUrl", "TikTok", { optional: true, maxLength: 500, type: "url", placeholder: "https://tiktok.com/@yourname" })}
        </div></section>
        <section className="editor-section"><h2>Bookings</h2><div className="form-stack">
          <label className="consent-check"><input type="checkbox" checked={draft.bookingEnabled} onChange={event => setDraft(current => ({ ...current, bookingEnabled: event.target.checked }))}/><span>Let customers send booking requests from my site</span></label>
          <p className="field-help">Each request is emailed to your account email and listed under Bookings, so you can call or message the customer to confirm.</p>
          <Link className="maps-search-link" href={`/dashboard/projects/${draft.projectId}/bookings`}><CalendarCheck size={14}/> View booking requests</Link>
        </div></section>
      </aside>
      <main className="canvas-area"><BusinessSite {...draft}/></main>
    </div>
  </div>;
}
