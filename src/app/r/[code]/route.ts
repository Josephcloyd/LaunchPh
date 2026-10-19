import { NextResponse, type NextRequest } from "next/server";
import { normalizeReferralCode, REFERRAL_COOKIE, REFERRAL_COOKIE_MAX_AGE } from "@/lib/referral";

// Share links look like /r/AB12CD34. The code is remembered for 30 days and
// filled in automatically at checkout.
export async function GET(request: NextRequest, ctx: RouteContext<"/r/[code]">) {
  const code = normalizeReferralCode((await ctx.params).code);
  const response = NextResponse.redirect(new URL("/", request.url));
  if (code) {
    response.cookies.set(REFERRAL_COOKIE, code, {
      maxAge: REFERRAL_COOKIE_MAX_AGE,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
  }
  return response;
}
