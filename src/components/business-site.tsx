/* eslint-disable @next/next/no-img-element -- owner photos come from Supabase Storage, already resized on upload */
import { CalendarCheck, Clock, ExternalLink, Images, Mail, MapPin, Phone } from "lucide-react";
import { MadeByCredit } from "@/components/made-by-credit";
import { SocialIcon } from "@/components/social-icons";
import { BookingForm } from "@/features/business/booking-form";
import { buildGoogleMapsEmbedUrl, buildGoogleMapsSearchUrl } from "@/lib/google-maps";
import { photoUrl } from "@/lib/site-design";
import { socialPlatformLabels, type SocialPlatform } from "@/lib/social-links";
import type { BusinessSiteContent } from "@/types/business";

/** `slug` is set on the live site, where the booking form sends requests; elsewhere it is a preview. */
export function BusinessSite({ slug, ...props }: BusinessSiteContent & { slug?: string }) {
  const services = props.services.split("\n").map(line => line.trim()).filter(Boolean);
  const directionsUrl = props.mapUrl || (props.address ? buildGoogleMapsSearchUrl(props.address) : "");
  const phoneHref = props.phone ? `tel:${props.phone.replace(/[^\d+]/g, "")}` : "";
  const socials = ([["facebook", props.facebookUrl], ["instagram", props.instagramUrl], ["tiktok", props.tiktokUrl]] as [SocialPlatform, string][]).filter(([, url]) => url);

  const { logo, coverPhoto, gallery } = props.design;

  return <article className={`business-site biz-theme-${props.design.theme} biz-font-${props.design.font}`}>
    <header className={coverPhoto ? "business-hero has-cover" : "business-hero"}>
      {coverPhoto && <img className="business-hero-photo" src={photoUrl(coverPhoto)} alt=""/>}
      {logo && <img className="business-logo" src={photoUrl(logo)} alt={`${props.businessName} logo`}/>}
      {props.businessType && <p className="business-type">{props.businessType}</p>}
      <h2>{props.businessName || "Your business name"}</h2>
      {props.tagline && <p className="business-tagline">{props.tagline}</p>}
      <div className="business-actions">
        {props.bookingEnabled && <a className="business-btn primary" href="#booking"><CalendarCheck size={16} aria-hidden="true"/> Book now</a>}
        {phoneHref && <a className={props.bookingEnabled ? "business-btn" : "business-btn primary"} href={phoneHref}><Phone size={16} aria-hidden="true"/> Call us</a>}
        {directionsUrl && <a className="business-btn" href={directionsUrl} target="_blank" rel="noreferrer"><MapPin size={16} aria-hidden="true"/> Get directions</a>}
      </div>
      {socials.length > 0 && <ul className="business-socials" aria-label="Social media">{socials.map(([platform, url]) => <li key={platform}><a href={url} target="_blank" rel="noreferrer" aria-label={socialPlatformLabels[platform]}><SocialIcon platform={platform}/></a></li>)}</ul>}
    </header>

    {props.about && <section className="business-section"><h3>About us</h3><p className="business-about">{props.about}</p></section>}

    {services.length > 0 && <section className="business-section"><h3>What we offer</h3><ul className="business-services">{services.map((service, index) => <li key={`${index}-${service}`}>{service}</li>)}</ul></section>}

    {gallery.length > 0 && <section className="business-section business-gallery"><h3><Images size={16} aria-hidden="true"/> Gallery</h3><div className={`business-gallery-grid count-${gallery.length}`}>{gallery.map((path, index) => <img key={`${index}-${path}`} src={photoUrl(path)} alt="" loading="lazy" decoding="async"/>)}</div></section>}

    {props.bookingEnabled && <BookingForm slug={slug} businessName={props.businessName} services={services}/>}

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
