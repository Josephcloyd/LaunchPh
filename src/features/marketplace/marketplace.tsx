"use client";

import Link from "next/link";
import { ArrowUpRight, Search } from "lucide-react";
import { useMemo, useState } from "react";

const templates = [
  { name: "Evergreen Vows", type: "Wedding", price: "₱799", tone: "wedding", href: "/studio/wedding", description: "Editorial invitation with private RSVP tracking" },
  { name: "Studio Folio", type: "Portfolio", price: "₱299", tone: "business", href: "/checkout", description: "Minimal case-study portfolio for creative work" },
  { name: "Garden Ceremony", type: "Wedding", price: "₱799", tone: "wedding", href: "/studio/wedding", description: "Warm botanical invitation for an intimate celebration" },
  { name: "Local Table", type: "Business", price: "₱499", tone: "business", href: "/checkout", description: "Friendly restaurant site with menu and hours" },
];
const categories = ["All", "Wedding", "Portfolio", "Business"];

function Preview({ tone, name }: { tone: string; name: string }) {
  if (tone === "wedding") return <div className="mini-invite"><span className="fine">TOGETHER WITH THEIR FAMILIES</span><strong>{name === "Evergreen Vows" ? "Lea & Miguel" : "Ana & Paolo"}</strong><span className="fine">DECEMBER · TAGAYTAY</span></div>;
  return <div className="mini-site"><div className="mini-site-head"/><div className="mini-site-body"><strong>{name}</strong><div className="mini-line short"/><div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:22}}><div style={{height:55, background:"#d9e0da", borderRadius:7}}/><div style={{height:55, background:"#e6e2d9", borderRadius:7}}/></div></div></div>;
}

export function Marketplace() {
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => templates.filter(template => (category === "All" || template.type === category) && template.name.toLowerCase().includes(query.toLowerCase())), [category, query]);
  return <><div className="filter-row"><div className="filter-tabs" role="group" aria-label="Template categories">{categories.map(item => <button key={item} className={`filter-btn ${category === item ? "active" : ""}`} onClick={() => setCategory(item)}>{item}</button>)}</div><label className="field" style={{position:"relative", minWidth:240}}><span className="sr-only">Search templates</span><Search size={16} style={{position:"absolute", left:14, top:15}}/><input className="input" style={{paddingLeft:40}} value={query} onChange={event => setQuery(event.target.value)} placeholder="Search templates"/></label></div><div className="template-grid">{filtered.map(template => <article className="template-card glass" key={template.name}><div className={`template-preview ${template.tone}`}><Preview tone={template.tone} name={template.name}/></div><div className="template-info"><div className="template-meta"><h3>{template.name}</h3><strong>{template.price}</strong></div><p>{template.description}</p><Link className="text-link" href={template.href}>Use this template <ArrowUpRight size={14}/></Link></div></article>)}{filtered.length === 0 && <div className="panel glass" style={{gridColumn:"1 / -1", textAlign:"center"}}><h3>No templates found</h3><p className="muted" style={{marginTop:8}}>Try another search or category.</p></div>}</div></>;
}
