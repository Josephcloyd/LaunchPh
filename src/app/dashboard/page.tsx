import Link from "next/link";
import { Bell, CheckCircle2, FileText, Plus, Send, Settings2 } from "lucide-react";
import { ProjectWorkspace } from "@/features/dashboard/project-workspace";
import { requireUser } from "@/services/supabase-server";
import type { WorkspaceActivity, WorkspaceProject } from "@/types/workspace";

function greeting(timezone: string) {
  const hour = Number(new Intl.DateTimeFormat("en-PH", { hour: "numeric", hourCycle: "h23", timeZone: timezone }).format(new Date()));
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}

function activityIcon(type: string) {
  if (type.includes("publish")) return <Send size={14}/>;
  if (type.includes("export")) return <FileText size={14}/>;
  if (type.includes("setting")) return <Settings2 size={14}/>;
  return <CheckCircle2 size={14}/>;
}

export default async function DashboardPage() {
  const { supabase, user } = await requireUser();
  const [profileResult, preferenceResult, projectResult, activityResult, notificationResult] = await Promise.all([
    supabase.from("profiles").select("first_name, full_name").eq("id", user.id).maybeSingle(),
    supabase.from("user_preferences").select("timezone").eq("user_id", user.id).maybeSingle(),
    supabase.from("projects").select("id, name, project_type, status, updated_at, created_at").eq("owner_id", user.id).neq("status", "archived").order("updated_at", { ascending: false }),
    supabase.from("activity_logs").select("id, event_type, summary, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).is("read_at", null),
  ]);
  const firstName = profileResult.data?.first_name?.trim() || user.user_metadata?.first_name || profileResult.data?.full_name?.trim().split(/\s+/)[0] || user.user_metadata?.full_name?.split(/\s+/)[0] || user.email?.split("@")[0] || "Creator";
  const timezone = preferenceResult.data?.timezone || "Asia/Manila";
  const projects = (projectResult.data ?? []) as WorkspaceProject[];
  const published = projects.filter(project => project.status === "published").length;
  const drafts = projects.filter(project => project.status === "draft").length;
  const activities = (activityResult.data ?? []) as WorkspaceActivity[];

  return <div className="workspace-page">
    <header className="workspace-page-header"><div><p className="workspace-kicker">{greeting(timezone)}, {firstName}</p><h1>Workspace</h1><p>Manage your projects and continue where you left off.</p></div><div className="workspace-header-actions">{(notificationResult.count ?? 0) > 0 && <span className="notification-button" aria-label={`${notificationResult.count} unread notifications`}><Bell size={17}/><span>{notificationResult.count}</span></span>}<Link className="btn btn-secondary btn-small" href="/dashboard/templates">Browse templates</Link><Link className="btn btn-primary btn-small" href="/dashboard/projects/new"><Plus size={16}/> New project</Link></div></header>

    {projectResult.error ? <div className="workspace-error"><h2>Projects are unavailable.</h2><p>{projectResult.error.message}</p><Link className="btn btn-secondary btn-small" href="/dashboard">Retry</Link></div> : <>
      <section className="project-summary" aria-label="Project summary"><div><strong>{projects.length}</strong><span>Total projects</span></div><i/><div><strong>{published}</strong><span>Published</span></div><i/><div><strong>{drafts}</strong><span>Drafts</span></div></section>
      <section className="workspace-section"><div className="workspace-section-head"><div><h2>My projects</h2><p>Your most recently updated work.</p></div>{projects.length > 6 && <Link href="/dashboard/projects">View all projects</Link>}</div><ProjectWorkspace projects={projects} compact/></section>
    </>}

    <section className="activity-strip"><div className="workspace-section-head"><div><h2>Recent activity</h2><p>Account events recorded by GetLaunch PH.</p></div></div>{activityResult.error ? <p className="compact-empty">Apply the latest workspace migration to enable activity history.</p> : activities.length === 0 ? <p className="compact-empty">No activity yet. Your project updates will appear here.</p> : <div className="activity-list">{activities.map(item => <div className="activity-line" key={item.id}><span>{activityIcon(item.event_type)}</span><p>{item.summary}</p><time dateTime={item.created_at}>{new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: timezone }).format(new Date(item.created_at))}</time></div>)}</div>}</section>
  </div>;
}
