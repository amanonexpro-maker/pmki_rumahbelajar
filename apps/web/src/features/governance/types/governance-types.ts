import type { ReportStatus } from "@/lib/status";
import type { DataClassification } from "@/server/permissions";

export type ReportTypeCode =
  | "ACTIVITY"
  | "ATTENDANCE"
  | "STUDENT_DEVELOPMENT"
  | "STAKEHOLDER";

export const REPORT_TYPE_LABELS: Record<ReportTypeCode, string> = {
  ACTIVITY: "Kegiatan belajar",
  ATTENDANCE: "Rekap kehadiran",
  STUDENT_DEVELOPMENT: "Perkembangan peserta",
  STAKEHOLDER: "Pemangku kepentingan",
};

export interface ReportWorkflowLogDTO {
  id: string;
  reportId: string;
  action: string;
  fromStatus: ReportStatus | null;
  toStatus: ReportStatus;
  comment: string | null;
  actorId: string;
  actorName: string;
  createdAt: string;
}

export interface ReportAggregateMetricsDTO {
  activeStudentsCount: number;
  recordedAttendanceSessionsCount: number;
  developmentNotesCount: number;
}

export interface ReportDTO {
  id: string;
  organizationId: string;
  serviceUnitId: string;
  title: string;
  reportType: ReportTypeCode;
  reportTypeLabel: string;
  period: string;
  summary: string;
  status: ReportStatus;
  classification: DataClassification;
  createdBy: string | null;
  creatorName: string;
  createdAt: string;
  updatedAt: string;
  workflowLogs: ReportWorkflowLogDTO[];
}

