"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { CloudOff, FileCheck2, Plus } from "lucide-react";
import { EmptyState } from "@/components/compositions";
import {
  FeedbackBanner,
  FloatingFeedbackToast,
  PageHeader,
  StatSummary,
} from "@/components/patterns";
import { Button, Icon } from "@/components/ui";
import { useTierCGuard } from "@/hooks/use-tier-c-guard";
import { useUrlQueryParams } from "@/hooks/use-url-query-params";
import { REPORT_STATUS_META, type ReportStatus } from "@/lib/status";
import {
  createGovernanceReportAction,
  generatePublicationFromReportAction,
  transitionGovernanceReportStatusAction,
} from "../actions/governance-actions";
import type {
  ReportAggregateMetricsDTO,
  ReportDTO,
} from "../types/governance-types";
import type {
  CreateReportFormValues,
  TransitionDecisionFormValues,
} from "../validators/governance-validator";
import { GovernanceFilterBar } from "./governance-filter-bar";
import { GovernanceReportCard } from "./governance-report-card";

const DialogLoadingSkeleton = () => (
  <div
    role="status"
    aria-label="Memuat dialog..."
    className="fixed inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-xs p-4"
  >
    <div className="h-64 w-full max-w-lg animate-pulse rounded-card bg-surface border border-border" />
  </div>
);

const GovernanceCreateDialog = dynamic(
  () =>
    import("./governance-create-dialog").then(
      (mod) => mod.GovernanceCreateDialog
    ),
  { ssr: false, loading: DialogLoadingSkeleton }
);

const GovernanceTransitionDialog = dynamic(
  () =>
    import("./governance-transition-dialog").then(
      (mod) => mod.GovernanceTransitionDialog
    ),
  { ssr: false, loading: DialogLoadingSkeleton }
);

export interface GovernanceWorkspaceClientProps {
  reports: ReportDTO[];
  metrics: ReportAggregateMetricsDTO;
  initialSearch: string;
  initialStatus: string;
  initialType: string;
  currentUserId: string;
  canCreate: boolean;
  canReview: boolean;
  canApprove: boolean;
  canCreatePublication: boolean;
}

