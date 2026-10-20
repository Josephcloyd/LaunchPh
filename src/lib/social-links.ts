export type SocialPlatform = "facebook" | "instagram" | "tiktok";

const SOCIAL_HOSTS: Record<SocialPlatform, string[]> = {
  facebook: ["facebook.com", "fb.com"],
  instagram: ["instagram.com"],
  tiktok: ["tiktok.com"],
};

export const socialPlatformLabels: Record<SocialPlatform, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
};

export function isSocialProfileUrl(platform: SocialPlatform, value: string) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase().replace(/^(www|m)\./, "");
    return url.protocol === "https:" && SOCIAL_HOSTS[platform].includes(hostname) && url.pathname.length > 1;
  } catch {
    return false;
  }
}

/** GetLaunch PH's own Facebook page. */
export const GETLAUNCH_FACEBOOK_URL = "https://www.facebook.com/GetLaunchPH";
