import { NextResponse, type NextRequest } from "next/server";
import { hasSupabaseAuthCookie } from "@/server/auth/cookie";

/**
 * Edge-safe Proxy (Next.js 16 Proxy Architecture, ADR-13 / D-28, 14-Step9 & Hotfix).
 * 1. Explicit 308 Permanent Redirects: /news & /gallery dialihkan ke /kabar?tab=...
 * 2. Splash Visibility: HANYA dievaluasi pada root '/', tidak mengganggu rute publik lain.
 * 3. Supabase Auth Coarse Gate: HANYA mengecek keberadaan cookie autentikasi pada rute /workspace
 *    tanpa network RTT ke Supabase (validasi kriptografis & RBAC ditegakkan 100% oleh session.ts di Node runtime).
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

  const response = NextResponse.next({
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

  // 3. Supabase Auth Coarse Route Gating (HANYA untuk /workspace routes)
  // Per ADR-13 D-28: Proxy bertindak sebagai coarse gate (cek keberadaan cookie, 0x network RTT ke Supabase).
  // Validasi kriptografis token dan resolusi RBAC ditegakkan secara otoritatif oleh session.ts di Node runtime.
  const isWorkspaceRoute = pathname.startsWith("/workspace");
  if (!isWorkspaceRoute) {
    return response;
  }

  const hasAuthCookie = hasSupabaseAuthCookie(request.cookies.getAll());

  if (!hasAuthCookie) {
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
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, robots.txt, sitemap.xml, manifest.webmanifest
     * - static files with extensions (svg, png, jpg, jpeg, gif, webp, avif, woff, woff2, ttf, ico)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|woff|woff2|ttf|ico)$).*)",
  ],
};
