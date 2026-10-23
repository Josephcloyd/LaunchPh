import { z } from "zod";

// Style and photo choices for invitations and business sites. Stored as `design` (jsonb) on
// wedding_events / business_profiles and copied into the published content.

/** Uploaded photos: "<user id>/<uuid>.webp" in the public site-photos bucket. Sample photos
 * bundled with the app ("/template-previews/<name>.webp") are allowed too. */
const photoPathPattern = /^(?:[0-9a-f-]{36}\/[0-9a-f-]{36}\.(?:webp|jpg)|\/template-previews\/[a-z0-9-]+\.webp)$/;
export const photoPathSchema = z.string().regex(photoPathPattern, "That photo could not be used. Please upload it again.");
// Unknown or tampered values fall back quietly, so one bad entry never breaks a page.
const optionalPhoto = z.union([z.literal(""), photoPathSchema]).catch("");
export const maxGalleryPhotos = 6;
const gallery = z.array(z.string()).catch([]).transform(list => list.filter(path => photoPathPattern.test(path)).slice(0, maxGalleryPhotos));

export const isSamplePhoto = (path: string) => path.startsWith("/template-previews/");

/** Address of a stored photo, for <img src>. */
export function photoUrl(path: string) {
  if (!path || isSamplePhoto(path)) return path;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/site-photos/${path}`;
}

/** Every photo a design uses, e.g. to clean up storage when a project is deleted. */
export function designPhotos(design: { coverPhoto?: unknown; logo?: unknown; gallery?: unknown }) {
  const gallery = Array.isArray(design.gallery) ? design.gallery : [];
  return [design.coverPhoto, design.logo, ...gallery].filter((path): path is string => typeof path === "string" && path !== "" && !isSamplePhoto(path));
}

// ---------------------------------------------------------------- Invitations
export const invitationThemes = [
  { id: "sage", name: "Sage", swatch: ["#f8f6f0", "#2c463c", "#9db3a5"] },
  { id: "blush", name: "Blush", swatch: ["#fbf3f0", "#6d3b44", "#dba3a5"] },
  { id: "navy", name: "Navy & gold", swatch: ["#f4f5f8", "#1f2f4d", "#b8995a"] },
  { id: "terracotta", name: "Terracotta", swatch: ["#faf2ea", "#7a3d24", "#d48a5c"] },
  { id: "lavender", name: "Lavender", swatch: ["#f7f4fb", "#493d6b", "#ab9bd4"] },
  { id: "midnight", name: "Midnight", swatch: ["#17191d", "#f2e8d8", "#c9a86a"] },
] as const;
export const invitationFonts = [
  { id: "classic", name: "Classic", sample: "Aa", description: "Elegant serif" },
  { id: "script", name: "Script", sample: "Aa", description: "Handwritten names" },
  { id: "modern", name: "Modern", sample: "Aa", description: "Clean and simple" },
] as const;
export const invitationLayouts = [
  { id: "cover", name: "Photo cover", description: "Your photo fills the top, with names over it" },
  { id: "framed", name: "Framed", description: "Your photo in an arch below the names" },
] as const;

type Ids<T extends readonly { id: string }[]> = T[number]["id"];
const ids = <T extends readonly { id: string }[]>(list: T) => list.map(item => item.id) as [Ids<T>, ...Ids<T>[]];

export const invitationDesignSchema = z.object({
  theme: z.enum(ids(invitationThemes)).catch("sage"),
  font: z.enum(ids(invitationFonts)).catch("classic"),
  layout: z.enum(ids(invitationLayouts)).catch("cover"),
  coverPhoto: optionalPhoto,
  gallery,
});
export type InvitationDesign = z.infer<typeof invitationDesignSchema>;
export const defaultInvitationDesign: InvitationDesign = { theme: "sage", font: "classic", layout: "cover", coverPhoto: "", gallery: [] };

// ---------------------------------------------------------------- Business sites
export const businessThemes = [
  { id: "forest", name: "Forest", swatch: ["#2c463c", "#fbfaf6", "#a9bdb3"] },
  { id: "ocean", name: "Ocean", swatch: ["#1d4a66", "#f7fafc", "#8fb8cf"] },
  { id: "espresso", name: "Espresso", swatch: ["#4a3326", "#fbf7f2", "#c9a37f"] },
  { id: "plum", name: "Plum", swatch: ["#4b2b4f", "#fbf7fb", "#c7a4c9"] },
  { id: "terracotta", name: "Terracotta", swatch: ["#93452a", "#fcf6f1", "#e3a07c"] },
  { id: "charcoal", name: "Charcoal", swatch: ["#24272b", "#f8f8f7", "#f0b44c"] },
] as const;
export const businessFonts = [
  { id: "modern", name: "Modern", sample: "Aa", description: "Clean sans-serif" },
  { id: "classic", name: "Classic", sample: "Aa", description: "Elegant serif headings" },
] as const;

export const businessDesignSchema = z.object({
  theme: z.enum(ids(businessThemes)).catch("forest"),
  font: z.enum(ids(businessFonts)).catch("modern"),
  logo: optionalPhoto,
  coverPhoto: optionalPhoto,
  gallery,
});
export type BusinessDesign = z.infer<typeof businessDesignSchema>;
export const defaultBusinessDesign: BusinessDesign = { theme: "forest", font: "modern", logo: "", coverPhoto: "", gallery: [] };

// Sample photos (public/template-previews) are CC0 photos from StockSnap. New drafts and the
// template gallery start with them so owners can see the design before adding their own.
const sample = (name: string) => `/template-previews/${name}.webp`;
export function sampleInvitationDesign(kind: "wedding" | "debut"): InvitationDesign {
  return kind === "debut"
    ? { theme: "blush", font: "script", layout: "cover", coverPhoto: sample("debut-cover"), gallery: ["debut-roses", "debut-cake", "debut-candles", "debut-gowns"].map(sample) }
    : { theme: "sage", font: "classic", layout: "cover", coverPhoto: sample("wedding-cover"), gallery: ["wedding-rings", "wedding-bouquet", "wedding-hands", "wedding-shoes"].map(sample) };
}
export const sampleBusinessDesign: BusinessDesign = { theme: "espresso", font: "modern", logo: "", coverPhoto: sample("cafe-cover"), gallery: ["cafe-latte", "cafe-croissant", "cafe-table", "cafe-beans"].map(sample) };

/** Reads a stored design, falling back to defaults for anything missing or unknown. */
export function readInvitationDesign(value: unknown): InvitationDesign {
  const parsed = invitationDesignSchema.safeParse(value ?? {});
  return parsed.success ? parsed.data : defaultInvitationDesign;
}
export function readBusinessDesign(value: unknown): BusinessDesign {
  const parsed = businessDesignSchema.safeParse(value ?? {});
  return parsed.success ? parsed.data : defaultBusinessDesign;
}

/** Photos must be the owner's own uploads (or bundled samples). */
export function photosBelongTo(userId: string, design: Parameters<typeof designPhotos>[0]) {
  return designPhotos(design).every(path => path.startsWith(`${userId}/`));
}
