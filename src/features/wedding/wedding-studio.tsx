"use client";

import Link from "next/link";
import { ArrowLeft, Check, ExternalLink, Eye, Heart, LoaderCircle, MapPinned, Send, Sparkles, TriangleAlert, Users } from "lucide-react";
import { useState } from "react";
import { saveWeddingDraft } from "@/app/studio/wedding/actions";
import { DebutSouvenir } from "@/components/debut-souvenir";
import { WeddingInvitation } from "@/components/wedding-invitation";
import { checkoutProducts } from "@/lib/checkout-products";
import { formatEventDate } from "@/lib/event-date";
import { formatPersonName } from "@/lib/person-name";
import { buildGoogleMapsSearchUrl } from "@/lib/google-maps";
import { useAutosave } from "@/lib/use-autosave";
import type { WeddingDraft } from "@/types/wedding";

const invitationKinds = [
  { value: "wedding", label: "Wedding", price: checkoutProducts["wedding-invitation"].price, Icon: Heart },
  { value: "debut", label: "Debut", price: checkoutProducts["debut-invitation"].price, Icon: Sparkles },
] as const;

export function WeddingStudio({ initialDraft }: { initialDraft: WeddingDraft }) {
  const [draft, setDraft] = useState(initialDraft);
  const { saveState, saveMessage } = useAutosave(draft, saveWeddingDraft);

  function update<K extends keyof WeddingDraft>(key: K, value: WeddingDraft[K]) {
    setDraft(current => ({ ...current, [key]: value }));
  }

  const isDebut = draft.eventKind === "debut";
  const SaveIcon = saveState === "saving" ? LoaderCircle : saveState === "error" ? TriangleAlert : Check;

  return <div className="site-shell studio-layout">
    <header className="studio-topbar">
      <div className="studio-title">
        <Link className="icon-button" href="/dashboard" aria-label="Back to dashboard"><ArrowLeft size={17}/></Link>
        <div><h1>{draft.projectName}</h1><span className={`save-status ${saveState}`} role="status"><SaveIcon size={12}/>{saveMessage}</span></div>
      </div>
      <div className="top-actions">
        <Link className="btn btn-secondary btn-small" href={`/dashboard/projects/${draft.projectId}/guests`}><Users size={15}/> Guest RSVPs</Link>
        <button className="btn btn-secondary btn-small" type="button" onClick={() => document.querySelector(".wedding-canvas")?.scrollIntoView({ behavior: "smooth" })}><Eye size={15}/> Preview</button>
        <Link className="btn btn-primary btn-small" href={`/checkout?product=${isDebut ? "debut-invitation" : "wedding-invitation"}&project=${draft.projectId}`}><Send size={15}/> Continue to publish</Link>
      </div>
    </header>
    <div className="studio-body">
      <aside className="editor-panel" aria-label="Invitation settings">
        {saveState === "error" && <div className="notice error-notice" style={{marginBottom:20}}>Your invitation is still visible here, but the latest changes are not stored yet.</div>}
        <section className="editor-section"><h2>Invitation type</h2>
          <div className="kind-toggle" role="radiogroup" aria-label="Invitation type">
            {invitationKinds.map(({ value, label, price, Icon }) => <label key={value} className={draft.eventKind === value ? "active" : ""}><input type="radio" name="event-kind" value={value} checked={draft.eventKind === value} onChange={() => update("eventKind", value)}/><Icon size={17}/><span><strong>{label}</strong><small>₱{price.toLocaleString("en-PH")}</small></span></label>)}
          </div>
        </section>
        <section className="editor-section"><h2>{isDebut ? "Celebrant details" : "Couple details"}</h2><div className="form-stack">
          {isDebut ? <>
            <p className="fine">Celebrant&apos;s name</p>
            <div className="field"><label htmlFor="celebrant-first-name">First name</label><input id="celebrant-first-name" className="input" value={draft.celebrantFirstName} maxLength={80} onChange={event => update("celebrantFirstName", event.target.value)}/></div>
            <div className="field"><label htmlFor="celebrant-middle-name">Middle name <span className="fine">(optional)</span></label><input id="celebrant-middle-name" className="input" value={draft.celebrantMiddleName} maxLength={80} onChange={event => update("celebrantMiddleName", event.target.value)}/></div>
            <div className="field"><label htmlFor="celebrant-last-name">Last name</label><input id="celebrant-last-name" className="input" value={draft.celebrantLastName} maxLength={80} onChange={event => update("celebrantLastName", event.target.value)}/></div>
          </> : <>
            <p className="fine">Bride&apos;s name</p>
            <div className="field"><label htmlFor="bride-first-name">First name</label><input id="bride-first-name" className="input" value={draft.brideFirstName} maxLength={80} onChange={event => update("brideFirstName", event.target.value)}/></div>
            <div className="field"><label htmlFor="bride-middle-name">Middle name <span className="fine">(optional)</span></label><input id="bride-middle-name" className="input" value={draft.brideMiddleName} maxLength={80} onChange={event => update("brideMiddleName", event.target.value)}/></div>
            <div className="field"><label htmlFor="bride-last-name">Last name</label><input id="bride-last-name" className="input" value={draft.brideLastName} maxLength={80} onChange={event => update("brideLastName", event.target.value)}/></div>
            <p className="fine">Groom&apos;s name</p>
            <div className="field"><label htmlFor="groom-first-name">First name</label><input id="groom-first-name" className="input" value={draft.groomFirstName} maxLength={80} onChange={event => update("groomFirstName", event.target.value)}/></div>
            <div className="field"><label htmlFor="groom-middle-name">Middle name <span className="fine">(optional)</span></label><input id="groom-middle-name" className="input" value={draft.groomMiddleName} maxLength={80} onChange={event => update("groomMiddleName", event.target.value)}/></div>
            <div className="field"><label htmlFor="groom-last-name">Last name</label><input id="groom-last-name" className="input" value={draft.groomLastName} maxLength={80} onChange={event => update("groomLastName", event.target.value)}/></div>
          </>}
          <div className="field"><label htmlFor="date">{isDebut ? "Debut date" : "Wedding date"}</label><input id="date" className="input" type="date" value={draft.date} onChange={event => update("date", event.target.value)}/></div>
          <div className="field"><label htmlFor="venue">Venue</label><input id="venue" className="input" value={draft.venue} maxLength={160} onChange={event => update("venue", event.target.value)}/><a className="maps-search-link" href={buildGoogleMapsSearchUrl(draft.venue)} target="_blank" rel="noreferrer" aria-disabled={!draft.venue.trim()}><MapPinned size={14}/> Search this venue on Google Maps <ExternalLink size={12}/></a></div>
          <div className="field"><label htmlFor="map-url">Google Maps link <span className="fine">(optional)</span></label><input id="map-url" className="input" type="url" inputMode="url" value={draft.mapUrl} maxLength={2048} placeholder="Paste the venue’s Google Maps share link" onChange={event => update("mapUrl", event.target.value)}/><span className="field-help">In Google Maps, open the correct venue, choose Share, then paste its link here for exact directions.</span></div>
        </div></section>
        <section className="editor-section"><h2>{isDebut ? "Message to guests" : "Our story"}</h2><div className="field"><label htmlFor="story">Short message</label><textarea id="story" className="textarea" value={draft.story} maxLength={800} onChange={event => update("story", event.target.value)}/><span className="field-counter">{draft.story.length}/800</span></div></section>
        {isDebut && <section className="editor-section"><h2>Digital souvenirs</h2><div className="form-stack">
          <p className="fine">From the debut date, guests can save a thank-you keepsake card. Guests using their private link see their own name on it.</p>
          <div className="field"><label htmlFor="souvenir-message">Thank-you message</label><textarea id="souvenir-message" className="textarea" value={draft.souvenirMessage} maxLength={300} onChange={event => update("souvenirMessage", event.target.value)}/><span className="field-counter">{draft.souvenirMessage.length}/300</span></div>
          <div className="field"><label htmlFor="photo-album-url">Photo album link <span className="fine">(optional)</span></label><input id="photo-album-url" className="input" type="url" inputMode="url" value={draft.photoAlbumUrl} maxLength={2048} placeholder="https://photos.app.goo.gl/…" onChange={event => update("photoAlbumUrl", event.target.value)}/><span className="field-help">Share a Google Photos or Google Drive album so guests can view and download pictures from the night. You can add it after the debut.</span></div>
        </div></section>}
        <section className="editor-section"><h2>More guest features</h2><p className="fine">Guest photo uploads are planned after the initial launch.</p></section>
      </aside>
      <main className="canvas-area">
        <WeddingInvitation {...draft}/>
        {isDebut && <DebutSouvenir preview celebrantName={formatPersonName({ firstName: draft.celebrantFirstName, middleName: draft.celebrantMiddleName, lastName: draft.celebrantLastName })} displayDate={formatEventDate(draft.date)} message={draft.souvenirMessage} photoAlbumUrl={draft.photoAlbumUrl}/>}
      </main>
    </div>
  </div>;
}
