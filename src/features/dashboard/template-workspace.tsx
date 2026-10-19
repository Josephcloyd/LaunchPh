"use client";

import Link from "next/link";
import { Heart, LayoutGrid, Search } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProjectFromTemplate } from "@/app/dashboard/actions";

export type TemplateRecord = { id: string; name: string; category: string; description: string | null; price_centavos: number | null; preview_path: string | null };

export function TemplateWorkspace({ templates }: { templates: TemplateRecord[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const categories = useMemo(() => Array.from(new Set(templates.map(item => item.category))), [templates]);
  const filtered = templates.filter(item => (category === "all" || item.category === category) && item.name.toLowerCase().includes(query.toLowerCase()));

  function handleUseTemplate(id: string) {
    setMessage("");
    startTransition(() => { void createProjectFromTemplate(id).then(result => { setMessage(result.message); if (result.ok) { router.push("/dashboard/projects"); router.refresh(); } }); });
  }

  if (templates.length === 0) return <div className="workspace-empty"><span className="empty-icon"><LayoutGrid size={22}/></span><h2>No published templates yet.</h2><p>Templates appear here after an administrator validates and publishes them.</p></div>;
  return <div className="dashboard-template-workspace"><div className="workspace-toolbar"><label className="workspace-search"><Search size={16}/><span className="sr-only">Search templates</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search templates"/></label><select value={category} onChange={event => setCategory(event.target.value)} aria-label="Filter template category"><option value="all">All categories</option>{categories.map(item => <option key={item} value={item}>{item}</option>)}</select></div>{message && <div className="workspace-message" role="status">{message}</div>}<div className="dashboard-template-grid">{filtered.map(template => { const lower = template.category.toLowerCase(); const Icon = lower.includes("wedding") ? Heart : LayoutGrid; const price = template.price_centavos ?? 0; return <article className="dashboard-template-item" key={template.id}><div className="template-visual"><Icon size={28}/><span>{template.category}</span></div><div className="template-copy"><div><h2>{template.name}</h2><strong>{price === 0 ? "Free" : `₱${(price / 100).toLocaleString("en-PH")}`}</strong></div><p>{template.description || "A validated GetLaunch PH template ready to customize."}</p>{price > 0 ? <Link className="btn btn-secondary btn-small" href="/checkout">View purchase options</Link> : <button className="btn btn-primary btn-small" disabled={pending} onClick={() => handleUseTemplate(template.id)}>{pending ? "Creating…" : "Use template"}</button>}</div></article>; })}</div>{filtered.length === 0 && <div className="workspace-empty compact"><h3>No matching templates</h3><p>Try another search or category.</p></div>}</div>;
}
