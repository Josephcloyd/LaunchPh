import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { designPhotos, photoPathSchema } from "@/lib/site-design";

// Deletes photos from storage once no project of the owner uses them any more. Duplicated
// projects share photos, so a photo is only removed when nothing else references it.
// Runs with the owner's session: storage policies limit deletes to their own folder.
export async function removeUnusedPhotos(client: SupabaseClient, userId: string, paths: string[], exceptProjectId?: string) {
  const candidates = [...new Set(paths)].filter(path => photoPathSchema.safeParse(path).success && path.startsWith(`${userId}/`));
  if (!candidates.length) return;

  const { data: projects } = await client.from("projects").select("id").eq("owner_id", userId);
  const projectIds = (projects ?? []).map(project => project.id).filter(id => id !== exceptProjectId);
  const inUse = new Set<string>();
  if (projectIds.length) {
    const [events, profiles] = await Promise.all([
      client.from("wedding_events").select("design").in("project_id", projectIds),
      client.from("business_profiles").select("design").in("project_id", projectIds),
    ]);
    // If either lookup fails, keep everything rather than risk deleting a photo in use.
    if (events.error || profiles.error) return;
    for (const row of [...(events.data ?? []), ...(profiles.data ?? [])]) {
      for (const path of designPhotos((row.design ?? {}) as Record<string, unknown>)) inUse.add(path);
    }
  }
  const unused = candidates.filter(path => !inUse.has(path));
  if (unused.length) await client.storage.from("site-photos").remove(unused);
}
