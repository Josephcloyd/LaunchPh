"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/services/supabase-server";
import type { MutationResult, ProjectType } from "@/types/workspace";

const projectSchema = z.object({
  name: z.string().trim().min(2, "Use at least 2 characters.").max(90, "Keep names under 90 characters."),
  projectType: z.enum(["wedding", "debut", "portfolio", "business"]),
});

type ServerSupabaseClient = Awaited<ReturnType<typeof requireUser>>["supabase"];

async function ensureProjectOwnerProfile(supabase: ServerSupabaseClient, userId: string): Promise<MutationResult> {
  const { data: profile } = await supabase.from("profiles").select("id").eq("id", userId).maybeSingle();
  if (profile) return { ok: true, message: "Account ready." };

  const { error } = await supabase.rpc("ensure_current_user_profile");
  if (error) return { ok: false, message: "Your account setup is incomplete. Apply the latest Supabase migration, then try again." };
  return { ok: true, message: "Account ready." };
}

async function recordActivity(userId: string, eventType: string, summary: string, projectId?: string) {
  const { supabase } = await requireUser();
  await supabase.from("activity_logs").insert({ user_id: userId, project_id: projectId ?? null, event_type: eventType, summary });
}

function editorPath(type: ProjectType, id: string, debut = false) {
  if (type === "wedding") return `/studio/wedding?project=${id}${debut ? "&kind=debut" : ""}`;
  if (type === "resume") return `/studio/resume?project=${id}`;
  if (type === "business") return `/studio/business?project=${id}`;
  return "/dashboard/projects";
}

export async function createProject(formData: FormData) {
  const parsed = projectSchema.safeParse({ name: formData.get("name"), projectType: formData.get("projectType") });
  if (!parsed.success) redirect(`/dashboard/projects/new?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid project")}`);
  const { supabase, user } = await requireUser();
  const account = await ensureProjectOwnerProfile(supabase, user.id);
  if (!account.ok) redirect(`/dashboard/projects/new?error=${encodeURIComponent(account.message)}`);
  // Debuts are invitation projects; the editor stores the kind on first save.
  const isDebut = parsed.data.projectType === "debut";
  const { data, error } = await supabase.from("projects").insert({ owner_id: user.id, name: parsed.data.name, project_type: isDebut ? "wedding" : parsed.data.projectType, status: "draft" }).select("id, project_type").single();
  if (error || !data) redirect(`/dashboard/projects/new?error=${encodeURIComponent("Project could not be created. Please try again.")}`);
  await recordActivity(user.id, "project_created", `Created “${parsed.data.name}”.`, data.id);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects");
  redirect(editorPath(data.project_type as ProjectType, data.id, isDebut));
}

export async function createProjectFromTemplate(templateId: string): Promise<MutationResult> {
  const { supabase, user } = await requireUser();
  const account = await ensureProjectOwnerProfile(supabase, user.id);
  if (!account.ok) return account;
  const { data: template, error: templateError } = await supabase.from("templates").select("id, name, category, price_centavos").eq("id", templateId).eq("status", "published").maybeSingle();
  if (templateError || !template) return { ok: false, message: "This template is not available." };
  if ((template.price_centavos ?? 0) > 0) return { ok: false, message: "Purchase this premium template before creating a project." };
  const category = String(template.category).toLowerCase();
  if (category.includes("resume")) return { ok: false, message: "Resume templates have moved to the separate Resume Builder." };
  const projectType: ProjectType = category.includes("wedding") ? "wedding" : category.includes("portfolio") ? "portfolio" : "business";
  const { data, error } = await supabase.from("projects").insert({ owner_id: user.id, template_id: template.id, name: `My ${template.name}`, project_type: projectType, status: "draft" }).select("id").single();
  if (error || !data) return { ok: false, message: error?.message ?? "Project could not be created." };
  await recordActivity(user.id, "project_created", `Created a project from “${template.name}”.`, data.id);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects");
  return { ok: true, message: "Project created." };
}

