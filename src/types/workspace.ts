export type ProjectType = "wedding" | "resume" | "portfolio" | "business";
export type ProjectStatus = "draft" | "published" | "archived";

export type WorkspaceProject = {
  id: string;
  name: string;
  project_type: ProjectType;
  status: ProjectStatus;
  updated_at: string;
  created_at: string;
};

export type WorkspaceActivity = {
  id: string;
  event_type: string;
  summary: string;
  created_at: string;
};

export type MutationResult = { ok: boolean; message: string };
