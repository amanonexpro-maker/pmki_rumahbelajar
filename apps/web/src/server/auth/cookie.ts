/**
 * Supabase Auth Cookie Detection (ADR-13 D-28, Fase 17 Step 2.1).
 * Pure synchronous predicate that checks for the presence of a Supabase auth token cookie.
 * Type-universal across NextRequest['cookies'] (Edge proxy) and cookies() (Node Server Components).
 * RTT-free by construction: zero async, zero fetch, zero Supabase client, zero remote await.
 */

export interface CookieItem {
  name: string;
}

/**
 * Checks if the provided cookie collection contains a Supabase auth token.
 * Matches `sb-*-auth-token` and chunked variants (`sb-*-auth-token.0`, `sb-*-auth-token.1`).
 */
export function hasSupabaseAuthCookie(
  cookies: Iterable<CookieItem> | readonly CookieItem[]
): boolean {
  for (const c of cookies) {
    if (
      c.name.startsWith("sb-") &&
      (c.name.endsWith("-auth-token") || c.name.includes("-auth-token."))
    ) {
      return true;
    }
  }
  return false;
}