export function GovernanceWorkspaceClient({
  reports,
  metrics,
  initialSearch,
  initialStatus,
  initialType,
  currentUserId,
  canCreate,
  canReview,
  canApprove,
  canCreatePublication,
}: GovernanceWorkspaceClientProps) {
  const { updateQuery: updateUrl, pathname, router } = useUrlQueryParams();
  const [createOpen, setCreateOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  const [decisionDialog, setDecisionDialog] = React.useState<{
    report: ReportDTO;
    targetStatus: ReportStatus;
    actionTitle: string;
  } | null>(null);

  const [feedback, setFeedback] = React.useState<{
    tone: "success" | "danger" | "warning";
    message: string;
  } | null>(null);
  const { isOnline, withTierCGuard } = useTierCGuard(
    "Tata Kelola & Persetujuan Laporan",
    (message) => setFeedback({ tone: "warning", message })
  );
  const isOffline = !isOnline;

  const handleResetFilters = React.useCallback(() => {
    router.push(pathname);
  }, [pathname, router]);

  async function handleCreateReport(
    values: CreateReportFormValues
  ): Promise<boolean> {
    if (pending) return false;

    const succeeded = await withTierCGuard(async () => {
      setPending(true);
      setFeedback(null);
      try {
        const res = await createGovernanceReportAction({
          title: values.title,
          reportType: values.reportType,
          period: values.period,
          summary: values.summary,
          classification:
            values.reportType === "STAKEHOLDER" ? "STAKEHOLDER" : "INTERNAL",
        });
        if (!res.success) {
          setFeedback({ tone: "danger", message: res.error.message });
          return false;
        }
        setCreateOpen(false);
        setFeedback({
          tone: "success",
          message:
            "Draft laporan pelayanan berhasil disimpan dan dicatat dalam riwayat keputusan.",
        });
        router.refresh();
        return true;
      } finally {
        setPending(false);
      }
    });

    return Boolean(succeeded);
  }

  async function handleConfirmDecision(values: TransitionDecisionFormValues) {
    if (!decisionDialog || pending) return;
    const currentDecision = decisionDialog;

    await withTierCGuard(async () => {
      setPending(true);
      setFeedback(null);
      try {
        const res = await transitionGovernanceReportStatusAction({
          reportId: currentDecision.report.id,
          targetStatus: currentDecision.targetStatus,
          comment: values.comment?.trim() || null,
        });
        if (!res.success) {
          setFeedback({ tone: "danger", message: res.error.message });
          return;
        }
        setDecisionDialog(null);
        setFeedback({
          tone: "success",
          message: `Keputusan tata kelola berhasil disimpan. Status laporan kini: "${REPORT_STATUS_META[res.data.newStatus].label}".`,
        });
        router.refresh();
      } finally {
        setPending(false);
      }
    });
  }

  const handleOpenDecision = React.useCallback(
    (
      targetReport: ReportDTO,
      targetStatus: ReportStatus,
      actionTitle: string
    ) => {
      setDecisionDialog({
        report: targetReport,
        targetStatus,
        actionTitle,
      });
    },
    []
  );

  const handleGeneratePublication = React.useCallback(
    async (reportId: string) => {
      if (pending) return;
      setPending(true);
      setFeedback(null);
      try {
        const res = await generatePublicationFromReportAction(reportId);
        if (!res.success) {
          setFeedback({ tone: "danger", message: res.error.message });
          return;
        }
        setFeedback({
          tone: "success",
          message: `Draft ringkasan publikasi "${res.data.title}" berhasil dibuat di modul Publikasi.`,
        });
      } finally {
        setPending(false);
      }
    },
    [pending]
  );

  const awaitingValidationCount = reports.filter(
    (r) =>
      r.status === "PROGRAM_REVIEW" ||
      r.status === "UNIT_VALIDATION" ||
      r.status === "ORGANIZATION_APPROVAL"
  ).length;
  const approvedCount = reports.filter((r) => r.status === "APPROVED").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan"
        description="Tata kelola laporan pelayanan berjenjang: Draft → Tinjauan program → Validasi unit → Persetujuan organisasi → Disetujui. Setiap keputusan tercatat permanen dan tunduk pada prinsip pemisahan tugas."
        primaryAction={
          canCreate ? (
            <Button
              type="button"
              variant="primary"
              disabled={isOffline}
              onClick={() => setCreateOpen(true)}
              leftIcon={<Icon icon={Plus} size="sm" />}
            >
              Susun laporan baru
            </Button>
          ) : undefined
        }
      />

      {/* Tier C Offline Notice (Calm explanation when offline — Product Owner Rule #6) */}
      {isOffline && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-control border border-warning/40 bg-warning-soft px-4 py-3 text-xs text-foreground"
        >
          <Icon
            icon={CloudOff}
            size="sm"
            className="text-warning shrink-0 mt-0.5"
          />
          <div className="space-y-0.5">
            <p className="font-semibold">
              Mode baca tata kelola (Memerlukan koneksi internet untuk keputusan)
            </p>
            <p className="text-secondary-foreground">
              Modul Tata Kelola & Persetujuan Laporan bersifat online-only (Tier
              C). Tombol pengajuan dan persetujuan dinonaktifkan sementara
              hingga koneksi kembali agar setiap keputusan langsung tercatat
              dalam jejak audit server.
            </p>
          </div>
        </div>
      )}

      <StatSummary
        items={[
          {
            id: "total-reports",
            label: "Total dokumen laporan",
            value: `${reports.length} laporan`,
          },
          {
            id: "awaiting",
            label: "Menunggu validasi & persetujuan",
            value: `${awaitingValidationCount} laporan`,
          },
          {
            id: "approved",
            label: "Disetujui resmi",
            value: `${approvedCount} laporan`,
          },
          {
            id: "agg-context",
            label: "Data operasional unit",
            value: `${metrics.activeStudentsCount} peserta · ${metrics.recordedAttendanceSessionsCount} sesi`,
          },
        ]}
      />

      {feedback && feedback.tone !== "success" && (
        <FeedbackBanner
          tone={feedback.tone}
          message={feedback.message}
          onDismiss={() => setFeedback(null)}
        />
      )}

      {feedback && feedback.tone === "success" && (
        <FloatingFeedbackToast
          tone="success"
          message={feedback.message}
          onDismiss={() => setFeedback(null)}
        />
      )}

      <GovernanceFilterBar
        initialSearch={initialSearch}
        initialStatus={initialStatus}
        initialType={initialType}
        onUpdateQuery={updateUrl}
        onResetAll={handleResetFilters}
      />

      {reports.length === 0 ? (
        <EmptyState
          icon={FileCheck2}
          title="Belum ada dokumen laporan."
          description="Susun laporan berkala kegiatan belajar, kehadiran, atau perkembangan peserta untuk diajukan ke alur peninjauan dan persetujuan."
          action={
            canCreate ? (
              <Button
                type="button"
                variant="primary"
                disabled={isOffline}
                onClick={() => setCreateOpen(true)}
              >
                Susun laporan baru
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-5">
          {reports.map((report) => (
            <GovernanceReportCard
              key={report.id}
              report={report}
              currentUserId={currentUserId}
              canCreate={canCreate}
              canReview={canReview}
              canApprove={canApprove}
              canCreatePublication={canCreatePublication}
              isOffline={isOffline}
              pending={pending}
              onOpenDecision={handleOpenDecision}
              onGeneratePublication={handleGeneratePublication}
            />
          ))}
        </div>
      )}

      {createOpen && (
        <GovernanceCreateDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          metrics={metrics}
          onSubmit={handleCreateReport}
          pending={pending}
        />
      )}

      {Boolean(decisionDialog) && (
        <GovernanceTransitionDialog
          open={Boolean(decisionDialog)}
          onOpenChange={(open) => {
            if (!open) setDecisionDialog(null);
          }}
          reportTitle={decisionDialog?.report.title}
          reportPeriod={decisionDialog?.report.period}
          targetStatus={decisionDialog?.targetStatus}
          actionTitle={decisionDialog?.actionTitle}
          onConfirm={handleConfirmDecision}
          pending={pending}
        />
      )}
    </div>
  );
}

