// Where to send someone after sign-in. Only paths on this site are allowed:
// "//evil.com" and "/\evil.com" are read by browsers as other websites, and
// browsers strip tabs and newlines, so "/\t/evil.com" becomes "//evil.com".
export function safeNextPath(value: unknown, fallback = "/dashboard") {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return fallback;
  if (/[\\\s\u0000-\u001f\u007f]/.test(value)) return fallback;
  try {
    const base = "https://getlaunch.invalid";
    const url = new URL(value, base);
    return url.origin === base ? `${url.pathname}${url.search}${url.hash}` : fallback;
  } catch {
    return fallback;
  }
}
