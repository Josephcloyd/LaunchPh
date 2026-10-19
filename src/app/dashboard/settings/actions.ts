"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/services/supabase-server";

const settingsSchema = z.object({
  firstName: z.string().trim().min(1).max(60),
  middleName: z.string().trim().max(60),
  lastName: z.string().trim().min(1).max(60),
  timezone: z.string().min(2).max(80),
  projectView: z.enum(["list", "grid"]),
  projectSort: z.enum(["updated", "name"]),
});

export async function updateSettings(formData: FormData) {
  const parsed = settingsSchema.safeParse({ firstName: formData.get("firstName"), middleName: formData.get("middleName"), lastName: formData.get("lastName"), timezone: formData.get("timezone"), projectView: formData.get("projectView"), projectSort: formData.get("projectSort") });
  if (!parsed.success) redirect("/dashboard/settings?error=Please+check+your+settings");
  const { supabase, user } = await requireUser();
  const [profileResult, preferenceResult] = await Promise.all([
    supabase.from("profiles").update({ first_name: parsed.data.firstName, middle_name: parsed.data.middleName || null, last_name: parsed.data.lastName, full_name: [parsed.data.firstName, parsed.data.middleName, parsed.data.lastName].filter(Boolean).join(" "), updated_at: new Date().toISOString() }).eq("id", user.id),
    supabase.from("user_preferences").upsert({ user_id: user.id, timezone: parsed.data.timezone, project_view: parsed.data.projectView, project_sort: parsed.data.projectSort, updated_at: new Date().toISOString() }, { onConflict: "user_id" }),
  ]);
  if (profileResult.error || preferenceResult.error) redirect(`/dashboard/settings?error=${encodeURIComponent(profileResult.error?.message ?? preferenceResult.error?.message ?? "Settings could not be saved")}`);
  await supabase.auth.updateUser({ data: { first_name: parsed.data.firstName, middle_name: parsed.data.middleName || null, last_name: parsed.data.lastName, full_name: [parsed.data.firstName, parsed.data.middleName, parsed.data.lastName].filter(Boolean).join(" ") } });
  await supabase.from("activity_logs").insert({ user_id: user.id, event_type: "settings_updated", summary: "Updated account preferences." });
  redirect("/dashboard/settings?saved=1");
}
