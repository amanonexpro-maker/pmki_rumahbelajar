import type { SessionUser } from "@/server/auth/session";
import { authorize, can, canAccessConfidential } from "@/server/permissions";

/**
 * Consent Domain Authorization & Confidential Evidence Policies (05 §8, §13–14, 11 §14).
 * Consent evidence (`notes`) is CONFIDENTIAL (Default DENY).
 */
export function canReadConsents(
  user: SessionUser | null | undefined,
  serviceUnitId?: string
): boolean {
  return can(user, "consent.read", { serviceUnitId });
}

export function authorizeReadConsents(
  user: SessionUser | null | undefined,
  serviceUnitId?: string
) {
  return authorize(user, "consent.read", { serviceUnitId });
}

export function canReadConfidentialConsentEvidence(
  user: SessionUser | null | undefined,
  serviceUnitId: string
): boolean {
  return (
    canAccessConfidential(user, "consent.read", { serviceUnitId }) ||
    canAccessConfidential(user, "consent.review", { serviceUnitId })
  );
}

export function canUpdateConsent(
  user: SessionUser | null | undefined,
  serviceUnitId?: string
): boolean {
  return (
    can(user, "consent.update", { serviceUnitId }) ||
    can(user, "consent.review", { serviceUnitId })
  );
}

export function authorizeUpdateConsent(
  user: SessionUser | null | undefined,
  serviceUnitId: string
) {
  const upd = authorize(user, "consent.update", { serviceUnitId });
  if (upd.success) return upd;
  return authorize(user, "consent.review", { serviceUnitId });
}

