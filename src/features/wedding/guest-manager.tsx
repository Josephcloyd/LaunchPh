"use client";

import { Check, Clipboard, Link2, Plus, Trash2, Users } from "lucide-react";
import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addWeddingGuest, deleteWeddingGuest, regenerateWeddingGuestLink } from "@/app/dashboard/projects/[id]/guests/actions";
import type { GuestMutationResult, WeddingGuestRecord } from "@/types/rsvp";

export function GuestManager({ projectId, isPublished, guests }: { projectId: string; isPublished: boolean; guests: WeddingGuestRecord[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<GuestMutationResult | null>(null);
  const [inviteUrl, setInviteUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const responses = guests.map(guest => guest.rsvps).filter(Boolean);
  const attending = responses.filter(response => response?.attending === true);
  const declined = responses.filter(response => response?.attending === false);
  const confirmedPeople = attending.reduce((total, response) => total + (response?.attendee_count ?? 0), 0);

  function showResult(result: GuestMutationResult, refresh = false) {
    setMessage(result);
    setCopied(false);
    if (result.invitePath) setInviteUrl(`${window.location.origin}${result.invitePath}`);
    if (refresh) router.refresh();
  }

  function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setMessage(null);
    setInviteUrl("");
    startTransition(() => {
      void addWeddingGuest(projectId, { displayName: data.get("displayName"), partySize: data.get("partySize") }).then(result => {
        showResult(result, result.ok);
        if (result.ok) form.reset();
      });
    });
  }

  function createLink(guestId: string) {
    setMessage(null);
    startTransition(() => { void regenerateWeddingGuestLink(projectId, guestId).then(result => showResult(result)); });
  }

  function removeGuest(guest: WeddingGuestRecord) {
    if (!window.confirm(`Remove ${guest.display_name} and their RSVP?`)) return;
    setMessage(null);
    startTransition(() => { void deleteWeddingGuest(projectId, guest.id).then(result => showResult(result, result.ok)); });
  }

  async function copyInvite() {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
  }

  return <>
    {!isPublished && <div className="provider-notice"><Link2 size={18}/><div><strong>Invitation links are not active yet</strong><p>You can prepare the guest list now. Private RSVP links begin working after the paid invitation is published.</p></div></div>}
    <div className="rsvp-summary" aria-label="RSVP summary"><div><strong>{guests.length}</strong><span>Invitations</span></div><div><strong>{attending.length}</strong><span>Accepted</span></div><div><strong>{declined.length}</strong><span>Declined</span></div><div><strong>{guests.length - responses.length}</strong><span>Awaiting reply</span></div><div><strong>{confirmedPeople}</strong><span>Confirmed people</span></div></div>
    <section className="guest-add-card"><div><h2>Add a guest or family</h2><p>Create a private RSVP link for one person or an entire party.</p></div><form className="guest-add-form" onSubmit={handleAdd}><div className="field"><label htmlFor="guest-name">Guest or family name</label><input className="input" id="guest-name" name="displayName" maxLength={120} placeholder="e.g. Maria Santos Family" required/></div><div className="field"><label htmlFor="party-size">Maximum party size</label><input className="input" id="party-size" name="partySize" type="number" min={1} max={20} defaultValue={1} required/></div><button className="btn btn-primary btn-small" type="submit" disabled={pending}><Plus size={15}/>{pending ? "Working…" : "Add guest"}</button></form>{message && <div className={`workspace-message ${message.ok ? "success" : "error"}`} role="status">{message.message}</div>}{inviteUrl && <div className="invite-link-result"><div><span>Private invitation link</span><code>{inviteUrl}</code></div><button className="btn btn-secondary btn-small" type="button" onClick={() => void copyInvite()}>{copied ? <Check size={15}/> : <Clipboard size={15}/>} {copied ? "Copied" : "Copy link"}</button></div>}</section>
    <section className="workspace-section workspace-section-main guest-list-section"><div className="workspace-section-head"><div><h2>Guest responses</h2><p>Generate a new private link whenever you need to resend an invitation.</p></div><Users size={18}/></div>{guests.length === 0 ? <div className="workspace-empty compact"><Users size={24}/><h3>No guests yet</h3><p>Add your first guest above.</p></div> : <div className="project-table-wrap"><table className="project-table guest-table"><thead><tr><th>Guest</th><th>Party limit</th><th>Response</th><th>Attendees</th><th>Notes</th><th>Actions</th></tr></thead><tbody>{guests.map(guest => { const response = guest.rsvps; const status = response?.attending === true ? "Accepted" : response?.attending === false ? "Declined" : "Awaiting reply"; return <tr key={guest.id}><td><strong>{guest.display_name}</strong>{response?.responded_at && <span className="guest-response-date">Responded {new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" }).format(new Date(response.responded_at))}</span>}</td><td>{guest.party_size}</td><td><span className={`rsvp-status ${response?.attending === true ? "accepted" : response?.attending === false ? "declined" : "waiting"}`}>{status}</span></td><td>{response?.attendee_count ?? "—"}</td><td className="guest-notes">{response?.meal_notes || "—"}</td><td><div className="guest-row-actions"><button type="button" onClick={() => createLink(guest.id)} disabled={pending}><Link2 size={14}/> New link</button><button className="danger" type="button" onClick={() => removeGuest(guest)} disabled={pending} aria-label={`Remove ${guest.display_name}`}><Trash2 size={14}/></button></div></td></tr>; })}</tbody></table></div>}</section>
  </>;
}

