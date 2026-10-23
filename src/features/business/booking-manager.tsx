"use client";

import Link from "next/link";
import { CalendarCheck, CalendarOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateBookingStatus } from "@/app/dashboard/projects/[id]/bookings/actions";
import { bookingStatusLabels, bookingStatuses, formatBookingWhen, manilaToday, type BookingStatus } from "@/lib/booking";

export type BookingRecord = { id: string; customer_name: string; phone: string; email: string | null; service: string | null; preferred_date: string; preferred_time: string; message: string | null; status: BookingStatus; created_at: string };

function StatusSelect({ projectId, booking }: { projectId: string; booking: BookingRecord }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  return <span className="adm-status-control">
    <select className="select adm-status-select" aria-label={`Status for ${booking.customer_name}`} value={booking.status} disabled={pending} onChange={event => {
      const status = event.target.value;
      startTransition(async () => {
        const result = await updateBookingStatus(projectId, booking.id, status);
        setError(result.ok ? "" : result.message);
        if (result.ok) router.refresh();
      });
    }}>{bookingStatuses.map(status => <option key={status} value={status}>{bookingStatusLabels[status]}</option>)}</select>
    {error && <span className="adm-inline-error" role="alert">{error}</span>}
  </span>;
}

export function BookingManager({ projectId, enabled, accountEmail, bookings }: { projectId: string; enabled: boolean; accountEmail: string; bookings: BookingRecord[] }) {
  const today = manilaToday();
  const count = (status: BookingStatus) => bookings.filter(booking => booking.status === status).length;
  const upcoming = bookings.filter(booking => booking.status === "confirmed" && booking.preferred_date >= today).length;

  return <>
    {!enabled && <div className="provider-notice"><CalendarOff size={18}/><div><strong>Bookings are turned off</strong><p>Turn on “Let customers send booking requests” in the <Link href={`/studio/business?project=${projectId}`}>site editor</Link> to add a booking form to your website.</p></div></div>}
    <div className="rsvp-summary booking-summary" aria-label="Booking summary"><div><strong>{count("new")}</strong><span>New requests</span></div><div><strong>{upcoming}</strong><span>Upcoming confirmed</span></div><div><strong>{count("done")}</strong><span>Done</span></div><div><strong>{count("declined")}</strong><span>Declined</span></div></div>
    <section className="workspace-section workspace-section-main guest-list-section">
      <div className="workspace-section-head"><div><h2>Booking requests</h2><p>{accountEmail ? <>New requests are also emailed to {accountEmail}.</> : "Newest first."}</p></div><CalendarCheck size={18}/></div>
      {bookings.length === 0 ? <div className="workspace-empty compact"><CalendarCheck size={24}/><h3>No booking requests yet</h3><p>{enabled ? "When a customer books from your website, it appears here." : "Turn on bookings to start receiving requests."}</p></div>
        : <div className="project-table-wrap"><table className="project-table guest-table"><thead><tr><th>Customer</th><th>Preferred time</th><th>For</th><th>Message</th><th>Status</th></tr></thead><tbody>{bookings.map(booking => <tr key={booking.id}>
          <td><strong>{booking.customer_name}</strong><span className="guest-response-date"><a href={`tel:${booking.phone.replace(/[^\d+]/g, "")}`}>{booking.phone}</a>{booking.email && <> · <a href={`mailto:${booking.email}`}>{booking.email}</a></>}</span></td>
          <td>{formatBookingWhen(booking.preferred_date, booking.preferred_time)}<span className="guest-response-date">Sent {new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" }).format(new Date(booking.created_at))}</span></td>
          <td>{booking.service || "—"}</td>
          <td className="guest-notes">{booking.message || "—"}</td>
          <td><StatusSelect projectId={projectId} booking={booking}/></td>
        </tr>)}</tbody></table></div>}
    </section>
  </>;
}
