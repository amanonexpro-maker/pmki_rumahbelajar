import type { SessionUser } from "@/server/auth/session";
import { authorize, can } from "@/server/permissions";

/**
 * Audit Domain Authorization Policies (05 §8, 11 §18).
 * Audit Trail is strictly READ-ONLY (`audit.read`) in UI and API.
 * No role (not even PLATFORM_ADMIN) has UPDATE or DELETE permission on `audit_logs`.
 */
export function canReadAuditLogs(
  user: SessionUser | null | undefined,
  serviceUnitId?: string
): boolean {
  return can(user, "audit.read", { serviceUnitId });
}

export function authorizeReadAuditLogs(
  user: SessionUser | null | undefined,
  serviceUnitId?: string
) {
  return authorize(user, "audit.read", { serviceUnitId });
}

