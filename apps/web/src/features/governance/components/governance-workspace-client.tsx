"use client";

import * as React from "react";
import {
  CheckCircle2,
  CloudOff,
  FileCheck2,
  Newspaper,
  Plus,
  Send,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { EmptyState, StatusBadge } from "@/components/compositions";
import {
  DecisionHistory,
  PageHeader,
  SearchToolbar,
  StatSummary,
  WorkflowProgress,
  type DecisionHistoryEntry,
  type WorkflowStageItem,
} from "@/components/patterns";
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Icon,
  Input,
  Textarea,
} from "@/components/ui";
import { useTierCGuard } from "@/hooks/use-tier-c-guard";
import { useUrlQueryParams } from "@/hooks/use-url-query-params";
import { PRIVACY_MESSAGES } from "@/lib/messages";
import { REPORT_STATUS_META, type ReportStatus } from "@/lib/status";
import {
  createGovernanceReportAction,
  generatePublicationFromReportAction,
  transitionGovernanceReportStatusAction,
} from "../actions/governance-actions";
import {
  REPORT_TYPE_LABELS,
  type ReportAggregateMetricsDTO,
  type ReportDTO,
  type ReportTypeCode,
  type ReportWorkflowLogDTO,
} from "../types/governance-types";
import { REPORT_TYPE_VALUES } from "../validators/governance-validator";

