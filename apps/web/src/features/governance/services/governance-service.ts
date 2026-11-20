import { listAttendanceSessionHistory } from "@/features/attendance";
import { recordAuditLog, recordDomainAuditEvent } from "@/features/audit";
import { listDevelopmentNotesForWorkspace } from "@/features/development";
import { getUserNamesByIds } from "@/features/identity";
import { createPublicationDraft } from "@/features/publishing";
import { listStudentsForWorkspace } from "@/features/students";
import { getHumanErrorMessage } from "@/lib/messages";
import { REPORT_STATUS_META, type ReportStatus } from "@/lib/status";
import type { SessionUser } from "@/server/auth/session";
import { fail, ok, type ActionResult } from "@/server/contracts/result";
import {
  authorizeApproveReportWithSoD,
  authorizeCreateReport,
  authorizeReadReports,
  authorizeReviewOrValidateReportWithSoD,
} from "../permissions/governance-policy";
import {
  findReportById,
  findReportsByUnitIds,
  findWorkflowLogsByReportIds,
  insertReportWithInitialLog,
  updateReportStatusAndAppendWorkflowLog,
} from "../repositories/governance-repository";
import {
  REPORT_TYPE_LABELS,
  type ReportAggregateMetricsDTO,
  type ReportDTO,
  type ReportTypeCode,
  type ReportWorkflowLogDTO,
} from "../types/governance-types";
import {
  createReportSchema,
  transitionReportStatusSchema,
} from "../validators/governance-validator";

/**
 * Stored Governance Report Workflow State Machine (`04 §20–21`, `11 §16`, Product Owner Rule #1):
 * DRAFT -> PROGRAM_REVIEW -> UNIT_VALIDATION -> ORGANIZATION_APPROVAL -> APPROVED / REJECTED
 */
const ALLOWED_REPORT_TRANSITIONS: Record<
  ReportStatus,
  readonly ReportStatus[]
> = {
  DRAFT: ["PROGRAM_REVIEW"],
  PROGRAM_REVIEW: ["UNIT_VALIDATION", "REJECTED"],
  UNIT_VALIDATION: ["ORGANIZATION_APPROVAL", "REJECTED"],
  ORGANIZATION_APPROVAL: ["APPROVED", "REJECTED"],
  APPROVED: [],
  REJECTED: ["DRAFT"],
};

export function isValidReportWorkflowTransition(
  from: ReportStatus,
  to: ReportStatus
): boolean {
  return ALLOWED_REPORT_TRANSITIONS[from].includes(to);
}

/**
 * Cross-Domain Aggregate Summary via Services ONLY (`11 §20–21`, Product Owner Rule #4).
 * Never queries `students`, `attendance_sessions`, or `development_notes` directly.
 */
export async function getGovernanceOperationalMetrics(
  user: SessionUser | null | undefined
): Promise<ReportAggregateMetricsDTO> {
  const [studentsRes, attendanceRes, devRes] = await Promise.all([
    listStudentsForWorkspace(user, { status: "ACTIVE", pageSize: 50 }),
    listAttendanceSessionHistory(user),
    listDevelopmentNotesForWorkspace(user),
  ]);

  return {
    activeStudentsCount: studentsRes.success ? studentsRes.data.totalCount : 0,
    recordedAttendanceSessionsCount: attendanceRes.success
      ? attendanceRes.data.length
      : 0,
    developmentNotesCount: devRes.success ? devRes.data.length : 0,
  };
}

export async function createGovernanceReport(
  user: SessionUser | null | undefined,
  rawInput: unknown
): Promise<ActionResult<ReportDTO>> {
  const parsed = createReportSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail(
      "VALIDATION_FAILED",
      parsed.error.issues[0]?.message ??
        getHumanErrorMessage("VALIDATION_FAILED"),
      parsed.error.flatten().fieldErrors
    );
  }

  const membership = parsed.data.serviceUnitId
    ? user?.memberships.find(
        (m) => m.serviceUnitId === parsed.data.serviceUnitId
      )
    : user?.memberships[0];

  if (!membership || !user?.id) {
    return fail("SCOPE_DENIED", getHumanErrorMessage("SCOPE_DENIED"));
  }

  const authz = authorizeCreateReport(user, membership.serviceUnitId);
  if (!authz.success) return authz;

  const { report, log } = await insertReportWithInitialLog({
    organizationId: membership.organizationId,
    serviceUnitId: membership.serviceUnitId,
    title: parsed.data.title,
    reportType: parsed.data.reportType,
    period: parsed.data.period,
    summary: parsed.data.summary,
    classification: parsed.data.classification,
    actorId: user.id,
  });

  await recordAuditLog({
    organizationId: report.organizationId,
    serviceUnitId: report.serviceUnitId,
    actorId: user.id,
    action: "ReportDraftCreated",
    entityType: "report",
    entityId: report.id,
    description: `Menyusun draft laporan "${report.title}" (${report.period}).`,
    metadata: {
      reportType: report.reportType,
      period: report.period,
      classification: report.classification,
    },
  });

  const typeCode = report.reportType as ReportTypeCode;
  return ok({
    id: report.id,
    organizationId: report.organizationId,
    serviceUnitId: report.serviceUnitId,
    title: report.title,
    reportType: typeCode,
    reportTypeLabel: REPORT_TYPE_LABELS[typeCode] ?? typeCode,
    period: report.period,
    summary: report.summary,
    status: report.status as ReportStatus,
    classification: report.classification,
    createdBy: report.createdBy,
    creatorName: user.name,
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString(),
    workflowLogs: [
      {
        id: log.id,
        reportId: report.id,
        action: log.action,
        fromStatus: null,
        toStatus: log.toStatus as ReportStatus,
        comment: log.comment,
        actorId: log.actorId,
        actorName: user.name,
        createdAt: log.createdAt.toISOString(),
      },
    ],
  });
}

