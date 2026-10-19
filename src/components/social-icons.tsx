import type { SocialPlatform } from "@/lib/social-links";

// Lucide removed brand icons, so these simple outlines match its stroke style.
const paths: Record<SocialPlatform, React.ReactNode> = {
  facebook: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>,
  instagram: <><rect width="20" height="20" x="2" y="2" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/></>,
  tiktok: <><path d="M14 3v11.5a4 4 0 1 1-4-4"/><path d="M14 3c.6 2.7 2.4 4.5 5 5"/></>,
};

export function SocialIcon({ platform, size = 18 }: { platform: SocialPlatform; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[platform]}</svg>;
}
