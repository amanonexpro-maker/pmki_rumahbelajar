"use client";

import * as React from "react";
import { CheckCircle2, Newspaper, Send, ShieldCheck, XCircle } from "lucide-react";
import { StatusBadge } from "@/components/compositions";
import { DecisionHistory, WorkflowProgress } from "@/components/patterns";
import { Button, Icon } from "@/components/ui";
import { PRIVACY_MESSAGES } from "@/lib/messages";
import type { ReportStatus } from "@/lib/status";
import type { ReportDTO } from "../types/governance-types";
import {
  buildReportStages,
  mapWorkflowLogsToDecisionHistory,
} from "../utils/workflow-utils";

export interface GovernanceReportCardProps {
  report: ReportDTO;
  currentUserId: string;
  canCreate: boolean;
  canReview: boolean;
  canApprove: boolean;
  canCreatePublication: boolean;
  isOffline: boolean;
  pending: boolean;
  onOpenDecision: (
    report: ReportDTO,
    targetStatus: ReportStatus,
    actionTitle: string
  ) => void;
  onGeneratePublication: (reportId: string) => void;
}

export const GovernanceReportCard = React.memo(function GovernanceReportCard({
  report,
  currentUserId,
  canCreate,
  canReview,
  canApprove,
  canCreatePublication,
  isOffline,
  pending,
  onOpenDecision,
  onGeneratePublication,
}: GovernanceReportCardProps) {
  const isCreator = report.createdBy === currentUserId;

  return (
    <article className="rounded-card border border-border bg-surface p-4 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
        <div className="space-y-1.5 min-w-0">
          <h2 className="text-base font-semibold text-foreground leading-snug">
            {report.title}
          </h2>
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <StatusBadge domain="report" status={report.status} />
            <span className="text-xs text-secondary-foreground">
              {report.reportTypeLabel} · Periode: {report.period}
            </span>
          </div>
          <p className="text-xs text-muted-foreground pt-0.5">
            Disusun oleh{" "}
            <span className="font-medium text-foreground">
              {report.creatorName}
            </span>
          </p>
        </div>

        {/* Role-aware, State-aware & SoD-aware Action Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {report.status === "DRAFT" && canCreate && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={isOffline || pending}
              onClick={() =>
                onOpenDecision(
                  report,
                  "PROGRAM_REVIEW",
                  "Ajukan ke tinjauan program"
                )
              }
              leftIcon={<Icon icon={Send} size="xs" />}
            >
              Ajukan tinjauan program
            </Button>
          )}

          {report.status === "REJECTED" && canCreate && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isOffline || pending}
              onClick={() =>
                onOpenDecision(report, "DRAFT", "Kembalikan ke draft revisi")
              }
            >
              Revisi kembali ke draft
            </Button>
          )}

          {report.status === "PROGRAM_REVIEW" && (canReview || canApprove) && (
            <>
              {isCreator ? (
                <span className="text-xs text-muted-foreground italic">
                  {PRIVACY_MESSAGES.sodApprovalRestricted}
                </span>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={isOffline || pending}
                    onClick={() =>
                      onOpenDecision(
                        report,
                        "UNIT_VALIDATION",
                        "Teruskan ke tahap validasi unit"
                      )
                    }
                    leftIcon={<Icon icon={ShieldCheck} size="xs" />}
                  >
                    Teruskan ke validasi unit
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isOffline || pending}
                    onClick={() =>
                      onOpenDecision(
                        report,
                        "REJECTED",
                        "Tolak & kembalikan laporan"
                      )
                    }
                    leftIcon={<Icon icon={XCircle} size="xs" />}
                  >
                    Tolak laporan
                  </Button>
                </>
              )}
            </>
          )}

          {report.status === "UNIT_VALIDATION" && (canReview || canApprove) && (
            <>
              {isCreator ? (
                <span className="text-xs text-muted-foreground italic">
                  {PRIVACY_MESSAGES.sodApprovalRestricted}
                </span>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={isOffline || pending}
                    onClick={() =>
                      onOpenDecision(
                        report,
                        "ORGANIZATION_APPROVAL",
                        "Validasi unit & ajukan persetujuan organisasi"
                      )
                    }
                    leftIcon={<Icon icon={ShieldCheck} size="xs" />}
                  >
                    Validasi unit
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isOffline || pending}
                    onClick={() =>
                      onOpenDecision(
                        report,
                        "REJECTED",
                        "Tolak & kembalikan laporan"
                      )
                    }
                    leftIcon={<Icon icon={XCircle} size="xs" />}
                  >
                    Tolak laporan
                  </Button>
                </>
              )}
            </>
          )}

          {report.status === "ORGANIZATION_APPROVAL" && canApprove && (
            <>
              {isCreator ? (
                <span className="text-xs text-muted-foreground italic">
                  {PRIVACY_MESSAGES.sodApprovalRestricted}
                </span>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    disabled={isOffline || pending}
                    onClick={() =>
                      onOpenDecision(
                        report,
                        "APPROVED",
                        "Berikan persetujuan akhir laporan"
                      )
                    }
                    leftIcon={<Icon icon={CheckCircle2} size="xs" />}
                  >
                    Setujui laporan
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isOffline || pending}
                    onClick={() =>
                      onOpenDecision(
                        report,
                        "REJECTED",
                        "Tolak & kembalikan laporan"
                      )
                    }
                    leftIcon={<Icon icon={XCircle} size="xs" />}
                  >
                    Tolak laporan
                  </Button>
                </>
              )}
            </>
          )}

          {report.status === "APPROVED" && canCreatePublication && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isOffline || pending}
              onClick={() => onGeneratePublication(report.id)}
              leftIcon={<Icon icon={Newspaper} size="xs" />}
            >
              Buat draft publikasi ringkasan
            </Button>
          )}
        </div>
      </div>

      {/* Stored WorkflowProgress */}
      <WorkflowProgress stages={buildReportStages(report.status)} />

      {/* Report Summary */}
      <div className="rounded-control border border-border-subtle bg-surface-subtle/50 p-4 text-sm text-foreground leading-relaxed">
        {report.summary}
      </div>

      {/* Immutable Append-Only DecisionHistory */}
      <div className="space-y-2 pt-2 border-t border-border-subtle">
        <h3 className="text-xs font-semibold text-secondary-foreground">
          Riwayat keputusan tata kelola (Permanen & tidak dapat diubah)
        </h3>
        <DecisionHistory
          entries={mapWorkflowLogsToDecisionHistory(report.workflowLogs)}
        />
      </div>
    </article>
  );
});

