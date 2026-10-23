import { BUSINESS_GRACE_DAYS } from "@/lib/checkout-products";
import { appUrl, sendEmail } from "@/services/email";
import { createSupabaseAdminClient } from "@/services/supabase-admin";

const DAY = 24 * 60 * 60 * 1000;
type Reminder = "7_days" | "1_day" | "offline";

// Business site expiry emails. Call once a day with `Authorization: Bearer <CRON_SECRET>`
// (Vercel Cron sends this header automatically when CRON_SECRET is set). Each reminder goes out
// once per paid period: about 7 days before the end, 1 day before, and when the site goes
// offline after the grace period. Sites go offline on their own; this only sends the emails.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return new Response("Unauthorized", { status: 401 });

  const admin = createSupabaseAdminClient();
  const now = Date.now();
  const { data: plans, error } = await admin.from("subscriptions")
    .select("id, user_id, project_id, current_period_ends_at, projects(name)")
    .eq("status", "active").not("project_id", "is", null)
    .gt("current_period_ends_at", new Date(now - (BUSINESS_GRACE_DAYS + 3) * DAY).toISOString())
    .lt("current_period_ends_at", new Date(now + 7 * DAY).toISOString());
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const results = { checked: plans.length, sent: 0, alreadySent: 0, failed: 0 };
  for (const plan of plans) {
    const endsAt = new Date(plan.current_period_ends_at);
    const remaining = endsAt.getTime() - now;
    const kind: Reminder | null = remaining > DAY ? "7_days" : remaining > 0 ? "1_day" : remaining <= -BUSINESS_GRACE_DAYS * DAY ? "offline" : null;
    if (!kind) continue;

    // Claim the reminder first; the primary key makes a second run skip it.
    const { error: claimError } = await admin.from("subscription_reminders").insert({ subscription_id: plan.id, kind, period_ends_at: plan.current_period_ends_at });
    if (claimError) { results.alreadySent++; continue; }

    const { data: owner } = await admin.auth.admin.getUserById(plan.user_id);
    const name = ((Array.isArray(plan.projects) ? plan.projects[0] : plan.projects) as { name?: string } | null)?.name ?? "Your business site";
    const sent = owner.user?.email ? await sendEmail({ to: owner.user.email, ...reminderEmail(kind, name, endsAt), action: { label: kind === "offline" ? "Renew and bring it back" : "Renew now", url: appUrl(`/checkout?product=business-site&project=${plan.project_id}`) } }) : false;
    if (sent) results.sent++;
    else {
      results.failed++;
      // Let the next run try again.
      await admin.from("subscription_reminders").delete().eq("subscription_id", plan.id).eq("kind", kind).eq("period_ends_at", plan.current_period_ends_at);
    }
  }
  return Response.json(results);
}

function reminderEmail(kind: Reminder, name: string, endsAt: Date) {
  const date = (value: Date) => new Intl.DateTimeFormat("en-PH", { dateStyle: "long", timeZone: "Asia/Manila" }).format(value);
  const offline = date(new Date(endsAt.getTime() + BUSINESS_GRACE_DAYS * DAY));
  if (kind === "offline") return {
    subject: `${name} is now offline`,
    lines: [`The plan for ${name} ended on ${date(endsAt)}, and the site is now offline.`, "Your content is saved. Renew any time and it comes back at the same address."],
  };
  return {
    subject: kind === "1_day" ? `${name}: your plan ends tomorrow` : `${name}: your plan ends on ${date(endsAt)}`,
    lines: [`Your business site ${name} is paid until ${date(endsAt)}.`, `To keep it online, renew before then. If you don’t, it stays up until ${offline} and then goes offline; your content is kept.`],
  };
}
