import type { SessionUser } from "@/server/auth/session";
import { authorize, can } from "@/server/permissions";

/**
 * Academic Domain Authorization Policies (05 §8, 11 §27).
 */
export function canReadClasses(
  user: SessionUser | null | undefined,
  serviceUnitId?: string
): boolean {
  return can(user, "class.read", { serviceUnitId });
}

export function authorizeCreateClass(
  user: SessionUser | null | undefined,
  serviceUnitId: string
) {
  return authorize(user, "class.create", { serviceUnitId });
}

export function authorizeUpdateClass(
  user: SessionUser | null | undefined,
  serviceUnitId: string
) {
  return authorize(user, "class.update", { serviceUnitId });
}

export function canReadSchedules(
  user: SessionUser | null | undefined,
  serviceUnitId?: string
): boolean {
  return can(user, "schedule.read", { serviceUnitId });
}

