import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge-safe Proxy (Next.js 16 Proxy Architecture, ADR-13 / D-28, 14-Step9).
 * 1. Koeksistensi mutlak: rute /gallery & /news dilewatkan langsung ke engine 308 next.config.ts.
 * 2. Splash Visibility: Membaca cookie pmki_splash_seen, set header x-pmki-splash & cookie 24 jam.
 * 3. Supabase Auth: Refresh session cookies dan gate kasar rute /workspace.
 * FORBIDDEN: importing Drizzle, postgres-js, atau domain repositories di sini.
 */
export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 1. Koeksistensi mutlak: biarkan redirects 308 di next.config.ts menangani rute legacy
  if (pathname === "/gallery" || pathname === "/news") {
    return NextResponse.next();
  }

  // 2. Splash Visibility Decision (Cookie-based server coordination)
  const splashSeen = request.cookies.get("pmki_splash_seen");
  const requestHeaders = new Headers(request.headers);

  if (!splashSeen) {
    requestHeaders.set("x-pmki-splash", "1");
  } else {
    requestHeaders.set("x-pmki-splash", "0");
  }

  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  if (!splashSeen) {
    response.cookies.set("pmki_splash_seen", "1", {
      maxAge: 86400, // 24 jam
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV !== "development",
    });
  }

  // 3. Supabase Auth Session Refresh & Route Gating
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
        if (!splashSeen) {
          response.cookies.set("pmki_splash_seen", "1", {
            maxAge: 86400,
            path: "/",
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV !== "development",
          });
        }
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Always call getUser() (never getSession()) to verify & refresh auth state
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isWorkspaceRoute = pathname.startsWith("/workspace");

  if (isWorkspaceRoute && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/auth/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

// Default export for Proxy compatibility
export default proxy;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
