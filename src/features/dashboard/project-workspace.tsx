"use client";

import Link from "next/link";
import { Copy, Ellipsis, ExternalLink, FileText, Heart, LayoutGrid, Pencil, Plus, Search, Send, Trash2, Users } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { deleteProject, duplicateProject, renameProject, setProjectPublished } from "@/app/dashboard/actions";
import type { MutationResult, WorkspaceProject } from "@/types/workspace";

const labels = { wedding: "Invitation", resume: "Resume (legacy)", portfolio: "Portfolio", business: "Business site" };
const editorLinks = { wedding: "/studio/wedding", resume: "/studio/resume", business: "/studio/business" } as const;

function ProjectIcon({ type }: { type: WorkspaceProject["project_type"] }) {
  return type === "wedding" ? <Heart size={17}/> : type === "resume" ? <FileText size={17}/> : <LayoutGrid size={17}/>;
}

export function ProjectWorkspace({ projects, compact = false }: { projects: WorkspaceProject[]; compact?: boolean }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("updated");
  const [visible, setVisible] = useState(compact ? 6 : 20);
  const [message, setMessage] = useState<MutationResult | null>(null);
  const [pending, startTransition] = useTransition();
  const filtered = useMemo(() => projects.filter(project =>
    project.name.toLowerCase().includes(query.toLowerCase()) &&
    (type === "all" || project.project_type === type) &&
    (status === "all" || project.status === status)
  ).sort((a, b) => sort === "name" ? a.name.localeCompare(b.name) : new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()), [projects, query, type, status, sort]);

  function run(action: () => Promise<MutationResult>) {
    setMessage(null);
    startTransition(() => { void action().then(setMessage); });
  }

  if (projects.length === 0) return <div className="workspace-empty"><span className="empty-icon"><FolderEmptyIcon/></span><h2>Your workspace is ready.</h2><p>Create your first website or wedding invitation.</p><Link className="btn btn-primary btn-small" href="/dashboard/projects/new"><Plus size={16}/> Create project</Link></div>;

  return <div className="project-workspace">
    {!compact && <div className="workspace-toolbar"><label className="workspace-search"><Search size={16}/><span className="sr-only">Search projects</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search projects"/></label><select value={type} onChange={event => setType(event.target.value)} aria-label="Filter by project type"><option value="all">All types</option><option value="wedding">Invitation</option><option value="portfolio">Portfolio</option><option value="business">Business site</option><option value="resume">Legacy resume</option></select><select value={status} onChange={event => setStatus(event.target.value)} aria-label="Filter by status"><option value="all">All statuses</option><option value="draft">Draft</option><option value="published">Published</option></select><select value={sort} onChange={event => setSort(event.target.value)} aria-label="Sort projects"><option value="updated">Recently updated</option><option value="name">Name</option></select></div>}
    {message && <div className={`workspace-message ${message.ok ? "success" : "error"}`} role="status">{message.message}</div>}
    <div className="project-table-wrap" aria-busy={pending}><table className="project-table"><thead><tr><th>Project</th><th>Type</th><th>Last modified</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{filtered.slice(0, visible).map(project => {
      const editor = project.project_type === "portfolio" ? null : `${editorLinks[project.project_type]}?project=${project.id}`;
      return <tr key={project.id}><td><div className="project-name-cell"><span className="project-type-icon"><ProjectIcon type={project.project_type}/></span><div><strong>{project.name}</strong><span>Updated project</span></div></div></td><td>{labels[project.project_type]}</td><td>{new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" }).format(new Date(project.updated_at))}</td><td><span className={`status-pill ${project.status}`}>{project.status}</span></td><td><details className="action-menu"><summary aria-label={`Actions for ${project.name}`}><Ellipsis size={18}/></summary><div className="action-menu-popover">{editor && <Link href={editor}><ExternalLink size={14}/> {project.project_type === "resume" ? "Open Resume Builder" : "Open editor"}</Link>}{project.project_type === "wedding" && <Link href={`/dashboard/projects/${project.id}/guests`}><Users size={14}/> Guest RSVPs</Link>}<button onClick={() => { const name = window.prompt("Rename project", project.name); if (name && name !== project.name) run(() => renameProject(project.id, name)); }}><Pencil size={14}/> Rename</button><button onClick={() => run(() => duplicateProject(project.id))}><Copy size={14}/> Duplicate</button><button onClick={() => run(() => setProjectPublished(project.id, project.status !== "published"))}><Send size={14}/> {project.status === "published" ? "Unpublish" : "Publish"}</button><button className="danger" onClick={() => { if (window.confirm(`Delete “${project.name}”? This cannot be undone.`)) run(() => deleteProject(project.id)); }}><Trash2 size={14}/> Delete</button></div></details></td></tr>;
    })}</tbody></table></div>
    {filtered.length === 0 && <div className="workspace-empty compact"><h3>No matching projects</h3><p>Try changing your search or filters.</p></div>}
    {!compact && visible < filtered.length && <button className="load-more" onClick={() => setVisible(value => value + 20)}>Load more projects</button>}
  </div>;
}

function FolderEmptyIcon() { return <LayoutGrid size={22}/>; }
