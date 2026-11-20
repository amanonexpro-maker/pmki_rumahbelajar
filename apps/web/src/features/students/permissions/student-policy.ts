import type { SessionUser } from "@/server/auth/session";
import { authorize, can, canAccessConfidential } from "@/server/permissions";

/**
 * Students & Guardians Domain Authorization & Privacy Policies (05 §8, §13–14, 11 §27).
 * Guardian data (phone, address, occupation) is CONFIDENTIAL (Default DENY).
 */
export function canReadStudents(
  user: SessionUser | null | undefined,
  serviceUnitId?: string
): boolean {
  return can(user, "student.read", { serviceUnitId });
}

export function authorizeReadStudents(
  user: SessionUser | null | undefined,
  serviceUnitId?: string
) {
  return authorize(user, "student.read", { serviceUnitId });
}

export function authorizeCreateStudent(
  user: SessionUser | null | undefined,
  serviceUnitId: string
) {
  return authorize(user, "student.create", { serviceUnitId });
}

export function authorizeUpdateStudent(
  user: SessionUser | null | undefined,
  serviceUnitId: string
) {
  return authorize(user, "student.update", { serviceUnitId });
}

export function authorizeVerifyStudent(
  user: SessionUser | null | undefined,
  serviceUnitId: string
) {
  return authorize(user, "student.verify", { serviceUnitId });
}

/**
 * CONFIDENTIAL Data Policy (05 §13–14):
 * Default DENY. Requires explicit `guardian.read` permission AND matching service unit scope.
 */
export function canReadConfidentialGuardian(
  user: SessionUser | null | undefined,
  serviceUnitId: string
): boolean {
  return canAccessConfidential(user, "guardian.read", { serviceUnitId });
}

export function canUpdateConfidentialGuardian(
  user: SessionUser | null | undefined,
  serviceUnitId: string
): boolean {
  return canAccessConfidential(user, "guardian.update", { serviceUnitId });
}

