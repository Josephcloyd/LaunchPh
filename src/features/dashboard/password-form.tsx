"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/services/supabase-browser";

export function PasswordForm() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(form: HTMLFormElement) {
    setBusy(true); setMessage("");
    const password = String(new FormData(form).get("password") ?? "");
    if (password.length < 8) { setMessage("Use at least 8 characters."); setBusy(false); return; }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) { setMessage("Supabase is not configured."); setBusy(false); return; }
    const { error } = await supabase.auth.updateUser({ password });
    setMessage(error ? error.message : "Password updated successfully.");
    if (!error) form.reset();
    setBusy(false);
  }
  return <form className="settings-form" onSubmit={event => { event.preventDefault(); void submit(event.currentTarget); }}><div className="field"><label htmlFor="new-password">New password</label><input className="input" id="new-password" name="password" type="password" minLength={8} autoComplete="new-password" required/></div>{message && <div className="workspace-message" role="status">{message}</div>}<button className="btn btn-primary btn-small" disabled={busy}>{busy ? "Updating…" : "Update password"}</button></form>;
}
