export function formatEventDate(date: string, fallback = "Event date") {
  const parsed = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsed.getTime())
    ? fallback
    : parsed.toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" });
}

// Event dates are calendar days in the Philippines, so compare against Manila's today.
export function hasEventDateArrived(date: string, now = new Date()) {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && today >= date;
}
