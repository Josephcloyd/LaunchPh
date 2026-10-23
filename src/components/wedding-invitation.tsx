/* eslint-disable @next/next/no-img-element -- owner photos come from Supabase Storage, already resized on upload */
import { CalendarDays, ExternalLink, MapPin } from "lucide-react";
import { formatPersonName } from "@/lib/person-name";
import { formatEventDate } from "@/lib/event-date";
import { buildGoogleMapsSearchUrl } from "@/lib/google-maps";
import { invitationFontVariables } from "@/lib/invitation-fonts";
import { photoUrl } from "@/lib/site-design";
import type { WeddingDraft } from "@/types/wedding";

type WeddingInvitationProps = Omit<WeddingDraft, "projectId" | "projectName">;

export function WeddingInvitation(props: WeddingInvitationProps) {
  const { design } = props;
  const isDebut = props.eventKind === "debut";
  const displayDate = formatEventDate(props.date);
  const weekday = new Intl.DateTimeFormat("en-PH", { weekday: "long", timeZone: "UTC" }).format(new Date(`${props.date}T00:00:00Z`));
  const mapsUrl = props.mapUrl || buildGoogleMapsSearchUrl(props.venue);
  const layout = design.coverPhoto ? design.layout : "plain";

  const celebrant = formatPersonName({ firstName: props.celebrantFirstName, middleName: props.celebrantMiddleName, lastName: props.celebrantLastName });
  const bride = formatPersonName({ firstName: props.brideFirstName, middleName: props.brideMiddleName, lastName: props.brideLastName });
  const groom = formatPersonName({ firstName: props.groomFirstName, middleName: props.groomMiddleName, lastName: props.groomLastName });

  const monogram = isDebut
    ? <div className="monogram">{celebrant.charAt(0) || "D"}<sup>18</sup></div>
    : <div className="monogram">{bride.charAt(0) || "L"}<span>&amp;</span>{groom.charAt(0) || "M"}</div>;
  const heading = isDebut ? <>
    <p className="pretitle">You are warmly invited to the debut of</p>
    <h2 className="inv-names">{celebrant || "Celebrant"}</h2>
    <p className="inv-subline">as we celebrate eighteen wonderful years</p>
  </> : <>
    <p className="pretitle">Together with our families</p>
    <h2 className="inv-names">{bride || "Bride"} <span className="inv-amp">&amp;</span> {groom || "Groom"}</h2>
    <p className="inv-subline">joyfully invite you to celebrate their wedding</p>
  </>;

  return <article className={`wedding-canvas inv ${isDebut ? "debut-canvas" : ""} theme-${design.theme} font-${design.font} layout-${layout} ${invitationFontVariables}`}>
    {layout === "cover" && <header className="inv-cover">
      <img src={photoUrl(design.coverPhoto)} alt=""/>
      <div className="inv-cover-text">{heading}</div>
    </header>}
    <div className="inv-body">
      {layout !== "cover" && <div className="inv-heading">{monogram}{heading}</div>}
      {layout === "framed" && <figure className="inv-arch"><img src={photoUrl(design.coverPhoto)} alt=""/></figure>}
      <div className="inv-details">
        <div className="inv-detail"><CalendarDays size={18} aria-hidden="true"/><span className="inv-detail-label">{weekday}</span><strong className="date">{displayDate}</strong></div>
        <div className="inv-detail"><MapPin size={18} aria-hidden="true"/><span className="inv-detail-label">Venue</span><strong className="venue">{props.venue || "Event venue"}</strong>
          {props.venue && <a className="wedding-map-link" href={mapsUrl} target="_blank" rel="noreferrer">Get directions <ExternalLink size={13} aria-hidden="true"/></a>}
        </div>
      </div>
      {props.story && <section className="story-box"><span className="inv-ornament" aria-hidden="true">✦</span><h3>{isDebut ? "A note for you" : "Our story"}</h3><p>{props.story}</p></section>}
      {design.gallery.length > 0 && <section className="inv-gallery" aria-label="Photos">
        <h3>{isDebut ? "Moments" : "Our moments"}</h3>
        <div className={`inv-gallery-grid count-${design.gallery.length}`}>{design.gallery.map((path, index) => <img key={`${index}-${path}`} src={photoUrl(path)} alt="" loading="lazy" decoding="async"/>)}</div>
      </section>}
      <p className="inv-closing">{isDebut ? "We hope to celebrate with you" : "We can’t wait to celebrate with you"}</p>
    </div>
  </article>;
}
