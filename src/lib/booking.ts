// Shared by the public booking form, the server action, and the owner's bookings page.

export const bookingStatuses = ["new", "confirmed", "declined", "done"] as const;
export type BookingStatus = (typeof bookingStatuses)[number];
export const bookingStatusLabels: Record<BookingStatus, string> = { new: "New", confirmed: "Confirmed", declined: "Declined", done: "Done" };

/** Today's date in the Philippines, as YYYY-MM-DD. */
export function manilaToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

/** "Sat, Nov 7, 2026 at 2:30 PM" from a YYYY-MM-DD date and an HH:MM (or HH:MM:SS) time. */
export function formatBookingWhen(date: string, time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const day = new Intl.DateTimeFormat("en-PH", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
  const clock = `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${hours < 12 ? "AM" : "PM"}`;
  return `${day} at ${clock}`;
}
