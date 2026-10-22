import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const privateStudioProject = path.startsWith("/studio/") && request.nextUrl.searchParams.has("project");

  if ((path.startsWith("/dashboard") || path.startsWith("/admin") || privateStudioProject) && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/auth";
    loginUrl.search = "";
    loginUrl.searchParams.set("next", `${path}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }
  if (path.startsWith("/admin") && user) {
    // The page also calls notFound(), but the root loading.tsx starts streaming first, which
    // locks in a 200. Checking here gives non-admins a real 404.
    const { data: isAdmin } = await supabase.rpc("is_admin");
    if (isAdmin !== true) {
      const notFoundResponse = NextResponse.rewrite(new URL("/404", request.url), { status: 404 });
      response.cookies.getAll().forEach(cookie => notFoundResponse.cookies.set(cookie));
      return notFoundResponse;
    }
  }
  if (path === "/auth" && user) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    dashboardUrl.search = "";
    return NextResponse.redirect(dashboardUrl);
  }
  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/auth", "/studio/:path*"],
};
