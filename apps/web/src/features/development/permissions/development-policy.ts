import type { SessionUser } from "@/server/auth/session";
import { authorize, can, canAccessConfidential } from "@/server/permissions";

/**
 * Development Domain Authorization & Confidential Data Policies (05 §8, §13–14, 11 §13).
 *
 * CRITICAL PRIVACY RULE (Product Owner Rule #4):
 * - `development_notes.confidential` defaults to `true`.
 * - Confidential notes of other teachers are NOT visible to regular teachers unless
 *   the caller holds `development.review` (or is the authoring teacher / creator)
 *   AND passes `canAccessConfidential(user, "development.read", { serviceUnitId })`.
 */
export function authorizeReadDevelopment(
  user: SessionUser | null | undefined,
  serviceUnitId?: string
) {
  return authorize(user, "development.read", { serviceUnitId });
}

export function authorizeCreateOrUpdateDevelopment(
  user: SessionUser | null | undefined,
  serviceUnitId: string,
  isUpdate = false
) {
  if (isUpdate) {
    const upd = authorize(user, "development.update", { serviceUnitId });
    if (upd.success) return upd;
  }
  return authorize(user, "development.create", { serviceUnitId });
}

export function canViewDevelopmentNoteRecord(params: {
  user: SessionUser | null | undefined;
  serviceUnitId: string;
  confidential: boolean;
  noteTeacherId: string;
  noteCreatedBy: string | null;
  actorTeacherId?: string | null;
}): boolean {
  const {
    user,
    serviceUnitId,
    confidential,
    noteTeacherId,
    noteCreatedBy,
    actorTeacherId,
  } = params;

  if (!can(user, "development.read", { serviceUnitId })) {
    return false;
  }

  if (!confidential) {
    return true;
  }

  // Confidential note requires confidential classification gate
  if (!canAccessConfidential(user, "development.read", { serviceUnitId })) {
    return false;
  }

  // Authoring teacher / creator can read their own confidential observation
  if (
    (user?.id && noteCreatedBy === user.id) ||
    (actorTeacherId && noteTeacherId === actorTeacherId)
  ) {
    return true;
  }

  // Coordinators / Reviewers with explicit `development.review` in this unit can review confidential notes
  return can(user, "development.review", { serviceUnitId });
}

