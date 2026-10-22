// Two-account isolation test against a real Supabase project (LAUNCH_CHECKLIST Phase 0).
//
//   npm run test:isolation                      # uses .env.local
//   npm run test:isolation -- --env .env.production.local
//
// Needs NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY.
// Creates two confirmed throwaway users (rls-test-*@example.com, so no emails are sent), attacks
// A's data as B through the REST API, verifies with the service role that nothing changed, then
// deletes both users and everything they created, even when a check fails.
import { createClient } from "@supabase/supabase-js";
import { randomBytes, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";

const envFlag = process.argv.indexOf("--env");
const envPath = envFlag === -1 ? ".env.local" : process.argv[envFlag + 1];
const env = Object.fromEntries(readFileSync(envPath, "utf8").split(/\r?\n/).filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "")]));
const url = env.NEXT_PUBLIC_SUPABASE_URL, anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !anonKey || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error(`Missing Supabase settings in ${envPath}.`);
  process.exit(1);
}
console.log(`Testing ${new URL(url).host}\n`);
const noSession = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, noSession);

let failures = 0;
const result = (ok, label, detail = "") => { failures += !ok; console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  (${detail})` : ""}`); };
const must = ({ data, error }, what) => { if (error) throw new Error(`${what}: ${error.message}`); return data; };

const stamp = Date.now();
const users = {};
async function makeUser(name) {
  const email = `rls-test-${name}-${stamp}@example.com`, password = randomBytes(18).toString("base64url");
  const created = must(await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { first_name: `Test${name.toUpperCase()}`, last_name: "Isolation" } }), `create user ${name}`);
  const client = createClient(url, anonKey, noSession);
  must(await client.auth.signInWithPassword({ email, password }), `sign in ${name}`);
  users[name] = { id: created.user.id, client };
  return users[name];
}

