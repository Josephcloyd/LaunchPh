import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Supabase is called from the browser for auth and data; wss is for realtime.
const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin : "https://*.supabase.co";
const supabaseSocket = supabaseOrigin.replace(/^https:/, "wss:");

// Static policy, so pages stay statically rendered. Next.js's inline hydration scripts need
// 'unsafe-inline' without per-request nonces; the home page's JSON-LD is a data block and
// isn't affected. React needs 'unsafe-eval' only in development.
// Cloudflare Turnstile (bot check on the public inquiry forms) loads from challenges.cloudflare.com.
const turnstileOrigin = "https://challenges.cloudflare.com";
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${turnstileOrigin}${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self' ${supabaseOrigin} ${supabaseSocket}${isDev ? " ws:" : ""}`,
  `frame-src https://www.google.com https://maps.google.com ${turnstileOrigin}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), usb=(), browsing-topics=()" },
  // Add "; preload" only once the production domain is final; leaving the preload list takes months.
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]),
];

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
