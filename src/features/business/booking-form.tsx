"use client";

import { CalendarCheck, CheckCircle2, Send } from "lucide-react";
import { FormEvent, useState, useTransition } from "react";
import { submitBooking } from "@/app/site/[slug]/actions";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { manilaToday } from "@/lib/booking";

// The "Book an appointment" section of a business site. Without a slug (the editor and the
// template gallery) it is a preview: visitors can only send requests from the live site.
export function BookingForm({ slug, businessName, services }: { slug?: string; businessName: string; services: string[] }) {
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [resetSignal, setResetSignal] = useState(0);
  const [pending, startTransition] = useTransition();
  const today = manilaToday();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!slug) { setResult({ ok: false, message: "This is a preview. Visitors can send booking requests once your site is live." }); return; }
    const form = event.currentTarget;
    const data = new FormData(form);
    setResult(null);
    startTransition(async () => {
      const outcome = await submitBooking(slug, data);
      setResult(outcome);
      setResetSignal(signal => signal + 1);
      if (outcome.ok) form.reset();
    });
  }

  return <section className="business-section business-booking" id="booking" aria-labelledby="booking-heading">
    <h3 id="booking-heading"><CalendarCheck size={17} aria-hidden="true"/> Book an appointment</h3>
    <p className="business-booking-intro">Send your preferred date and time. {businessName || "We"} will contact you to confirm.</p>
    {result?.ok ? <div className="business-booking-done" role="status"><CheckCircle2 size={20}/><p>{result.message}</p></div> : <form className="business-booking-form" onSubmit={submit}>
      <div className="business-booking-grid">
        <label><span>Your name</span><input name="name" required maxLength={120} autoComplete="name"/></label>
        <label><span>Phone number</span><input name="phone" type="tel" required maxLength={40} autoComplete="tel" placeholder="0917 123 4567"/></label>
        <label><span>Email <em>(optional)</em></span><input name="email" type="email" maxLength={200} autoComplete="email"/></label>
        {services.length > 0 && <label><span>What would you like to book? <em>(optional)</em></span><select name="service" defaultValue=""><option value="">Not sure yet</option>{services.map(service => <option key={service} value={service}>{service}</option>)}</select></label>}
        <label><span>Preferred date</span><input name="date" type="date" required min={today}/></label>
        <label><span>Preferred time</span><input name="time" type="time" required step={900}/></label>
      </div>
      <label><span>Message <em>(optional)</em></span><textarea name="message" maxLength={1000} rows={3} placeholder="Anything they should know?"/></label>
      {/* Hidden from people; bots that fill every field are rejected. */}
      <div className="inquiry-honeypot" aria-hidden="true"><input name="website" tabIndex={-1} autoComplete="off"/></div>
      {slug && <TurnstileWidget quiet resetSignal={resetSignal}/>}
      {result && <p className="business-booking-error" role="alert">{result.message}</p>}
      <button className="business-btn primary" type="submit" disabled={pending}><Send size={15} aria-hidden="true"/> {pending ? "Sending…" : "Send booking request"}</button>
    </form>}
  </section>;
}
