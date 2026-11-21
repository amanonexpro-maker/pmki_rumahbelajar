import { NextResponse, type NextRequest } from "next/server";

/**
 * PMKI Edge Middleware — Splash Visibility & Cookie-Based Decision (`ADR-13`, `14-Step9`).
 * 
 * 1. Membaca cookie `pmki_splash_seen`.
 * 2. Jika ABSEN: set request header `x-pmki-splash: 1` dan set cookie `pmki_splash_seen=1` (TTL 24 jam).
 *    Kondisional `secure`: dimatikan di dev-local (http://localhost), aktif di HTTPS production.
 * 3. Jika ADA: set request header `x-pmki-splash: 0` agar splash di-omit di SSR.
 * 4. Rute `/gallery` & `/news` dilewatkan langsung agar engine redirect 308 `next.config.ts` tidak terganggu.
 */
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Koeksistensi mutlak: biarkan redirects 308 di next.config.ts menangani rute legacy
  if (pathname === "/gallery" || pathname === "/news") {
    return NextResponse.next();
  }

  const splashSeen = request.cookies.get("pmki_splash_seen");
  const requestHeaders = new Headers(request.headers);

  if (!splashSeen) {
    // Pengunjung pertama / TTL expired -> kirim sinyal tampilkan splash ke SSR
    requestHeaders.set("x-pmki-splash", "1");
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    response.cookies.set("pmki_splash_seen", "1", {
      maxAge: 86400, // 24 jam
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV !== "development",
    });

    return response;
  }

  // Kunjungan ulang dalam 24 jam -> sinyal omit splash
  requestHeaders.set("x-pmki-splash", "0");
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, manifest.webmanifest
     * - file ekstensi statis (svg, png, jpg, jpeg, webp)
     */
    "/((?!api|_next/static|_next/image|favicon\\.ico|manifest\\.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

