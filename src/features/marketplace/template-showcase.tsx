import Link from "next/link";
import { ArrowUpRight, Check, MousePointer2 } from "lucide-react";
import { BusinessSite } from "@/components/business-site";
import { WeddingInvitation } from "@/components/wedding-invitation";
import type { BusinessSiteContent } from "@/types/business";
import type { WeddingDraft } from "@/types/wedding";

type InvitationSample = Omit<WeddingDraft, "projectId" | "projectName">;

const blankInvitation = {
  brideFirstName: "", brideMiddleName: "", brideLastName: "",
  groomFirstName: "", groomMiddleName: "", groomLastName: "",
  celebrantFirstName: "", celebrantMiddleName: "", celebrantLastName: "",
  mapUrl: "", souvenirMessage: "", photoAlbumUrl: "",
};

const weddingSample: InvitationSample = {
  ...blankInvitation,
  eventKind: "wedding",
  brideFirstName: "Lea", brideLastName: "Santos",
  groomFirstName: "Miguel", groomLastName: "Reyes",
  date: "2026-12-18",
  venue: "Chapel on the Hill, Tagaytay",
  story: "We met on a rainy Tuesday in Makati and have been sharing umbrellas ever since. We can’t wait to celebrate with the people who made our story possible.",
};

const debutSample: InvitationSample = {
  ...blankInvitation,
  eventKind: "debut",
  celebrantFirstName: "Bea", celebrantLastName: "Villanueva",
  date: "2027-02-14",
  venue: "The Grand Ballroom, Quezon City",
  story: "Eighteen years of laughter, growing up, and wonderful people. Please join me for a night of roses, candles, and dancing.",
};

// No address on purpose: an address embeds a live Google Map iframe in the preview.
const businessSample: BusinessSiteContent = {
  businessName: "Kape Kalye",
  businessType: "Coffee shop · Cebu City",
  tagline: "Small-batch Filipino coffee, brewed slow and served with a smile.",
  about: "A neighborhood café roasting beans from Benguet and Mt. Apo. Come for the barako, stay for the ensaymada.",
  services: "Hand-brewed coffee\nPastries baked daily\nCoworking corner with Wi-Fi\nEvent catering",
  phone: "+63 917 123 4567",
  email: "hello@kapekalye.ph",
  hours: "Mon–Sat · 7:00 AM – 9:00 PM\nSunday · 8:00 AM – 6:00 PM",
  address: "",
  mapUrl: "https://maps.google.com/?q=Cebu+City",
  facebookUrl: "https://www.facebook.com/",
  instagramUrl: "https://www.instagram.com/",
  tiktokUrl: "",
};

export const templates = [
  {
    id: "wedding",
    name: "Evergreen Vows",
    category: "Wedding invitation",
    price: "₱799",
    suffix: "one-time",
    description: "A timeless editorial invitation in soft ivory and sage, with your story, the venue, and directions on one elegant page.",
    features: ["Your own invitation link", "Private RSVP link for every guest", "Guest responses in your dashboard", "Update details any time after publishing"],
    url: "launchph.ph/wedding/lea-and-miguel",
    href: "/dashboard/projects/new",
    cta: "Create my invitation",
    preview: <WeddingInvitation {...weddingSample}/>,
  },
  {
    id: "debut",
    name: "Debut Invitation",
    category: "18th birthday",
    price: "₱999",
    suffix: "one-time",
    description: "A graceful invitation for an unforgettable 18th, with guest RSVPs and digital souvenirs to remember the night.",
    features: ["Your own invitation link", "Private RSVP link for every guest", "Keepsake card for every guest", "Photo album link to share memories"],
    url: "launchph.ph/wedding/bea-turns-18",
    href: "/dashboard/projects/new?type=debut",
    cta: "Create my debut invitation",
    preview: <WeddingInvitation {...debutSample}/>,
  },
  {
    id: "business",
    name: "Business Website",
    category: "Small business",
    price: "₱499",
    suffix: "/ month",
    description: "A clean one-page site that tells customers what you offer, when you’re open, and how to reach you.",
    features: ["Services, hours, and contact details", "Google Map and directions", "Facebook, Instagram, and TikTok links", "Hosting and HTTPS included"],
    url: "launchph.ph/site/kape-kalye",
    href: "/dashboard/projects/new?type=business",
    cta: "Create my business site",
    preview: <BusinessSite {...businessSample}/>,
  },
];

export function TemplateShowcase() {
  return <div className="tpl-list">
    {templates.map((template, index) => <article className="tpl-row" id={template.id} key={template.id}>
      <div className="tpl-device" data-reveal>
        <div className="tpl-browser" aria-hidden="true"><i/><i/><i/><span>{template.url}</span></div>
        {/* The same component customers publish, shrunk to fit. Hovering scrolls through it. */}
        <div className="tpl-screen" inert>
          <div className="tpl-zoom">{template.preview}</div>
        </div>
        <span className="tpl-hint" aria-hidden="true"><MousePointer2 size={13}/> Hover to scroll</span>
      </div>
      <div className="tpl-copy" data-reveal>
        <p className="tpl-index">{String(index + 1).padStart(2, "0")} <span>{template.category}</span></p>
        <h2>{template.name}</h2>
        <p className="tpl-description">{template.description}</p>
        <ul>{template.features.map(feature => <li key={feature}><Check size={15}/>{feature}</li>)}</ul>
        <div className="tpl-buy">
          <div className="tpl-price">{template.price}<small>{template.suffix}</small></div>
          <Link className="btn btn-primary" href={template.href}>{template.cta} <ArrowUpRight size={16}/></Link>
        </div>
        <p className="fine">Free to design and preview. Pay only when you publish.</p>
      </div>
    </article>)}
  </div>;
}
