export type ProjectType = "wedding" | "resume" | "portfolio" | "business";
export type ProjectStatus = "draft" | "published" | "archived";

export type WorkspaceProject = {
  id: string;
  name: string;
  project_type: ProjectType;
  status: ProjectStatus;
  updated_at: string;
  created_at: string;
  /** The project's public address, once paid and published. */
  published_sites?: { slug: string; is_live: boolean } | { slug: string; is_live: boolean }[] | null;
  /** Business sites only: when the paid period ends. */
  subscriptions?: { current_period_ends_at: string | null } | { current_period_ends_at: string | null }[] | null;
  /** Set by the server from the two fields above: where the project is publicly reachable now. */
  live_url?: string | null;
};

export type WorkspaceActivity = {
  id: string;
  event_type: string;
  summary: string;
  created_at: string;
};

export type MutationResult = { ok: boolean; message: string };
