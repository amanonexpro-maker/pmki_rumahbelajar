import type { SessionUser } from "@/server/auth/session";
import { authorize, can } from "@/server/permissions";

/**
 * Media Domain Authorization & Separation of Duties Policies (05 §8, §15, U-10).
 *
 * CRITICAL RULE (U-10 & Product Owner Rule #4):
 * The user who uploaded a media asset (`uploadedBy`) MUST NOT be the privacy reviewer
 * of that same asset (`requireSeparationOfDuties: true`). Wins even over PLATFORM_ADMIN.
 */
export function canReadMedia(
  user: SessionUser | null | undefined,
  serviceUnitId?: string
): boolean {
  return can(user, "media.read", { serviceUnitId });
}

export function authorizeReadMedia(
  user: SessionUser | null | undefined,
  serviceUnitId?: string
) {
  return authorize(user, "media.read", { serviceUnitId });
}

export function canCreateMedia(
  user: SessionUser | null | undefined,
  serviceUnitId?: string
): boolean {
  return can(user, "media.create", { serviceUnitId });
}

export function authorizeCreateMedia(
  user: SessionUser | null | undefined,
  serviceUnitId: string
) {
  return authorize(user, "media.create", { serviceUnitId });
}

export function canReviewMediaAsset(
  user: SessionUser | null | undefined,
  serviceUnitId: string,
  uploadedByUserId: string | null
): boolean {
  return can(user, "media.review", {
    serviceUnitId,
    requireSeparationOfDuties: true,
    resourceOwnerId: uploadedByUserId,
  });
}

export function authorizeReviewMediaWithSoD(
  user: SessionUser | null | undefined,
  serviceUnitId: string,
  uploadedByUserId: string | null
) {
  return authorize(user, "media.review", {
    serviceUnitId,
    requireSeparationOfDuties: true,
    resourceOwnerId: uploadedByUserId,
  });
}

