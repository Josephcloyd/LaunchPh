"use client";

import { CheckCircle2, Send } from "lucide-react";
import { FormEvent, useState, useTransition } from "react";
import { submitWeddingRsvp } from "@/app/rsvp/[token]/actions";

type RsvpFormProps = { token: string; displayName: string; partySize: number; initialAttending: boolean | null; initialAttendeeCount: number | null; initialNotes: string };

export function RsvpForm({ token, displayName, partySize, initialAttending, initialAttendeeCount, initialNotes }: RsvpFormProps) {
  const [attending, setAttending] = useState<boolean | null>(initialAttending);
  const [attendeeCount, setAttendeeCount] = useState(initialAttendeeCount ?? 1);
  const [notes, setNotes] = useState(initialNotes);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (attending === null) { setMessage("Please accept or decline the invitation."); setSuccess(false); return; } setMessage(""); startTransition(() => { void submitWeddingRsvp({ token, attending, attendeeCount: attending ? attendeeCount : 0, notes }).then(result => { setMessage(result.message); setSuccess(result.ok); }); }); }
  return <section className="public-rsvp-card" aria-labelledby="rsvp-heading"><p className="eyebrow">Kindly respond</p><h2 id="rsvp-heading">Will you join us?</h2><p className="public-rsvp-welcome">This private invitation is for <strong>{displayName}</strong>, for up to {partySize} {partySize === 1 ? "guest" : "guests"}.</p><form className="public-rsvp-form" onSubmit={submit}><div className="rsvp-choice-grid"><label className={attending === true ? "selected" : ""}><input type="radio" name="attending" checked={attending === true} onChange={() => setAttending(true)}/><span>Joyfully accepts</span></label><label className={attending === false ? "selected" : ""}><input type="radio" name="attending" checked={attending === false} onChange={() => setAttending(false)}/><span>Regretfully declines</span></label></div>{attending === true && <div className="field"><label htmlFor="attendee-count">Number attending</label><select id="attendee-count" className="select" value={attendeeCount} onChange={event => setAttendeeCount(Number(event.target.value))}>{Array.from({ length: partySize }, (_, index) => index + 1).map(count => <option key={count} value={count}>{count}</option>)}</select></div>}<div className="field"><label htmlFor="rsvp-notes">Message or dietary notes <span>(optional)</span></label><textarea id="rsvp-notes" className="textarea" value={notes} maxLength={500} onChange={event => setNotes(event.target.value)} placeholder="Share a note with the couple."/></div>{message && <div className={`rsvp-message ${success ? "success" : "error"}`} role="status">{success && <CheckCircle2 size={17}/>} {message}</div>}<button className="btn btn-sage" type="submit" disabled={pending}><Send size={15}/>{pending ? "Sending…" : initialAttending === null && !success ? "Send RSVP" : "Update RSVP"}</button></form></section>;
}

