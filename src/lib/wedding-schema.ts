import { z } from "zod";
import { isGoogleMapsUrl } from "@/lib/google-maps";
import { defaultInvitationDesign, invitationDesignSchema } from "@/lib/site-design";

const nameField = z.string().trim().max(80).default("");

// Wedding and debut invitations share one editor and publishing flow.
// Name fields stay optional at the object level so a draft can switch kinds
// without losing details; requiredness depends on the selected kind.
const invitationObject = z.object({
  eventKind: z.enum(["wedding", "debut"]).default("wedding"),
  brideFirstName: nameField,
  brideMiddleName: nameField,
  brideLastName: nameField,
  groomFirstName: nameField,
  groomMiddleName: nameField,
  groomLastName: nameField,
  celebrantFirstName: nameField,
  celebrantMiddleName: nameField,
  celebrantLastName: nameField,
  date: z.iso.date(),
  venue: z.string().trim().min(2).max(160),
  mapUrl: z.string().trim().max(2048).refine(value => !value || isGoogleMapsUrl(value), "Paste a valid Google Maps share link.").default(""),
  story: z.string().trim().max(800),
  // Debut digital souvenirs
  souvenirMessage: z.string().trim().max(300).default(""),
  photoAlbumUrl: z.string().trim().max(2048).refine(value => !value || isHttpsUrl(value), "Paste the full photo album link, starting with https://.").default(""),
  design: invitationDesignSchema.catch(defaultInvitationDesign),
});

function isHttpsUrl(value: string) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

type InvitationFields = z.infer<typeof invitationObject>;

function requireNamesForKind(value: InvitationFields, ctx: z.RefinementCtx) {
  const required: [keyof InvitationFields, string][] = value.eventKind === "debut"
    ? [["celebrantFirstName", "Enter the celebrant's first name."], ["celebrantLastName", "Enter the celebrant's last name."]]
    : [["brideFirstName", "Enter the bride's first name."], ["brideLastName", "Enter the bride's last name."], ["groomFirstName", "Enter the groom's first name."], ["groomLastName", "Enter the groom's last name."]];
  for (const [field, message] of required) {
    if (!value[field]) ctx.addIssue({ code: "custom", path: [field], message });
  }
}

export const weddingInvitationSchema = invitationObject.superRefine(requireNamesForKind);

export const weddingDraftSchema = invitationObject.extend({
  projectId: z.string().uuid(),
}).superRefine(requireNamesForKind);
