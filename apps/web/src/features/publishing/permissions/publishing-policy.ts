import type { SessionUser } from "@/server/auth/session";
import { authorize, can } from "@/server/permissions";

/**
 * Publishing Domain Authorization & Separation of Duties Policies (05 §8, §15, 11 §17).
 *
 * CRITICAL RULE (Product Owner Rule #5):
 * Author (`authorId`) MUST NOT be the publisher (`publication.publish`) of their own
 * publication (`requireSeparationOfDuties: true`). Wins even over PLATFORM_ADMIN.
 */
export function canReadPublications(
  user: SessionUser | null | undefined,
  serviceUnitId?: string
): boolean {
  return can(user, "publication.read", { serviceUnitId });
}

export function authorizeReadPublications(
  user: SessionUser | null | undefined,
  serviceUnitId?: string
) {
  return authorize(user, "publication.read", { serviceUnitId });
}

export function canCreatePublication(
  user: SessionUser | null | undefined,
  serviceUnitId?: string
): boolean {
  return can(user, "publication.create", { serviceUnitId });
}

export function authorizeCreatePublication(
  user: SessionUser | null | undefined,
  serviceUnitId: string
) {
  return authorize(user, "publication.create", { serviceUnitId });
}

export function authorizeSubmitForPrivacyReview(
  user: SessionUser | null | undefined,
  serviceUnitId: string
) {
  const upd = authorize(user, "publication.update", { serviceUnitId });
  if (upd.success) return upd;
  return authorize(user, "publication.create", { serviceUnitId });
}

export function authorizeReviewPublicationPrivacy(
  user: SessionUser | null | undefined,
  serviceUnitId: string
) {
  return authorize(user, "publication.review", { serviceUnitId });
}

export function canPublishPublicationWithSoD(
  user: SessionUser | null | undefined,
  serviceUnitId: string,
  authorId: string | null
): boolean {
  return can(user, "publication.publish", {
    serviceUnitId,
    requireSeparationOfDuties: true,
    resourceOwnerId: authorId,
  });
}

export function authorizePublishPublicationWithSoD(
  user: SessionUser | null | undefined,
  serviceUnitId: string,
  authorId: string | null
) {
  return authorize(user, "publication.publish", {
    serviceUnitId,
    requireSeparationOfDuties: true,
    resourceOwnerId: authorId,
  });
}

