import { ArrowUpRight, Scale } from "lucide-react";
import { Cormorant_Garamond, Dancing_Script } from "next/font/google";

// Only used by the wedding preview, which mirrors the client's script and serif type.
const script = Dancing_Script({ subsets: ["latin"], weight: ["600"], display: "swap" });
const serif = Cormorant_Garamond({ subsets: ["latin"], weight: ["400"], style: ["italic", "normal"], display: "swap" });

// Simplified, code-drawn renditions of each client's live homepage.
function CanoyLawPreview() {
  return <div className="pv-law">
    <div className="pv-law-nav">
      <span className="pv-law-logo"><Scale size={13} strokeWidth={2.4}/>CANOY LAW</span>
      <span className="pv-law-links"><b>Home</b><span>About Us</span><span>Practice Areas</span><span>Contact Us</span></span>
      <span className="pv-law-book">Book a Consultation</span>
    </div>
    <div className="pv-law-hero">
      <span className="pv-law-watermark">CANOY</span>
      <strong className="pv-law-title"><Scale size={22} strokeWidth={1.8}/>CANOY LAW</strong>
      <span className="pv-law-subtitle">Law Office and Business Consulting Services</span>
      <span className="pv-law-actions"><span className="gold">Our Services</span><span className="ghost">Contact Us</span></span>
    </div>
  </div>;
}

function ThomasVanessaPreview() {
  return <div className="pv-wed">
    <span className="pv-wed-lang">EN / <u>DE</u></span>
    <div className="pv-wed-card">
      <span className="pv-wed-caps">Together with their families</span>
      <span className={`pv-wed-invite ${serif.className}`}>invite you to the wedding of</span>
      <strong className={`pv-wed-names ${script.className}`}>Thomas <span className={serif.className}>&amp;</span> Vanessa</strong>
      <span className="pv-wed-date">May 2027</span>
      <span className={`pv-wed-seal ${serif.className}`}>T <i>&amp;</i> V</span>
    </div>
  </div>;
}

const projects = [
  {
    name: "Canoy Law",
    domain: "canoy-law.com",
    url: "https://canoy-law.com",
    category: "Law office · Mandaue City, Cebu",
    copy: "A professional site for a law and business-consulting office, with practice areas, attorney profiles, office hours, and online consultation booking.",
    tags: ["Practice areas", "Attorney profiles", "Consultation booking"],
    Preview: CanoyLawPreview,
  },
  {
    name: "Thomas & Vanessa",
    domain: "vanessaandthomas.ch",
    url: "https://vanessaandthomas.ch",
    category: "Wedding website · Switzerland",
    copy: "A bilingual English and German wedding invitation with a tap-to-open envelope, countdown, venue directions, the day’s schedule, dress code, gift details, and RSVP.",
    tags: ["English / German", "Countdown", "RSVP"],
    Preview: ThomasVanessaPreview,
  },
] as const;

export function PortfolioShowcase() {
  return <div className="portfolio-grid">
    {projects.map(({ name, domain, url, category, copy, tags, Preview }) => <article className="portfolio-card glass" key={domain}>
      <a className="portfolio-preview" href={url} target="_blank" rel="noreferrer" aria-label={`Open ${domain}`}>
        <div className="portfolio-browser" aria-hidden="true"><i/><i/><i/><span>{domain}</span></div>
        <div aria-hidden="true"><Preview/></div>
      </a>
      <div className="portfolio-copy">
        <p className="portfolio-category">{category}</p>
        <h3>{name}</h3>
        <p>{copy}</p>
        <ul>{tags.map(tag => <li key={tag}>{tag}</li>)}</ul>
        <a className="text-link" href={url} target="_blank" rel="noreferrer">Visit {domain} <ArrowUpRight size={15}/></a>
      </div>
    </article>)}
  </div>;
}
