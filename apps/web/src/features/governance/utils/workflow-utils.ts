import type {
  DecisionHistoryEntry,
  WorkflowStageItem,
} from "@/components/patterns";
import { REPORT_STATUS_META, type ReportStatus } from "@/lib/status";
import type { ReportWorkflowLogDTO } from "../types/governance-types";

export function buildReportStages(status: ReportStatus): WorkflowStageItem[] {
  const steps: Array<{
    id: ReportStatus;
    label: string;
    actorHint: string;
  }> = [
    {
      id: "DRAFT",
      label: REPORT_STATUS_META.DRAFT.label,
      actorHint: "Penyusun laporan",
    },
    {
      id: "PROGRAM_REVIEW",
      label: REPORT_STATUS_META.PROGRAM_REVIEW.label,
      actorHint: "Peninjau / Koordinator",
    },
    {
      id: "UNIT_VALIDATION",
      label: REPORT_STATUS_META.UNIT_VALIDATION.label,
      actorHint: "Menunggu validasi unit",
    },
    {
      id: "ORGANIZATION_APPROVAL",
      label: REPORT_STATUS_META.ORGANIZATION_APPROVAL.label,
      actorHint: "Pejabat Penyetuju (SoD)",
    },
  ];

  if (status === "REJECTED") {
    return steps.map((s, idx) => ({
      ...s,
      state: idx === 0 ? "completed" : idx === 1 ? "rejected" : "upcoming",
    }));
  }

  if (status === "APPROVED") {
    return steps.map((s) => ({ ...s, state: "completed" }));
  }

  const currentIdx = steps.findIndex((s) => s.id === status);
  return steps.map((s, idx) => ({
    ...s,
    state:
      idx < currentIdx
        ? "completed"
        : idx === currentIdx
          ? "current"
          : "upcoming",
  }));
}

export function mapWorkflowLogsToDecisionHistory(
  logs: ReportWorkflowLogDTO[]
): DecisionHistoryEntry[] {
  return logs.map((log) => {
    const isRejected = log.toStatus === "REJECTED";
    const isApproved = log.toStatus === "APPROVED";

    return {
      id: log.id,
      stageLabel: REPORT_STATUS_META[log.toStatus]?.label ?? log.toStatus,
      decisionLabel: isRejected
        ? "Ditolak"
        : isApproved
          ? "Disetujui"
          : log.fromStatus
            ? `Dari ${REPORT_STATUS_META[log.fromStatus].label}`
            : "Disusun",
      decisionTone: isRejected
        ? "danger"
        : isApproved
          ? "success"
          : log.fromStatus
            ? "info"
            : "neutral",
      actorName: log.actorName,
      timestamp: new Date(log.createdAt).toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      comment: log.comment ?? undefined,
    };
  });
}

