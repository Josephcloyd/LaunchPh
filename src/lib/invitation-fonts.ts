import { Cormorant_Garamond, Great_Vibes } from "next/font/google";

// Extra typefaces for the invitation font styles (see invitationFonts in site-design.ts).
// Imported only by the invitation, so other pages don't load them.
const script = Great_Vibes({ variable: "--font-script", subsets: ["latin"], weight: "400", display: "swap" });
const cormorant = Cormorant_Garamond({ variable: "--font-cormorant", subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"], display: "swap" });

export const invitationFontVariables = `${script.variable} ${cormorant.variable}`;
