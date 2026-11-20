import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { reports, reportWorkflowLogs } from "@/db/schema";
import type { ReportStatus } from "@/lib/status";
import type { DataClassification } from "@/server/permissions";
import type { ReportTypeCode } from "../types/governance-types";

/**
 * Governance Domain Repository (11 §16, §24).
 * STRICT BOUNDARY: Only queries `reports` and `report_workflow_logs`.
 * Never queries `students`, `attendance_sessions`, `development_notes`, or `publications`.
 */
export async function findReportById(reportId: string) {
  const [row] = await db
    .select()
    .from(reports)
    .where(and(eq(reports.id, reportId), isNull(reports.archivedAt)))
    .limit(1);
  return row ?? null;
}

export async function findReportsByUnitIds(params: {
  serviceUnitIds: string[];
  status?: string;
  reportType?: string;
}) {
  if (params.serviceUnitIds.length === 0) return [];
  const conditions = [
    inArray(reports.serviceUnitId, params.serviceUnitIds),
    isNull(reports.archivedAt),
  ];

  if (params.status && params.status !== "ALL") {
    conditions.push(eq(reports.status, params.status as ReportStatus));
  }
  if (params.reportType && params.reportType !== "ALL") {
    conditions.push(
      eq(reports.reportType, params.reportType as ReportTypeCode)
    );
  }

  return db
    .select()
    .from(reports)
    .where(and(...conditions))
    .orderBy(desc(reports.updatedAt), desc(reports.createdAt));
}

export async function findWorkflowLogsByReportIds(reportIds: string[]) {
  if (reportIds.length === 0) return [];
  return db
    .select()
    .from(reportWorkflowLogs)
    .where(inArray(reportWorkflowLogs.reportId, reportIds))
    .orderBy(asc(reportWorkflowLogs.createdAt));
}

export async function insertReportWithInitialLog(params: {
  organizationId: string;
  serviceUnitId: string;
  title: string;
  reportType: ReportTypeCode;
  period: string;
  summary: string;
  classification: DataClassification;
  actorId: string;
}) {
  return db.transaction(async (tx) => {
    const [created] = await tx
      .insert(reports)
      .values({
        organizationId: params.organizationId,
        serviceUnitId: params.serviceUnitId,
        title: params.title,
        reportType: params.reportType,
        period: params.period,
        summary: params.summary,
        status: "DRAFT",
        classification: params.classification,
        createdBy: params.actorId,
        updatedBy: params.actorId,
      })
      .returning();

    const [initialLog] = await tx
      .insert(reportWorkflowLogs)
      .values({
        reportId: created.id,
        action: "REPORT_CREATED",
        fromStatus: null,
        toStatus: "DRAFT",
        comment: "Draft laporan pelayanan disusun.",
        actorId: params.actorId,
      })
      .returning();

    return { report: created, log: initialLog };
  });
}

export async function updateReportStatusAndAppendWorkflowLog(params: {
  reportId: string;
  fromStatus: ReportStatus;
  toStatus: ReportStatus;
  action: string;
  comment?: string | null;
  actorId: string;
}) {
  return db.transaction(async (tx) => {
    const [updated] = await tx
      .update(reports)
      .set({
        status: params.toStatus,
        updatedAt: new Date(),
        updatedBy: params.actorId,
      })
      .where(eq(reports.id, params.reportId))
      .returning();

    const [workflowLog] = await tx
      .insert(reportWorkflowLogs)
      .values({
        reportId: params.reportId,
        action: params.action,
        fromStatus: params.fromStatus,
        toStatus: params.toStatus,
        comment: params.comment ?? null,
        actorId: params.actorId,
      })
      .returning();

    return { report: updated, log: workflowLog };
  });
}

