import { PRIVACY_MESSAGES } from "@/lib/messages";
import type { SessionUser } from "@/server/auth/session";
import { fail, type ActionResult } from "@/server/contracts/result";
import { authorize, can } from "@/server/permissions";

/**
 * Governance Domain Authorization & Separation of Duties Policies (05 §8, §15, §21, 10 §23).
 *
 * CRITICAL RULE (Product Owner Rule #2):
 * The user who created/authored the report (`createdBy`) MUST NOT approve or validate
 * that report at any review/validation/approval stage (`requireSeparationOfDuties: true`).
 * Wins even over PLATFORM_ADMIN.
 * Canonical error copy (`10 §23`): "Persetujuan akhir tidak dapat diberikan oleh penyusun laporan."
 */
export function canReadReports(
  user: SessionUser | null | undefined,
  serviceUnitId?: string
): boolean {
  return can(user, "report.read", { serviceUnitId });
}

export function authorizeReadReports(
  user: SessionUser | null | undefined,
  serviceUnitId?: string
) {
  return authorize(user, "report.read", { serviceUnitId });
}

export function canCreateReport(
  user: SessionUser | null | undefined,
  serviceUnitId?: string
): boolean {
  return can(user, "report.create", { serviceUnitId });
}

export function authorizeCreateReport(
  user: SessionUser | null | undefined,
  serviceUnitId: string
) {
  return authorize(user, "report.create", { serviceUnitId });
}

export function canReviewReportWithSoD(
  user: SessionUser | null | undefined,
  serviceUnitId: string,
  reportCreatorId: string | null
): boolean {
  return (
    can(user, "report.review", {
      serviceUnitId,
      requireSeparationOfDuties: true,
      resourceOwnerId: reportCreatorId,
    }) ||
    can(user, "report.approve", {
      serviceUnitId,
      requireSeparationOfDuties: true,
      resourceOwnerId: reportCreatorId,
    })
  );
}

export function authorizeReviewOrValidateReportWithSoD(
  user: SessionUser | null | undefined,
  serviceUnitId: string,
  reportCreatorId: string | null
): ActionResult<true> {
  if (user?.id && reportCreatorId && user.id === reportCreatorId) {
    return fail("POLICY_DENIED", PRIVACY_MESSAGES.sodApprovalRestricted);
  }

  const rev = authorize(user, "report.review", {
    serviceUnitId,
    requireSeparationOfDuties: true,
    resourceOwnerId: reportCreatorId,
  });
  if (rev.success) return rev;

  const app = authorize(user, "report.approve", {
    serviceUnitId,
    requireSeparationOfDuties: true,
    resourceOwnerId: reportCreatorId,
  });
  if (!app.success && app.error.code === "POLICY_DENIED") {
    return fail("POLICY_DENIED", PRIVACY_MESSAGES.sodApprovalRestricted);
  }
  return app;
}

export function canApproveReportWithSoD(
  user: SessionUser | null | undefined,
  serviceUnitId: string,
  reportCreatorId: string | null
): boolean {
  return can(user, "report.approve", {
    serviceUnitId,
    requireSeparationOfDuties: true,
    resourceOwnerId: reportCreatorId,
  });
}

export function authorizeApproveReportWithSoD(
  user: SessionUser | null | undefined,
  serviceUnitId: string,
  reportCreatorId: string | null
): ActionResult<true> {
  if (user?.id && reportCreatorId && user.id === reportCreatorId) {
    return fail("POLICY_DENIED", PRIVACY_MESSAGES.sodApprovalRestricted);
  }

  const res = authorize(user, "report.approve", {
    serviceUnitId,
    requireSeparationOfDuties: true,
    resourceOwnerId: reportCreatorId,
  });

  if (!res.success && res.error.code === "POLICY_DENIED") {
    return fail("POLICY_DENIED", PRIVACY_MESSAGES.sodApprovalRestricted);
  }
  return res;
}

