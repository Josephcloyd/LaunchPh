import { BUSINESS_GRACE_DAYS } from "@/lib/checkout-products";
import type { WorkspaceProject } from "@/types/workspace";

const one = <T,>(value: T | T[] | null | undefined) => (Array.isArray(value) ? value[0] : value) ?? null;

// The project's public address while it's actually reachable: published, live, and for business
// sites within the paid period plus the grace period. Compute on the server, where `now` is stable.
export function projectLiveUrl(project: WorkspaceProject, now: Date) {
  const site = one(project.published_sites);
  if (!site?.is_live || project.status !== "published") return null;
  if (project.project_type === "business") {
    const endsAt = one(project.subscriptions)?.current_period_ends_at;
    if (!endsAt || new Date(endsAt).getTime() + BUSINESS_GRACE_DAYS * 24 * 60 * 60 * 1000 <= now.getTime()) return null;
    return `/site/${site.slug}`;
  }
  return `/wedding/${site.slug}`;
}
