"use server";

import { z } from "zod";
import { removeUnusedPhotos } from "@/services/site-photos";
import { requireUser } from "@/services/supabase-server";

/** Called when an owner removes a photo in the editor: deletes it unless another project uses it. */
export async function discardPhoto(projectId: string, path: string) {
  if (!z.string().uuid().safeParse(projectId).success || typeof path !== "string") return;
  const { supabase, user } = await requireUser();
  await removeUnusedPhotos(supabase, user.id, [path], projectId);
}
