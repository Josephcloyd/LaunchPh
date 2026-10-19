import { Bell, Globe2, KeyRound, LockKeyhole, ShieldCheck, UserRound } from "lucide-react";
import { updateSettings } from "@/app/dashboard/settings/actions";
import { PasswordForm } from "@/features/dashboard/password-form";
import { requireUser } from "@/services/supabase-server";

export default async function SettingsPage({ searchParams }: PageProps<"/dashboard/settings">) {
  const params = await searchParams;
  const { supabase, user } = await requireUser();
  const [{ data: profile }, { data: preferences }, { data: events, error: eventsError }] = await Promise.all([
    supabase.from("profiles").select("first_name, middle_name, last_name, full_name").eq("id", user.id).maybeSingle(),
    supabase.from("user_preferences").select("timezone, project_view, project_sort, email_notifications").eq("user_id", user.id).maybeSingle(),
    supabase.from("security_events").select("id, event_type, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
  ]);
  const firstName = profile?.first_name || user.user_metadata?.first_name || "";
  const middleName = profile?.middle_name || user.user_metadata?.middle_name || "";
  const lastName = profile?.last_name || user.user_metadata?.last_name || "";

  return (
    <div className="workspace-page">
      <header className="workspace-page-header">
        <div><p className="workspace-kicker">Settings &amp; security</p><h1>Account settings</h1><p>Manage your profile, workspace preferences, password, and account protection.</p></div>
      </header>
      {params.saved && <div className="workspace-message success">Settings saved.</div>}
      {params.error && <div className="workspace-message error">{String(params.error)}</div>}

      <form action={updateSettings} className="settings-layout settings-form-grid">
        <section className="settings-section">
          <div className="settings-section-title"><UserRound size={18}/><div><h2>Profile</h2><p>Your name appears across your private workspace.</p></div></div>
          <div className="form-stack">
            <div className="name-grid"><div className="field"><label htmlFor="first-name">First name</label><input className="input" id="first-name" name="firstName" autoComplete="given-name" maxLength={60} defaultValue={firstName} required/></div><div className="field"><label htmlFor="middle-name">Middle name <span className="fine">(optional)</span></label><input className="input" id="middle-name" name="middleName" autoComplete="additional-name" maxLength={60} defaultValue={middleName}/></div><div className="field"><label htmlFor="last-name">Last name</label><input className="input" id="last-name" name="lastName" autoComplete="family-name" maxLength={60} defaultValue={lastName} required/></div></div>
            <div className="field"><label>Email address</label><input className="input" value={user.email ?? ""} disabled/><span className="fine">Email changes require verification through Supabase Authentication.</span></div>
          </div>
        </section>
        <section className="settings-section">
          <div className="settings-section-title"><Globe2 size={18}/><div><h2>Workspace</h2><p>Preferences sync across your signed-in devices.</p></div></div>
          <div className="form-stack">
            <div className="field"><label htmlFor="timezone">Time zone</label><select className="select" id="timezone" name="timezone" defaultValue={preferences?.timezone ?? "Asia/Manila"}><option value="Asia/Manila">Asia/Manila</option><option value="Asia/Singapore">Asia/Singapore</option><option value="America/Los_Angeles">America/Los Angeles</option><option value="America/New_York">America/New York</option><option value="Europe/London">Europe/London</option></select></div>
            <div className="form-grid">
              <div className="field"><label htmlFor="project-view">Project view</label><select className="select" id="project-view" name="projectView" defaultValue={preferences?.project_view ?? "list"}><option value="list">List</option><option value="grid">Grid</option></select></div>
              <div className="field"><label htmlFor="project-sort">Default sorting</label><select className="select" id="project-sort" name="projectSort" defaultValue={preferences?.project_sort ?? "updated"}><option value="updated">Recently updated</option><option value="name">Project name</option></select></div>
            </div>
          </div>
        </section>
        <section className="settings-section">
          <div className="settings-section-title"><Bell size={18}/><div><h2>Notifications</h2><p>Email notifications are currently managed by account defaults.</p></div></div>
          <p className="compact-empty">Transactional email delivery will become configurable after an email provider is connected.</p>
        </section>
        <div className="settings-submit"><button className="btn btn-primary" type="submit">Save settings</button></div>
      </form>

      <div className="settings-layout">
        <section className="settings-section">
          <div className="settings-section-title"><KeyRound size={18}/><div><h2>Change password</h2><p>Signed in as {user.email}</p></div></div>
          <PasswordForm/>
        </section>
        <section className="settings-section">
          <div className="settings-section-title"><ShieldCheck size={18}/><div><h2>Included protection</h2><p>Available to every GetLaunch PH account.</p></div></div>
          <ul className="security-list"><li>Secure Supabase authentication</li><li>Row Level Security for customer records</li><li>Private project ownership checks</li><li>Server-verified user identity</li></ul>
        </section>
      </div>

      <section className="workspace-section workspace-section-main">
        <div className="workspace-section-head"><div><h2>Security activity</h2><p>Recorded access and security-setting events.</p></div><LockKeyhole size={18}/></div>
        {eventsError ? <p className="compact-empty">Security event history is not available yet.</p> : (events?.length ?? 0) === 0 ? <p className="compact-empty">No security events have been recorded.</p> : <div className="activity-list">{events!.map(event => <div className="activity-line" key={event.id}><span><LockKeyhole size={14}/></span><p>{event.event_type.replaceAll("_", " ")}</p><time>{new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(event.created_at))}</time></div>)}</div>}
      </section>
    </div>
  );
}
