// URL-safe address for a published site, e.g. "lea-and-miguel-k3f9". The random suffix keeps
// two couples with the same names from colliding, and makes addresses hard to guess.
export function siteSlug(...parts: string[]) {
  const base = parts.join(" ")
    .normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    .slice(0, 48).replace(/-+$/, "") || "site";
  const suffix = Array.from(crypto.getRandomValues(new Uint8Array(4)), byte => "abcdefghjkmnpqrstuvwxyz23456789"[byte % 31]).join("");
  return `${base}-${suffix}`;
}
