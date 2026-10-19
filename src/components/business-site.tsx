import { Clock, ExternalLink, Mail, MapPin, Phone } from "lucide-react";
import { MadeByCredit } from "@/components/made-by-credit";
import { SocialIcon } from "@/components/social-icons";
import { buildGoogleMapsEmbedUrl, buildGoogleMapsSearchUrl } from "@/lib/google-maps";
import { socialPlatformLabels, type SocialPlatform } from "@/lib/social-links";
import type { BusinessSiteContent } from "@/types/business";

export function BusinessSite(props: BusinessSiteContent) {
  const services = props.services.split("\n").map(line => line.trim()).filter(Boolean);
  const directionsUrl = props.mapUrl || (props.address ? buildGoogleMapsSearchUrl(props.address) : "");
  const phoneHref = props.phone ? `tel:${props.phone.replace(/[^\d+]/g, "")}` : "";
  const socials = ([["facebook", props.facebookUrl], ["instagram", props.instagramUrl], ["tiktok", props.tiktokUrl]] as [SocialPlatform, string][]).filter(([, url]) => url);

  return <article className="business-site">
    <header className="business-hero">
      {props.businessType && <p className="business-type">{props.businessType}</p>}
      <h2>{props.businessName || "Your business name"}</h2>
      {props.tagline && <p className="business-tagline">{props.tagline}</p>}
      <div className="business-actions">
        {phoneHref && <a className="business-btn primary" href={phoneHref}><Phone size={16} aria-hidden="true"/> Call us</a>}
        {directionsUrl && <a className="business-btn" href={directionsUrl} target="_blank" rel="noreferrer"><MapPin size={16} aria-hidden="true"/> Get directions</a>}
      </div>
      {socials.length > 0 && <ul className="business-socials" aria-label="Social media">{socials.map(([platform, url]) => <li key={platform}><a href={url} target="_blank" rel="noreferrer" aria-label={socialPlatformLabels[platform]}><SocialIcon platform={platform}/></a></li>)}</ul>}
    </header>

    {props.about && <section className="business-section"><h3>About us</h3><p className="business-about">{props.about}</p></section>}

    {services.length > 0 && <section className="business-section"><h3>What we offer</h3><ul className="business-services">{services.map((service, index) => <li key={`${index}-${service}`}>{service}</li>)}</ul></section>}

    {(props.hours || props.phone || props.email || props.address) && <section className="business-section business-info">
      {props.hours && <div><h3><Clock size={16} aria-hidden="true"/> Opening hours</h3><p className="business-hours">{props.hours}</p></div>}
      {(props.phone || props.email || props.address) && <div><h3><Phone size={16} aria-hidden="true"/> Contact</h3><ul className="business-contact">
        {props.phone && <li><a href={phoneHref}>{props.phone}</a></li>}
        {props.email && <li><a href={`mailto:${props.email}`}><Mail size={14} aria-hidden="true"/> {props.email}</a></li>}
        {props.address && <li><MapPin size={14} aria-hidden="true"/> {props.address}</li>}
      </ul></div>}
    </section>}

    {props.address && <section className="business-section business-map">
      <iframe title={`Map showing ${props.businessName || "the business"}`} src={buildGoogleMapsEmbedUrl(props.address)} loading="lazy" referrerPolicy="no-referrer-when-downgrade"/>
      {directionsUrl && <a className="business-map-link" href={directionsUrl} target="_blank" rel="noreferrer">Open in Google Maps <ExternalLink size={13} aria-hidden="true"/></a>}
    </section>}

    <footer className="business-footer">
      <span>© {new Date().getFullYear()} {props.businessName || "Your business"}</span>
      <MadeByCredit className="business-credit"/>
    </footer>
  </article>;
}
