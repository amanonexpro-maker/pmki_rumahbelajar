import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { resolveAccessCached } from "@/features/administration";
import { getUserPersona, type UserPersona } from "@/lib/auth/personas";
import { createSupabaseServerClient } from "./supabase-server";

export interface SessionMembership {
  organizationId: string;
  serviceUnitId: string;
  programId?: string;
}

/**
 * Canonical Session Contract (05 §20 — unchanged under ADR-13).
 * Permissions are ALWAYS resolved per-request from DB (never from JWT claims).
 */
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  roles: string[];
  permissions: string[];
  memberships: SessionMembership[];
  persona?: UserPersona;
}

/**
 * Retrieves the authenticated session using `supabase.auth.getUser()` (D-19),
 * NEVER `getSession()`, and resolves dynamic RBAC permissions per-request (D-20).
 * Inactive users are treated as unauthenticated (Default Deny).
 * Wrapped in React `cache` so layout and page share a single evaluation per request.
 */
export const getCurrentSession = cache(
  async (): Promise<SessionUser | null> => {
    await connection();

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    const access = await resolveAccessCached(user.id);
    if (!access.active) {
      return null;
    }

    return {
      id: user.id,
      email: user.email ?? "",
      name: access.name || user.email || "Pengguna PMKI",
      roles: access.roles,
      permissions: access.permissions,
      memberships: access.memberships,
      persona: getUserPersona(access.roles),
    };
  }
);

/**
 * Server-side route guard for protected workspace pages & layouts.
 */
export async function requireSession(): Promise<SessionUser> {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/auth/login");
  }
  return session;
}
