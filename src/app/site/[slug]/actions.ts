"use server";

import { z } from "zod";
import { businessSiteSchema } from "@/lib/business-schema";
import { formatBookingWhen, manilaToday } from "@/lib/booking";
import { verifyTurnstile, withinRateLimit } from "@/services/abuse-protection";
import { appUrl, sendEmail } from "@/services/email";
import { createSupabaseAdminClient } from "@/services/supabase-admin";

export type BookingResult = { ok: boolean; message: string };

const bookingSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(120),
  phone: z.string().trim().min(7, "Enter a phone number the business can call or text.").max(40).regex(/^[0-9+()\-\s]+$/, "Use only numbers, spaces, and + ( ) - in the phone number."),
  email: z.union([z.literal(""), z.email("Enter a valid email address, or leave it blank.").max(200)]),
  service: z.string().trim().max(200),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date."),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Choose a time."),
  message: z.string().trim().max(1000),
  website: z.string().max(0),
});

const field = (formData: FormData, name: string) => String(formData.get(name) ?? "");

export async function submitBooking(slug: string, formData: FormData): Promise<BookingResult> {
  const parsed = bookingSchema.safeParse({
    name: field(formData, "name"),
    phone: field(formData, "phone"),
    email: field(formData, "email"),
    service: field(formData, "service"),
    date: field(formData, "date"),
    time: field(formData, "time"),
    message: field(formData, "message"),
    website: field(formData, "website"),
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Please check your details." };
  const booking = parsed.data;

  const today = manilaToday();
  const latest = new Date(`${today}T00:00:00Z`);
  latest.setUTCFullYear(latest.getUTCFullYear() + 1);
  if (booking.date < today) return { ok: false, message: "Choose a date from today onwards." };
  if (booking.date > latest.toISOString().slice(0, 10)) return { ok: false, message: "Choose a date within the next year." };

  if (!(await verifyTurnstile(formData.get("cf-turnstile-response")))) return { ok: false, message: "Please complete the verification check and try again." };
  if (!(await withinRateLimit("business_booking", 5, 3600))) return { ok: false, message: "You’ve sent several requests recently. Please try again in an hour." };

  const admin = createSupabaseAdminClient();
  const { data } = await admin.rpc("get_business_booking_target", { requested_slug: slug }).maybeSingle();
  const target = data as { project_id: string; owner_email: string | null; content: unknown } | null;
  const site = target ? businessSiteSchema.safeParse(target.content) : null;
  if (!target || !site?.success || !site.data.bookingEnabled) return { ok: false, message: "This business isn’t taking bookings online right now." };

  // Only keep a service the business actually lists.
  const services = site.data.services.split("\n").map(line => line.trim()).filter(Boolean);
  const service = services.includes(booking.service) ? booking.service : "";

  const { error } = await admin.from("business_bookings").insert({
    project_id: target.project_id,
    customer_name: booking.name,
    phone: booking.phone,
    email: booking.email || null,
    service: service || null,
    preferred_date: booking.date,
    preferred_time: booking.time,
    message: booking.message || null,
  });
  if (error) return { ok: false, message: "Bookings are temporarily unavailable. Please call or message the business instead." };

  const business = site.data.businessName;
  const when = formatBookingWhen(booking.date, booking.time);
  if (target.owner_email) {
    await sendEmail({
      to: target.owner_email,
      subject: `New booking request: ${booking.name}, ${when}`,
      replyTo: booking.email || undefined,
      lines: [
        `${booking.name} sent a booking request through your ${business} website.`,
        `When: ${when}`,
        ...(service ? [`For: ${service}`] : []),
        `Phone: ${booking.phone}`,
        ...(booking.email ? [`Email: ${booking.email} (reply to this email to answer them)`] : []),
        ...(booking.message ? [`Message: ${booking.message}`] : []),
        "Contact them to confirm, then mark the booking in your dashboard.",
      ],
      action: { label: "View bookings", url: appUrl(`/dashboard/projects/${target.project_id}/bookings`) },
    });
  }
  if (booking.email) {
    await sendEmail({
      to: booking.email,
      subject: `Your booking request to ${business}`,
      replyTo: site.data.email || undefined,
      lines: [
        `Hi ${booking.name},`,
        `We sent your booking request to ${business} for ${when}${service ? ` (${service})` : ""}.`,
        "This is not a confirmed booking yet. They will contact you to confirm.",
        ...(site.data.phone ? [`You can also reach them at ${site.data.phone}.`] : []),
      ],
    });
  }

  return { ok: true, message: `Thank you! Your request was sent. ${business} will contact you to confirm.` };
}
