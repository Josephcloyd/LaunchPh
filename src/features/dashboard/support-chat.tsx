"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { CheckCircle2, ExternalLink, MessageCircle, Send, X } from "lucide-react";
import { createSupportTicket } from "@/app/dashboard/support/actions";

export function SupportChat() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ kind: "success" | "error"; message: string } | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus(null);
    const form = event.currentTarget;
    const data = new FormData(form);
    const result = await createSupportTicket(String(data.get("subject") ?? ""), String(data.get("message") ?? ""));
    if (result.ok) {
      form.reset();
      setStatus({ kind: "success", message: "Message sent. We’ll follow up on your account." });
    } else {
      setStatus({ kind: "error", message: result.message });
    }
    setBusy(false);
  }

  return (
    <div className="support-chat-root">
      {open && (
        <section className="support-chat-panel" role="dialog" aria-modal="false" aria-labelledby="support-chat-title">
          <header className="support-chat-header">
            <div className="support-chat-brand"><span><MessageCircle size={18}/></span><div><h2 id="support-chat-title">GetLaunch PH Support</h2><p>Usually replies within one business day</p></div></div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close support chat"><X size={18}/></button>
          </header>
          <div className="support-chat-body">
            {status?.kind === "success" ? (
              <div className="support-chat-success" role="status"><CheckCircle2 size={28}/><strong>We received your message.</strong><p>{status.message}</p><button className="btn btn-secondary btn-small" type="button" onClick={() => setStatus(null)}>Send another</button></div>
            ) : (
              <form className="support-chat-form" onSubmit={submit}>
                <div className="field"><label htmlFor="chat-subject">What do you need help with?</label><input className="input" id="chat-subject" name="subject" minLength={4} maxLength={120} placeholder="e.g. Publishing my invitation" required/></div>
                <div className="field"><label htmlFor="chat-message">Message</label><textarea className="textarea" id="chat-message" name="message" minLength={15} maxLength={3000} placeholder="Tell us what happened and what you expected." required/></div>
                {status?.kind === "error" && <div className="workspace-message error" role="alert">{status.message}</div>}
                <button className="btn btn-primary support-chat-submit" type="submit" disabled={busy}>{busy ? "Sending…" : <><Send size={15}/>Send message</>}</button>
              </form>
            )}
          </div>
          <footer className="support-chat-footer"><Link href="/dashboard/support" onClick={() => setOpen(false)}>View previous requests <ExternalLink size={13}/></Link></footer>
        </section>
      )}
      <button className="support-chat-trigger" type="button" onClick={() => setOpen(value => !value)} aria-expanded={open} aria-label={open ? "Close contact support" : "Contact support"}>
        {open ? <X size={22}/> : <MessageCircle size={22}/>}<span>{open ? "Close" : "Contact support"}</span>
      </button>
    </div>
  );
}
