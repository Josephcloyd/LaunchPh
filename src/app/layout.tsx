import type { Metadata, Viewport } from "next";
import { DM_Sans, Instrument_Serif, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm",
  subsets: ["latin"],
  display: "swap",
});

const serif = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: { default: "GetLaunch PH — Your ideas, beautifully launched", template: "%s · GetLaunch PH" },
  description:
    "Create polished wedding invitations, portfolios, and business websites, with practical job-application support made for the Philippines.",
  applicationName: "GetLaunch PH",
  keywords: ["Philippines", "website builder", "job application support", "wedding invitation"],
  openGraph: {
    title: "GetLaunch PH — Your ideas, beautifully launched",
    description: "Professional websites and documents, beautifully made and ready to share.",
    type: "website",
    locale: "en_PH",
    siteName: "GetLaunch PH",
  },
};

export const viewport: Viewport = {
  themeColor: "#344C43",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${jakarta.variable} ${dmSans.variable} ${serif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
