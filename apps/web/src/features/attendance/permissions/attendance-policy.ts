import type { SessionUser } from "@/server/auth/session";
import { authorize, can } from "@/server/permissions";

/**
 * Attendance Domain Authorization Policies (05 §8, 11 §12, §27).
 */
export function canReadAttendance(
  user: SessionUser | null | undefined,
  serviceUnitId?: string
): boolean {
  return can(user, "attendance.read", { serviceUnitId });
}

export function authorizeReadAttendance(
  user: SessionUser | null | undefined,
  serviceUnitId?: string
) {
  return authorize(user, "attendance.read", { serviceUnitId });
}

export function canRecordAttendance(
  user: SessionUser | null | undefined,
  serviceUnitId?: string
): boolean {
  return (
    can(user, "attendance.record", { serviceUnitId }) ||
    can(user, "attendance.update", { serviceUnitId })
  );
}

export function authorizeRecordAttendance(
  user: SessionUser | null | undefined,
  serviceUnitId: string
) {
  const rec = authorize(user, "attendance.record", { serviceUnitId });
  if (rec.success) return rec;
  return authorize(user, "attendance.update", { serviceUnitId });
}