/**
 * Transitions report workflow state (`DRAFT -> PROGRAM_REVIEW -> UNIT_VALIDATION -> ORGANIZATION_APPROVAL -> APPROVED / REJECTED`).
 * Enforces:
 * - Stored state machine (`isValidReportWorkflowTransition`)
 * - Separation of Duties (`createdBy !== reviewer/validator/approver`, even for PLATFORM_ADMIN)
 * - Append-only `report_workflow_logs` entry + `audit_logs`
 * - Emits `ReportApproved` domain event when reaching `APPROVED`
 */
export async function transitionGovernanceReportStatus(
  user: SessionUser | null | undefined,
  rawInput: unknown
): Promise<
  ActionResult<{
    reportId: string;
    previousStatus: ReportStatus;
    newStatus: ReportStatus;
    workflowLogId: string;
  }>
> {
  const parsed = transitionReportStatusSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail(
      "VALIDATION_FAILED",
      parsed.error.issues[0]?.message ??
        getHumanErrorMessage("VALIDATION_FAILED"),
      parsed.error.flatten().fieldErrors
    );
  }

  const report = await findReportById(parsed.data.reportId);
  if (!report) {
    return fail("RESOURCE_NOT_FOUND", "Dokumen laporan tidak ditemukan.");
  }

  const currentStatus = report.status as ReportStatus;
  const targetStatus = parsed.data.targetStatus;

  if (!isValidReportWorkflowTransition(currentStatus, targetStatus)) {
    return fail(
      "RESOURCE_CONFLICT",
      `Perubahan status dari "${REPORT_STATUS_META[currentStatus].label}" ke "${REPORT_STATUS_META[targetStatus].label}" tidak sesuai urutan tata kelola laporan.`
    );
  }

  // Stage-specific RBAC & Separation of Duties checks
  if (targetStatus === "PROGRAM_REVIEW" || targetStatus === "DRAFT") {
    const authz = authorizeCreateReport(user, report.serviceUnitId);
    if (!authz.success) return authz;
  } else if (
    targetStatus === "UNIT_VALIDATION" ||
    targetStatus === "ORGANIZATION_APPROVAL" ||
    targetStatus === "REJECTED"
  ) {
    // SoD: Report creator CANNOT validate or review their own report (Product Owner Rule #2)
    const authz = authorizeReviewOrValidateReportWithSoD(
      user,
      report.serviceUnitId,
      report.createdBy
    );
    if (!authz.success) return authz;
  } else if (targetStatus === "APPROVED") {
    // Final Approval SoD (`05 §15, §21`, `10 §23`): Creator CANNOT approve their own report
    const authz = authorizeApproveReportWithSoD(
      user,
      report.serviceUnitId,
      report.createdBy
    );
    if (!authz.success) return authz;
  }

  if (!user?.id) {
    return fail("UNAUTHORIZED", getHumanErrorMessage("UNAUTHORIZED"));
  }

  const actionCode =
    targetStatus === "PROGRAM_REVIEW"
      ? "SUBMITTED_FOR_PROGRAM_REVIEW"
      : targetStatus === "UNIT_VALIDATION"
        ? "PROGRAM_REVIEW_VALIDATED"
        : targetStatus === "ORGANIZATION_APPROVAL"
          ? "UNIT_VALIDATED"
          : targetStatus === "APPROVED"
            ? "APPROVED"
            : targetStatus === "REJECTED"
              ? "REJECTED"
              : "REOPENED_TO_DRAFT";

  const { report: updated, log } = await updateReportStatusAndAppendWorkflowLog(
    {
      reportId: report.id,
      fromStatus: currentStatus,
      toStatus: targetStatus,
      action: actionCode,
      comment: parsed.data.comment ?? null,
      actorId: user.id,
    }
  );

  if (targetStatus === "APPROVED") {
    await recordDomainAuditEvent({
      name: "ReportApproved",
      organizationId: report.organizationId,
      serviceUnitId: report.serviceUnitId,
      actorId: user.id,
      entityType: "report",
      entityId: report.id,
      description: `Menyetujui pengesahan akhir laporan "${report.title}" (${report.period}).`,
      metadata: {
        previousStatus: currentStatus,
        newStatus: targetStatus,
        workflowLogId: log.id,
        comment: parsed.data.comment ?? null,
      },
    });
  } else {
    await recordAuditLog({
      organizationId: report.organizationId,
      serviceUnitId: report.serviceUnitId,
      actorId: user.id,
      action: "ReportWorkflowTransitioned",
      entityType: "report",
      entityId: report.id,
      description: `Mengubah status laporan "${report.title}" dari ${REPORT_STATUS_META[currentStatus].label} menjadi ${REPORT_STATUS_META[targetStatus].label}.`,
      metadata: {
        previousStatus: currentStatus,
        newStatus: targetStatus,
        workflowLogId: log.id,
        comment: parsed.data.comment ?? null,
      },
    });
  }

  return ok({
    reportId: updated.id,
    previousStatus: currentStatus,
    newStatus: updated.status as ReportStatus,
    workflowLogId: log.id,
  });
}