const created = { orders: [] };
try {
  const A = await makeUser("a"), B = await makeUser("b");
  const a = A.client, b = B.client;
  await a.rpc("ensure_current_user_profile");
  await b.rpc("ensure_current_user_profile");

  // ---- A's data, created as A where the app does so, otherwise with the service role.
  const wedding = must(await a.from("projects").insert({ owner_id: A.id, name: "A wedding", project_type: "wedding", status: "draft" }).select("id").single(), "A wedding project");
  const business = must(await a.from("projects").insert({ owner_id: A.id, name: "A business", project_type: "business", status: "draft" }).select("id").single(), "A business project");
  must(await a.from("wedding_events").insert({ project_id: wedding.id, partner_one: "Lea", partner_two: "Miguel", event_date: "2027-02-14T00:00:00+08:00", story: "original" }), "A wedding details");
  const guest = must(await a.from("wedding_guests").insert({ project_id: wedding.id, display_name: "Guest", token_hash: randomBytes(32).toString("hex"), party_size: 2 }).select("id").single(), "A guest");
  must(await a.from("project_revisions").insert({ project_id: wedding.id, revision: 1, content: { v: "original" }, created_by: A.id }), "A revision");
  must(await a.from("published_sites").insert({ project_id: wedding.id, slug: `rls-test-${stamp}`, is_live: false }), "A draft site");
  must(await a.from("business_profiles").insert({ project_id: business.id, business_name: "A business" }), "A business profile");
  must(await a.from("support_tickets").insert({ user_id: A.id, subject: "A ticket", message: "A private message" }), "A ticket");
  must(await a.from("notifications").insert({ user_id: A.id, notification_type: "test", title: "A notification" }), "A notification");
  must(await a.from("activity_logs").insert({ user_id: A.id, event_type: "test", summary: "A activity" }), "A activity");
  must(await a.rpc("ensure_my_referral_code"), "A referral code");
  must(await admin.from("rsvps").insert({ guest_id: guest.id, attending: true, attendee_count: 1 }), "A rsvp");
  const order = must(await admin.from("orders").insert({ user_id: A.id, reference: `RLS-${stamp}`, status: "paid", subtotal_centavos: 79900, total_centavos: 79900 }).select("id").single(), "A order");
  created.orders.push(order.id);
  must(await admin.from("order_items").insert({ order_id: order.id, description: "Wedding", unit_price_centavos: 79900, project_id: business.id }), "A order item");
  must(await admin.from("payments").insert({ order_id: order.id, provider: "rls-test", provider_payment_id: `rls-${stamp}`, idempotency_key: randomUUID(), status: "paid", amount_centavos: 79900 }), "A payment");
  must(await admin.from("contact_submissions").insert({ project_id: business.id, sender_name: "Visitor", sender_email: "visitor@example.com", message: "Private visitor message" }), "A contact message");

  // ---- Reads: A sees its own rows (control), B sees none.
  console.log("\nReading A's data");
  const reads = [
    ["profiles", "id", A.id], ["projects", "owner_id", A.id], ["project_revisions", "project_id", wedding.id],
    ["published_sites", "project_id", wedding.id], ["wedding_events", "project_id", wedding.id], ["wedding_guests", "project_id", wedding.id],
    ["rsvps", "guest_id", guest.id], ["business_profiles", "project_id", business.id], ["contact_submissions", "project_id", business.id],
    ["orders", "user_id", A.id], ["order_items", "order_id", order.id], ["payments", "order_id", order.id],
    ["support_tickets", "user_id", A.id], ["notifications", "user_id", A.id], ["activity_logs", "user_id", A.id],
    ["referral_codes", "user_id", A.id], ["user_preferences", "user_id", A.id], ["roles", "user_id", A.id],
  ];
  for (const [table, column, value] of reads) {
    const own = await a.from(table).select("*").eq(column, value);
    const other = await b.from(table).select("*").eq(column, value);
    const ownCount = own.data?.length ?? 0, otherCount = other.data?.length ?? 0;
    // roles has no policies at all, so A can't read its own row either; that's intended.
    const control = table === "roles" ? true : ownCount > 0;
    result(control && otherCount === 0, `B cannot read A's ${table}`, `A sees ${ownCount}, B sees ${otherCount}${other.error ? `, ${other.error.message}` : ""}`);
  }

  // ---- Writes: every attempt must change nothing.
  console.log("\nChanging A's data as B");
  const updates = [
    ["profiles", { full_name: "hacked" }, "id", A.id], ["projects", { name: "hacked" }, "id", wedding.id],
    ["project_revisions", { content: { v: "hacked" } }, "project_id", wedding.id], ["published_sites", { slug: `hacked-${stamp}` }, "project_id", wedding.id],
    ["wedding_events", { story: "hacked" }, "project_id", wedding.id], ["wedding_guests", { display_name: "hacked" }, "project_id", wedding.id],
    ["rsvps", { attending: false }, "guest_id", guest.id], ["business_profiles", { business_name: "hacked" }, "project_id", business.id],
    ["contact_submissions", { status: "hacked" }, "project_id", business.id], ["orders", { status: "refunded" }, "id", order.id],
    ["support_tickets", { subject: "hacked" }, "user_id", A.id], ["notifications", { title: "hacked" }, "user_id", A.id],
    ["user_preferences", { project_view: "grid" }, "user_id", A.id], ["referral_codes", { code: "HACKED00" }, "user_id", A.id],
  ];
  for (const [table, values, column, value] of updates) {
    const { data, error } = await b.from(table).update(values).eq(column, value).select();
    result(!data?.length, `B cannot update A's ${table}`, error ? error.message : `${data?.length ?? 0} rows changed`);
  }
  for (const [table, column, value] of [["projects", "id", wedding.id], ["wedding_guests", "project_id", wedding.id], ["support_tickets", "user_id", A.id], ["notifications", "user_id", A.id], ["contact_submissions", "project_id", business.id]]) {
    const { data, error } = await b.from(table).delete().eq(column, value).select();
    result(!data?.length, `B cannot delete A's ${table}`, error ? error.message : `${data?.length ?? 0} rows deleted`);
  }
  const inserts = [
    ["projects", { owner_id: A.id, name: "planted", project_type: "wedding", status: "draft" }],
    ["wedding_guests", { project_id: wedding.id, display_name: "planted", token_hash: randomBytes(32).toString("hex") }],
    ["project_revisions", { project_id: wedding.id, revision: 99, content: {}, created_by: B.id }],
    ["support_tickets", { user_id: A.id, subject: "planted", message: "planted" }],
    ["notifications", { user_id: A.id, notification_type: "phish", title: "planted", action_url: "https://evil.example" }],
    ["activity_logs", { user_id: A.id, event_type: "planted", summary: "planted" }],
    ["roles", { user_id: B.id, role: "admin" }],
    ["orders", { user_id: B.id, reference: `FAKE-${stamp}`, status: "paid", subtotal_centavos: 0, total_centavos: 0 }],
  ];
  for (const [table, row] of inserts) {
    const { data, error } = await b.from(table).insert(row).select();
    result(Boolean(error) && !data?.length, `B cannot insert into ${table} (${Object.keys(row)[0]}=${table === "roles" || table === "orders" ? "self" : "A's"})`, error?.message ?? "inserted!");
  }
  const bAdmin = await b.rpc("is_admin");
  result(bAdmin.data === false, "B is not an admin after the attempts", JSON.stringify(bAdmin.data));

  // ---- Publishing.
  console.log("\nPublishing");
  const bPublish = await b.rpc("publish_project", { target_project_id: wedding.id });
  result(bPublish.data === false, "B cannot publish A's wedding via publish_project", JSON.stringify(bPublish.data ?? bPublish.error?.message));
  const aDirect = await a.from("projects").update({ status: "published" }).eq("id", wedding.id).select();
  result(Boolean(aDirect.error), "A cannot publish an unpaid wedding directly", aDirect.error?.message ?? "published!");
  const aLive = await a.from("published_sites").update({ is_live: true }).eq("project_id", wedding.id).select();
  result(Boolean(aLive.error), "A cannot flip its site live directly", aLive.error?.message ?? "went live!");
  const aRpc = await a.rpc("publish_project", { target_project_id: wedding.id });
  result(aRpc.data === false, "publish_project refuses A's unpaid wedding", JSON.stringify(aRpc.data ?? aRpc.error?.message));
  const aWrongProject = await a.rpc("publish_project", { target_project_id: business.id });
  result(aWrongProject.data === false, "A paid order on the business project doesn't publish it (needs a subscription)", JSON.stringify(aWrongProject.data ?? aWrongProject.error?.message));

  // ---- Ground truth with the service role: nothing of A's changed.
  console.log("\nVerifying A's data with the service role");
  const projects = must(await admin.from("projects").select("name, status").eq("owner_id", A.id), "A projects");
  result(projects.length === 2 && projects.every(p => !p.name.includes("hacked") && p.status === "draft"), "A still has exactly 2 untouched draft projects", JSON.stringify(projects));
  const story = must(await admin.from("wedding_events").select("story").eq("project_id", wedding.id).single(), "story");
  result(story.story === "original", "A's invitation story unchanged", story.story);
  const roleB = must(await admin.from("roles").select("role").eq("user_id", B.id).single(), "B role");
  result(roleB.role === "customer", "B is still a customer", roleB.role);
  const orderRow = must(await admin.from("orders").select("status").eq("id", order.id).single(), "order");
  result(orderRow.status === "paid", "A's order status unchanged", orderRow.status);
  const planted = must(await admin.from("notifications").select("id").eq("user_id", A.id).eq("title", "planted"), "planted");
  result(planted.length === 0, "No notification planted for A", `${planted.length}`);
} catch (error) {
  failures++;
  console.log(`ERROR  ${error.message}`);
} finally {
  // Orders and payments don't cascade from users, so remove them first.
  for (const id of created.orders) { await admin.from("payments").delete().eq("order_id", id); await admin.from("orders").delete().eq("id", id); }
  for (const [name, user] of Object.entries(users)) {
    await admin.from("orders").delete().eq("user_id", user.id);
    const { error } = await admin.auth.admin.deleteUser(user.id);
    console.log(error ? `CLEANUP FAILED for test user ${name} (${user.id}): ${error.message}` : `cleaned up test user ${name}`);
  }
  console.log(failures ? `\n${failures} FAILED` : "\nAll isolation checks passed");
  process.exit(failures ? 1 : 0);
}
