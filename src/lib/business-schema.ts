import { z } from "zod";
import { isGoogleMapsUrl } from "@/lib/google-maps";
import { isSocialProfileUrl, socialPlatformLabels, type SocialPlatform } from "@/lib/social-links";

function socialUrl(platform: SocialPlatform) {
  return z.string().trim().max(500)
    .refine(value => !value || isSocialProfileUrl(platform, value), `Paste your full ${socialPlatformLabels[platform]} page link, starting with https://.`)
    .default("");
}

export const businessSiteSchema = z.object({
  businessName: z.string().trim().min(2, "Enter your business name.").max(120),
  businessType: z.string().trim().max(60).default(""),
  tagline: z.string().trim().max(140).default(""),
  about: z.string().trim().max(1000).default(""),
  services: z.string().trim().max(1500).default(""),
  phone: z.string().trim().max(40).regex(/^[0-9+()\-\s]*$/, "Use only numbers, spaces, and + ( ) - in the phone number.").default(""),
  email: z.union([z.literal(""), z.email("Enter a valid email address.").max(200)]).default(""),
  hours: z.string().trim().max(300).default(""),
  address: z.string().trim().max(240).default(""),
  mapUrl: z.string().trim().max(2048).refine(value => !value || isGoogleMapsUrl(value), "Paste a valid Google Maps share link.").default(""),
  facebookUrl: socialUrl("facebook"),
  instagramUrl: socialUrl("instagram"),
  tiktokUrl: socialUrl("tiktok"),
  bookingEnabled: z.boolean().default(false),
});

export const businessDraftSchema = businessSiteSchema.extend({
  projectId: z.string().uuid(),
});
