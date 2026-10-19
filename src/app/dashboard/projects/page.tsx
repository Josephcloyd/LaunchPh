import Link from "next/link";
import { Plus } from "lucide-react";
import { ProjectWorkspace } from "@/features/dashboard/project-workspace";
import { requireUser } from "@/services/supabase-server";
import type { WorkspaceProject } from "@/types/workspace";

export default async function ProjectsPage() {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase.from("projects").select("id, name, project_type, status, updated_at, created_at").eq("owner_id", user.id).neq("status", "archived").order("updated_at", { ascending: false });
  return <div className="workspace-page"><header className="workspace-page-header"><div><p className="workspace-kicker">Projects</p><h1>Everything you’re building</h1><p>Search, organize, publish, and manage your creative work.</p></div><Link className="btn btn-primary btn-small" href="/dashboard/projects/new"><Plus size={16}/> New project</Link></header><section className="workspace-section workspace-section-main">{error ? <div className="workspace-error"><h2>Projects could not be loaded.</h2><p>{error.message}</p><Link className="btn btn-secondary btn-small" href="/dashboard/projects">Retry</Link></div> : <ProjectWorkspace projects={(data ?? []) as WorkspaceProject[]}/>}</section></div>;
}