function buildReportStages(status: ReportStatus): WorkflowStageItem[] {
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

function mapWorkflowLogsToDecisionHistory(
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
  const [searchInput, setSearchInput] = React.useState(initialSearch);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [reportType, setReportType] =
    React.useState<ReportTypeCode>("ACTIVITY");
  const [period, setPeriod] = React.useState("Triwulan IV 2026");
  const [summary, setSummary] = React.useState("");
  const [pending, setPending] = React.useState(false);

  const [decisionDialog, setDecisionDialog] = React.useState<{
    report: ReportDTO;
    targetStatus: ReportStatus;
    actionTitle: string;
  } | null>(null);
  const [decisionComment, setDecisionComment] = React.useState("");

  const [feedback, setFeedback] = React.useState<{
    tone: "success" | "danger" | "warning";
    message: string;
  } | null>(null);
  const { isOnline, withTierCGuard } = useTierCGuard(
    "Tata Kelola & Persetujuan Laporan",
    (message) => setFeedback({ tone: "warning", message })
  );
  const isOffline = !isOnline;

  React.useEffect(() => {
    if (searchInput === initialSearch) return;
    const t = window.setTimeout(() => {
      updateUrl({ search: searchInput.trim() || null });
    }, 300);
    return () => window.clearTimeout(t);
  }, [initialSearch, searchInput, updateUrl]);

  async function handleCreateReport(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;

    await withTierCGuard(async () => {
      setPending(true);
      setFeedback(null);
      try {
        const res = await createGovernanceReportAction({
          title,
          reportType,
          period,
          summary,
          classification:
            reportType === "STAKEHOLDER" ? "STAKEHOLDER" : "INTERNAL",
        });
        if (!res.success) {
          setFeedback({ tone: "danger", message: res.error.message });
          return;
        }
        setCreateOpen(false);
        setTitle("");
        setSummary("");
        setFeedback({
          tone: "success",
          message:
            "Draft laporan pelayanan berhasil disimpan dan dicatat dalam riwayat keputusan.",
        });
        router.refresh();
      } finally {
        setPending(false);
      }
    });
  }

  async function handleConfirmDecision(e: React.FormEvent) {
    e.preventDefault();
    if (!decisionDialog || pending) return;
    const currentDecision = decisionDialog;

    await withTierCGuard(async () => {
      setPending(true);
      setFeedback(null);
      try {
        const res = await transitionGovernanceReportStatusAction({
          reportId: currentDecision.report.id,
          targetStatus: currentDecision.targetStatus,
          comment: decisionComment.trim() || null,
        });
        if (!res.success) {
          setFeedback({ tone: "danger", message: res.error.message });
          return;
        }
        setDecisionDialog(null);
        setDecisionComment("");
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

  async function handleGeneratePublication(reportId: string) {
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
  }

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

      {feedback && (
        <div
          role={feedback.tone === "danger" ? "alert" : "status"}
          className={
            feedback.tone === "success"
              ? "rounded-control border border-success/30 bg-success-soft px-4 py-3 text-sm text-success"
              : feedback.tone === "warning"
                ? "rounded-control border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning-foreground"
                : "rounded-control border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger"
          }
        >
          {feedback.message}
        </div>
      )}

      <SearchToolbar
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Cari judul atau periode laporan..."
        filterCount={
          (initialStatus !== "ALL" ? 1 : 0) + (initialType !== "ALL" ? 1 : 0)
        }
        onResetAll={() => {
          setSearchInput("");
          router.push(pathname);
        }}
        desktopFilters={
          <>
            <select
              aria-label="Filter status laporan"
              value={initialStatus}
              onChange={(e) => updateUrl({ status: e.target.value })}
              className="h-10 rounded-control border border-border bg-surface px-3 text-xs font-medium text-foreground focus-ring"
            >
              <option value="ALL">Semua status laporan</option>
              <option value="DRAFT">{REPORT_STATUS_META.DRAFT.label}</option>
              <option value="PROGRAM_REVIEW">
                {REPORT_STATUS_META.PROGRAM_REVIEW.label}
              </option>
              <option value="UNIT_VALIDATION">
                {REPORT_STATUS_META.UNIT_VALIDATION.label}
              </option>
              <option value="ORGANIZATION_APPROVAL">
                {REPORT_STATUS_META.ORGANIZATION_APPROVAL.label}
              </option>
              <option value="APPROVED">
                {REPORT_STATUS_META.APPROVED.label}
              </option>
              <option value="REJECTED">
                {REPORT_STATUS_META.REJECTED.label}
              </option>
            </select>

            <select
              aria-label="Filter jenis laporan"
              value={initialType}
              onChange={(e) => updateUrl({ type: e.target.value })}
              className="h-10 rounded-control border border-border bg-surface px-3 text-xs font-medium text-foreground focus-ring"
            >
              <option value="ALL">Semua jenis laporan</option>
              {REPORT_TYPE_VALUES.map((typeCode) => (
                <option key={typeCode} value={typeCode}>
                  {REPORT_TYPE_LABELS[typeCode]}
                </option>
              ))}
            </select>
          </>
        }
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
          {reports.map((report) => {
            const isCreator = report.createdBy === currentUserId;
            return (
              <article
                key={report.id}
                className="rounded-card border border-border bg-surface p-4 sm:p-6 space-y-4"
              >
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
                        onClick={() => {
                          setDecisionDialog({
                            report,
                            targetStatus: "PROGRAM_REVIEW",
                            actionTitle: "Ajukan ke tinjauan program",
                          });
                          setDecisionComment("");
                        }}
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
                        onClick={() => {
                          setDecisionDialog({
                            report,
                            targetStatus: "DRAFT",
                            actionTitle: "Kembalikan ke draft revisi",
                          });
                          setDecisionComment("");
                        }}
                      >
                        Revisi kembali ke draft
                      </Button>
                    )}

                    {report.status === "PROGRAM_REVIEW" &&
                      (canReview || canApprove) && (
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
                                onClick={() => {
                                  setDecisionDialog({
                                    report,
                                    targetStatus: "UNIT_VALIDATION",
                                    actionTitle:
                                      "Teruskan ke tahap validasi unit",
                                  });
                                  setDecisionComment("");
                                }}
                                leftIcon={<Icon icon={ShieldCheck} size="xs" />}
                              >
                                Teruskan ke validasi unit
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={isOffline || pending}
                                onClick={() => {
                                  setDecisionDialog({
                                    report,
                                    targetStatus: "REJECTED",
                                    actionTitle: "Tolak & kembalikan laporan",
                                  });
                                  setDecisionComment("");
                                }}
                                leftIcon={<Icon icon={XCircle} size="xs" />}
                              >
                                Tolak laporan
                              </Button>
                            </>
                          )}
                        </>
                      )}

                    {report.status === "UNIT_VALIDATION" &&
                      (canReview || canApprove) && (
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
                                onClick={() => {
                                  setDecisionDialog({
                                    report,
                                    targetStatus: "ORGANIZATION_APPROVAL",
                                    actionTitle:
                                      "Validasi unit & ajukan persetujuan organisasi",
                                  });
                                  setDecisionComment("");
                                }}
                                leftIcon={<Icon icon={ShieldCheck} size="xs" />}
                              >
                                Validasi unit
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={isOffline || pending}
                                onClick={() => {
                                  setDecisionDialog({
                                    report,
                                    targetStatus: "REJECTED",
                                    actionTitle: "Tolak & kembalikan laporan",
                                  });
                                  setDecisionComment("");
                                }}
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
                              onClick={() => {
                                setDecisionDialog({
                                  report,
                                  targetStatus: "APPROVED",
                                  actionTitle:
                                    "Berikan persetujuan akhir laporan",
                                });
                                setDecisionComment("");
                              }}
                              leftIcon={<Icon icon={CheckCircle2} size="xs" />}
                            >
                              Setujui laporan
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={isOffline || pending}
                              onClick={() => {
                                setDecisionDialog({
                                  report,
                                  targetStatus: "REJECTED",
                                  actionTitle: "Tolak & kembalikan laporan",
                                });
                                setDecisionComment("");
                              }}
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
                        onClick={() =>
                          void handleGeneratePublication(report.id)
                        }
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
                    Riwayat keputusan tata kelola (Permanen & tidak dapat
                    diubah)
                  </h3>
                  <DecisionHistory
                    entries={mapWorkflowLogsToDecisionHistory(
                      report.workflowLogs
                    )}
                  />
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Dialog: Susun laporan baru */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Susun laporan baru</DialogTitle>
            <DialogDescription>
              Susun draft laporan pelayanan untuk ditinjau secara berjenjang.{" "}
              {PRIVACY_MESSAGES.auditLogged}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateReport}>
            <DialogBody className="space-y-4">
              <div className="space-y-1">
                <label
                  htmlFor="report-title"
                  className="block text-xs font-medium text-foreground"
                >
                  Judul laporan *
                </label>
                <Input
                  id="report-title"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Laporan Capaian Bimbingan Belajar & Literasi Triwulan IV"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label
                    htmlFor="report-type"
                    className="block text-xs font-medium text-foreground"
                  >
                    Jenis laporan *
                  </label>
                  <select
                    id="report-type"
                    value={reportType}
                    onChange={(e) =>
                      setReportType(e.target.value as ReportTypeCode)
                    }
                    className="flex h-11 w-full rounded-control border border-border bg-surface px-3 text-sm text-foreground focus-ring"
                  >
                    {REPORT_TYPE_VALUES.map((code) => (
                      <option key={code} value={code}>
                        {REPORT_TYPE_LABELS[code]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="report-period"
                    className="block text-xs font-medium text-foreground"
                  >
                    Periode laporan *
                  </label>
                  <Input
                    id="report-period"
                    required
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    placeholder="Contoh: Triwulan IV 2026"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="report-summary"
                    className="block text-xs font-medium text-foreground"
                  >
                    Ringkasan capaian & evaluasi *
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setSummary(
                        (prev) =>
                          `${prev ? prev + " " : ""}Ringkasan operasional: ${metrics.activeStudentsCount} peserta didik aktif mengikuti ${metrics.recordedAttendanceSessionsCount} sesi belajar dengan ${metrics.developmentNotesCount} catatan perkembangan tercatat.`
                      )
                    }
                    className="text-xs text-primary hover:underline focus-ring rounded-xs px-1"
                  >
                    Sisipkan metrik agregat unit
                  </button>
                </div>
                <Textarea
                  id="report-summary"
                  rows={4}
                  required
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Tuliskan ringkasan kegiatan, capaian kehadiran, serta rekomendasi tindak lanjut tanpa mencantumkan data rahasia anak..."
                />
              </div>
            </DialogBody>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCreateOpen(false)}
                disabled={pending}
              >
                Batal
              </Button>
              <Button type="submit" variant="primary" disabled={pending}>
                {pending ? "Menyimpan..." : "Simpan draft laporan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Konfirmasi Keputusan Tata Kelola */}
      <Dialog
        open={Boolean(decisionDialog)}
        onOpenChange={(open) => {
          if (!open) setDecisionDialog(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{decisionDialog?.actionTitle}</DialogTitle>
            <DialogDescription>
              Dokumen:{" "}
              <strong className="text-foreground">
                {decisionDialog?.report.title}
              </strong>{" "}
              ({decisionDialog?.report.period}). {PRIVACY_MESSAGES.auditLogged}{" "}
              {PRIVACY_MESSAGES.sodApprovalRestricted}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleConfirmDecision}>
            <DialogBody className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="decision-comment"
                  className="block text-sm font-medium text-foreground"
                >
                  Catatan atau alasan keputusan{" "}
                  {decisionDialog?.targetStatus === "REJECTED" && "*"}
                </label>
                <Textarea
                  id="decision-comment"
                  rows={3}
                  required={decisionDialog?.targetStatus === "REJECTED"}
                  value={decisionComment}
                  onChange={(e) => setDecisionComment(e.target.value)}
                  placeholder={
                    decisionDialog?.targetStatus === "REJECTED"
                      ? "Tuliskan alasan penolakan atau bagian yang perlu diperbaiki (minimal 5 karakter)..."
                      : "Tambahkan catatan validasi atau pengesahan (opsional)..."
                  }
                />
              </div>
            </DialogBody>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setDecisionDialog(null)}
                disabled={pending}
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant={
                  decisionDialog?.targetStatus === "REJECTED"
                    ? "destructive"
                    : "primary"
                }
                disabled={pending}
              >
                {pending ? "Menyimpan..." : "Simpan keputusan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

