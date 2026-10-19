import type { LucideIcon } from "lucide-react";

// The free tools listed on /free-builders, in display order.
//
// To add one, copy this shape into the list below:
//   {
//     slug: "qr-code-maker",                  // unique, lowercase, dashes
//     name: "QR Code Maker",
//     description: "Turn any link into a printable QR code.",
//     category: "Tools",
//     href: "/free-builders/qr-code-maker",   // a page in this app, or a full https:// link
//     status: "live",                          // "live" or "coming-soon"
//     icon: QrCode,                            // any icon from lucide-react
//   },
export type FreeBuilder = {
  slug: string;
  name: string;
  description: string;
  category: string;
  href: string;
  status: "live" | "coming-soon";
  icon: LucideIcon;
};

export const freeBuilders: FreeBuilder[] = [];