/**
 * Allowed Cross-Domain Integration (`11 §20`: Governance -> Publishing via PublishingService).
 * Generates an editorial publication draft from an `APPROVED` report summary.
 */
export async function generateStakeholderPublicationDraftFromReport(
  user: SessionUser | null | undefined,
  reportId: string
): Promise<ActionResult<{ publicationId: string; title: string }>> {
  const report = await findReportById(reportId);
  if (!report) {
    return fail("RESOURCE_NOT_FOUND", "Dokumen laporan tidak ditemukan.");
  }

  if (report.status !== "APPROVED") {
    return fail(
      "POLICY_DENIED",
      "Hanya laporan yang telah berstatus Disetujui yang dapat diteruskan menjadi ringkasan publikasi."
    );
  }

  const pubRes = await createPublicationDraft(user, {
    serviceUnitId: report.serviceUnitId,
    title: `Ringkasan Capaian: ${report.title} (${report.period})`,
    category: "BERITA",
    excerpt: report.summary.slice(0, 160),
    content: report.summary,
  });

  if (!pubRes.success) return pubRes;
  return ok({
    publicationId: pubRes.data.id,
    title: pubRes.data.title,
  });
}

export async function listGovernanceReportsForWorkspace(
  user: SessionUser | null | undefined,
  filters: { search?: string; status?: string; reportType?: string } = {}
): Promise<ActionResult<ReportDTO[]>> {
  const authz = authorizeReadReports(user);
  if (!authz.success) return authz;

  const serviceUnitIds = Array.from(
    new Set((user?.memberships ?? []).map((m) => m.serviceUnitId))
  );
  if (serviceUnitIds.length === 0) {
    return fail("SCOPE_DENIED", getHumanErrorMessage("SCOPE_DENIED"));
  }

  const rows = await findReportsByUnitIds({
    serviceUnitIds,
    status: filters.status,
    reportType: filters.reportType,
  });

  const searchLower = filters.search?.trim().toLowerCase() ?? "";
  const filteredRows = rows.filter((r) => {
    if (!searchLower) return true;
    return (
      r.title.toLowerCase().includes(searchLower) ||
      r.period.toLowerCase().includes(searchLower) ||
      r.summary.toLowerCase().includes(searchLower)
    );
  });

  const reportIds = filteredRows.map((r) => r.id);
  const rawLogs = await findWorkflowLogsByReportIds(reportIds);

  const userIdsToResolve = [
    ...filteredRows.map((r) => r.createdBy ?? ""),
    ...rawLogs.map((l) => l.actorId),
  ].filter(Boolean);
  const userNameMap = await getUserNamesByIds(userIdsToResolve);

  const logsByReportId = new Map<string, ReportWorkflowLogDTO[]>();
  for (const log of rawLogs) {
    const list = logsByReportId.get(log.reportId) ?? [];
    list.push({
      id: log.id,
      reportId: log.reportId,
      action: log.action,
      fromStatus: (log.fromStatus as ReportStatus | null) ?? null,
      toStatus: log.toStatus as ReportStatus,
      comment: log.comment,
      actorId: log.actorId,
      actorName: userNameMap.get(log.actorId) ?? "Pengurus PMKI",
      createdAt: log.createdAt.toISOString(),
    });
    logsByReportId.set(log.reportId, list);
  }

  const items: ReportDTO[] = filteredRows.map((row) => {
    const typeCode = row.reportType as ReportTypeCode;
    return {
      id: row.id,
      organizationId: row.organizationId,
      serviceUnitId: row.serviceUnitId,
      title: row.title,
      reportType: typeCode,
      reportTypeLabel: REPORT_TYPE_LABELS[typeCode] ?? typeCode,
      period: row.period,
      summary: row.summary,
      status: row.status as ReportStatus,
      classification: row.classification,
      createdBy: row.createdBy,
      creatorName:
        (row.createdBy ? userNameMap.get(row.createdBy) : null) ??
        "Penyusun Laporan",
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      workflowLogs: logsByReportId.get(row.id) ?? [],
    };
  });

  return ok(items);
}