export async function renameProject(projectId: string, name: string): Promise<MutationResult> {
  const parsed = z.string().trim().min(2).max(90).safeParse(name);
  if (!parsed.success) return { ok: false, message: "Enter a project name between 2 and 90 characters." };
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase.from("projects").update({ name: parsed.data, updated_at: new Date().toISOString() }).eq("id", projectId).eq("owner_id", user.id).select("id").maybeSingle();
  if (error || !data) return { ok: false, message: "Project could not be renamed." };
  await recordActivity(user.id, "project_renamed", `Renamed a project to “${parsed.data}”.`, projectId);
  revalidatePath("/dashboard"); revalidatePath("/dashboard/projects");
  return { ok: true, message: "Project renamed." };
}

export async function duplicateProject(projectId: string): Promise<MutationResult> {
  const { supabase, user } = await requireUser();
  const account = await ensureProjectOwnerProfile(supabase, user.id);
  if (!account.ok) return account;
  const { data: source } = await supabase.from("projects").select("name, project_type, template_id").eq("id", projectId).eq("owner_id", user.id).maybeSingle();
  if (!source) return { ok: false, message: "Project not found." };
  const { data, error } = await supabase.from("projects").insert({ owner_id: user.id, name: `${source.name} copy`, project_type: source.project_type, template_id: source.template_id, status: "draft" }).select("id").single();
  if (error || !data) return { ok: false, message: "Project could not be duplicated." };
  await recordActivity(user.id, "project_duplicated", `Duplicated “${source.name}”.`, data.id);
  revalidatePath("/dashboard"); revalidatePath("/dashboard/projects");
  return { ok: true, message: "Project duplicated." };
}

export async function setProjectPublished(projectId: string, publish: boolean): Promise<MutationResult> {
  const { supabase, user } = await requireUser();
  const { data: ownedProject } = await supabase.from("projects").select("id, project_type").eq("id", projectId).eq("owner_id", user.id).maybeSingle();
  if (!ownedProject) return { ok: false, message: "Project not found." };
  if (publish && ownedProject.project_type === "wedding") {
    return { ok: false, message: "Open the invitation editor to save your invitation and continue to secure checkout." };
  }
  if (publish && ownedProject.project_type === "business") {
    return { ok: false, message: "Open the business site editor and start your ₱299/month plan to publish." };
  }
  const status = publish ? "published" : "draft";
  const { data, error } = await supabase.from("projects").update({ status, updated_at: new Date().toISOString() }).eq("id", projectId).eq("owner_id", user.id).select("id, name").maybeSingle();
  if (error || !data) return { ok: false, message: "Project status could not be updated." };
  if (!publish && (ownedProject.project_type === "wedding" || ownedProject.project_type === "business")) {
    await supabase.from("published_sites").update({ is_live: false, updated_at: new Date().toISOString() }).eq("project_id", projectId);
  }
  await recordActivity(user.id, publish ? "project_published" : "project_unpublished", `${publish ? "Published" : "Unpublished"} “${data.name}”.`, projectId);
  revalidatePath("/dashboard"); revalidatePath("/dashboard/projects");
  return { ok: true, message: publish ? "Project published." : "Project returned to draft." };
}

export async function deleteProject(projectId: string): Promise<MutationResult> {
  const { supabase, user } = await requireUser();
  const { data: project } = await supabase.from("projects").select("name").eq("id", projectId).eq("owner_id", user.id).maybeSingle();
  if (!project) return { ok: false, message: "Project not found." };
  const { error } = await supabase.from("projects").delete().eq("id", projectId).eq("owner_id", user.id);
  if (error) return { ok: false, message: "Project could not be deleted." };
  await recordActivity(user.id, "project_deleted", `Deleted “${project.name}”.`);
  revalidatePath("/dashboard"); revalidatePath("/dashboard/projects");
  return { ok: true, message: "Project deleted." };
}
