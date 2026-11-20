import type { SessionUser } from "@/server/auth/session";
import { authorize, can } from "@/server/permissions";

/**
 * Administration Domain Authorization Policies (05 §8, §16, 10 §26, U-08, U-12).
 */
export function canReadAdministration(
  user: SessionUser | null | undefined
): boolean {
  return (
    can(user, "user.read") ||
    can(user, "role.manage") ||
    can(user, "permission.manage")
  );
}

export function authorizeReadAdministration(
  user: SessionUser | null | undefined
) {
  const uRead = authorize(user, "user.read");
  if (uRead.success) return uRead;
  const rMan = authorize(user, "role.manage");
  if (rMan.success) return rMan;
  return authorize(user, "permission.manage");
}

export function authorizeManageUsers(user: SessionUser | null | undefined) {
  const uCreate = authorize(user, "user.create");
  if (uCreate.success) return uCreate;
  const uUpdate = authorize(user, "user.update");
  if (uUpdate.success) return uUpdate;
  return authorize(user, "role.manage");
}

export function authorizeManageRoles(user: SessionUser | null | undefined) {
  return authorize(user, "role.manage");
}

export function authorizeManagePermissions(
  user: SessionUser | null | undefined
) {
  const pMan = authorize(user, "permission.manage");
  if (pMan.success) return pMan;
  return authorize(user, "role.manage");
}

/**
 * Sandbox / "Lingkungan Uji Coba" Isolation Policy (`10 §26`, `U-08`, `U-12`, Product Owner Rule #4).
 * Strictly limited to `PLATFORM_ADMIN` when `NODE_ENV !== "production"`.
 * Never exposed in production builds or to regular users.
 */
export function canAccessSandboxEnvironment(
  user: SessionUser | null | undefined,
  nodeEnv: string | undefined = process.env.NODE_ENV
): boolean {
  if (nodeEnv === "production") {
    return false;
  }
  if (!user || !user.id) {
    return false;
  }
  return (
    user.roles.includes("PLATFORM_ADMIN") && can(user, "role.manage")
  );
}

