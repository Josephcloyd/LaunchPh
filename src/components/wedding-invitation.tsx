import { ExternalLink, MapPin } from "lucide-react";
import { formatPersonName } from "@/lib/person-name";
import { formatEventDate } from "@/lib/event-date";
import { buildGoogleMapsSearchUrl } from "@/lib/google-maps";
import type { WeddingDraft } from "@/types/wedding";

type WeddingInvitationProps = Omit<WeddingDraft, "projectId" | "projectName">;

export function WeddingInvitation(props: WeddingInvitationProps) {
  const displayDate = formatEventDate(props.date);
  const mapsUrl = props.mapUrl || buildGoogleMapsSearchUrl(props.venue);
  const details = <>
    <p className="date">{displayDate.toUpperCase()}</p>
    <p className="venue"><MapPin size={14} aria-hidden="true"/>{props.venue || "Event venue"}</p>
    {props.venue && <a className="wedding-map-link" href={mapsUrl} target="_blank" rel="noreferrer">Get directions <ExternalLink size={13} aria-hidden="true"/></a>}
  </>;

  if (props.eventKind === "debut") {
    const celebrant = formatPersonName({ firstName: props.celebrantFirstName, middleName: props.celebrantMiddleName, lastName: props.celebrantLastName });
    return <article className="wedding-canvas debut-canvas">
      <div className="monogram">{celebrant.charAt(0) || "D"}<sup>18</sup></div>
      <p className="pretitle">You are warmly invited to the debut of</p>
      <h2>{celebrant || "Celebrant"}</h2>
      <p>as we celebrate eighteen wonderful years</p>
      {details}
      {props.story && <div className="story-box"><h3>A note for you</h3><p>{props.story}</p></div>}
    </article>;
  }

  const bride = formatPersonName({ firstName: props.brideFirstName, middleName: props.brideMiddleName, lastName: props.brideLastName });
  const groom = formatPersonName({ firstName: props.groomFirstName, middleName: props.groomMiddleName, lastName: props.groomLastName });
  return <article className="wedding-canvas">
    <div className="monogram">{bride.charAt(0) || "L"} &amp; {groom.charAt(0) || "M"}</div>
    <p className="pretitle">Together with our families</p>
    <h2>{bride || "Bride"} <em style={{fontWeight:300}}>&amp;</em> {groom || "Groom"}</h2>
    <p>joyfully invite you to celebrate their wedding</p>
    {details}
    {props.story && <div className="story-box"><h3>Our story</h3><p>{props.story}</p></div>}
  </article>;
}
