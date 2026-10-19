const GOOGLE_MAPS_HOSTS = new Set([
  "google.com",
  "www.google.com",
  "maps.google.com",
  "maps.app.goo.gl",
  "goo.gl",
]);

export function buildGoogleMapsSearchUrl(query: string) {
  const url = new URL("https://www.google.com/maps/search/");
  url.searchParams.set("api", "1");
  url.searchParams.set("query", query.trim());
  return url.toString();
}

// Keyless embed for an address search. Short share links cannot be embedded,
// so the embedded map always uses the written address.
export function buildGoogleMapsEmbedUrl(query: string) {
  const url = new URL("https://www.google.com/maps");
  url.searchParams.set("q", query.trim());
  url.searchParams.set("output", "embed");
  return url.toString();
}

export function isGoogleMapsUrl(value: string) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    if (url.protocol !== "https:" || !GOOGLE_MAPS_HOSTS.has(hostname)) return false;
    if (hostname === "goo.gl") return url.pathname.startsWith("/maps");
    if (hostname === "maps.app.goo.gl" || hostname === "maps.google.com") return true;
    return url.pathname.startsWith("/maps");
  } catch {
    return false;
  }
}

