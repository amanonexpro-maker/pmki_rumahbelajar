import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge-safe Proxy (Next.js 16 Proxy Architecture, ADR-13 / D-28, 14-Step9 & Hotfix).
 * 1. Explicit 308 Permanent Redirects: /news & /gallery dialihkan ke /kabar?tab=...
 * 2. Splash Visibility: HANYA dievaluasi pada root '/', tidak mengganggu rute publik lain.
 * 3. Supabase Auth: HANYA dievaluasi dan di-refresh pada rute /workspace.
 * FORBIDDEN: importing Drizzle, postgres-js, atau domain repositories di sini.
 */
export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 1. Explicit 308 Permanent Redirects for legacy routes
  if (pathname === "/news" || pathname === "/news/") {
    const url = request.nextUrl.clone();
    url.pathname = "/kabar";
    url.search = "?tab=berita";
    return NextResponse.redirect(url, 308);
  }

  if (pathname.startsWith("/news/")) {
    const slug = pathname.replace(/^\/news\//, "");
    const url = request.nextUrl.clone();
    url.pathname = `/kabar/${slug}`;
    return NextResponse.redirect(url, 308);
  }

  if (pathname === "/gallery" || pathname === "/gallery/") {
    const url = request.nextUrl.clone();
    url.pathname = "/kabar";
    url.search = "?tab=galeri";
    return NextResponse.redirect(url, 308);
  }

  // 2. Splash Visibility Decision (Hanya pada root '/')
  const isRootRoute = pathname === "/";
  const splashSeen = request.cookies.get("pmki_splash_seen");
  const requestHeaders = new Headers(request.headers);

  if (isRootRoute && !splashSeen) {
    requestHeaders.set("x-pmki-splash", "1");
  } else {
    requestHeaders.set("x-pmki-splash", "0");
  }

  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  if (isRootRoute && !splashSeen) {
    response.cookies.set("pmki_splash_seen", "1", {
      maxAge: 86400, // 24 jam
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV !== "development",
    });
  }

  // 3. Supabase Auth Session Refresh & Route Gating (HANYA untuk /workspace routes)
  const isWorkspaceRoute = pathname.startsWith("/workspace");
  if (!isWorkspaceRoute) {
    return response;
  }

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
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
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
