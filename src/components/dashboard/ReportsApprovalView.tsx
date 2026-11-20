/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  FileCheck2,
  Plus,
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  Send,
  CheckCircle2,
  XCircle,
  Eye,
  Lock,
  Globe,
  FileText,
  UserCheck,
  AlertCircle,
  X,
} from 'lucide-react';
import { storage } from '../../services/storage.ts';
import { ApprovalStatus, ServiceReport } from '../../types/index.ts';
import { can } from '../../permissions/can.ts';
import {
  Badge,
  type BadgeVariant,
  Button,
  Dialog,
  Input,
  Select,
  Textarea,
} from '../ui/index.ts';
import {
  PageHeader,
  StatSummary,
  SearchToolbar,
  DataTable,
  type DataTableColumn,
  EmptyState,
  WorkflowProgress,
  type WorkflowStageItem,
  DecisionHistory,
  type DecisionHistoryEntry,
} from '../patterns/index.ts';

const REPORT_TYPE_LABEL: Record<ServiceReport['reportType'], string> = {
  ACTIVITY: 'Kegiatan Belajar',
  ATTENDANCE_RECAP: 'Rekap Kehadiran',
  STUDENT_DEVELOPMENT: 'Perkembangan Peserta',
  STAKEHOLDER: 'Pemangku Kepentingan & Sinodal',
};

const REPORT_STATUS_META: Record<
  ApprovalStatus,
  {
    label: string;
    badgeVariant: BadgeVariant;
    whyText: string;
    nextActor: string;
    nextTransitionText: string;
  }
> = {
  DRAFT: {
    label: 'Draft Laporan',
    badgeVariant: 'neutral',
    whyText: 'Laporan baru disusun dan belum diajukan ke tinjauan program.',
    nextActor: 'Penyusun Laporan / Pengajar / Koordinator Program',
    nextTransitionText:
      'Mengajukan draft akan memindahkan laporan ke tahap Tinjauan Program untuk dievaluasi kelengkapan datanya.',
  },
  PROGRAM_REVIEW: {
    label: 'Tinjauan Program',
    badgeVariant: 'warning',
    whyText:
      'Draft telah diajukan dan sedang menunggu pemeriksaan substansi program.',
    nextActor: 'Koordinator Program / Kepala Unit',
    nextTransitionText:
      'Memvalidasi substansi program akan meneruskan laporan ke tahap Validasi Unit & Persetujuan Akhir.',
  },
  UNIT_VALIDATION: {
    label: 'Validasi Unit',
    badgeVariant: 'info',
    whyText:
      'Substansi program telah tervalidasi dan siap untuk keputusan persetujuan akhir.',
    nextActor: 'Kepala Unit / Pengurus (bukan penyusun laporan)',
    nextTransitionText:
      'Persetujuan akhir akan mengesahkan laporan secara resmi dan menerbitkan ringkasan capaian publik.',
  },
  ORGANIZATION_APPROVAL: {
    label: 'Persetujuan Organisasi',
    badgeVariant: 'info',
    whyText:
      'Laporan telah melalui validasi unit dan berada pada tahap pengesahan organisasi.',
    nextActor: 'Pengurus Organisasi / Pimpinan',
    nextTransitionText:
      'Pengesahan akhir akan menandai laporan selesai disetujui dan siap untuk ringkasan publik.',
  },
  APPROVED: {
    label: 'Disetujui',
    badgeVariant: 'success',
    whyText:
      'Laporan telah melewati seluruh tahapan verifikasi dan disahkan secara resmi.',
    nextActor: 'Tidak ada tindakan tertunda (Alur selesai)',
    nextTransitionText:
      'Ringkasan agregat laporan telah siap ditampilkan pada halaman transparansi publik tanpa membuka data sensitif anak.',
  },
  REJECTED: {
    label: 'Perlu Perbaikan (Ditolak)',
    badgeVariant: 'danger',
    whyText:
      'Peninjau mengembalikan laporan dengan catatan evaluasi yang perlu ditindaklanjuti.',
    nextActor: 'Penyusun Laporan (membuat laporan revisi)',
    nextTransitionText:
      'Periksa catatan evaluasi pada riwayat keputusan untuk menyusun perbaikan laporan.',
  },
};

function buildReportWorkflowStages(status: ApprovalStatus): WorkflowStageItem[] {
  const order: Array<{ id: ApprovalStatus; label: string; actorHint: string }> =
    [
      {
        id: 'DRAFT',
        label: 'Penyusunan Draft',
        actorHint: 'Pengajar / Koordinator',
      },
      {
        id: 'PROGRAM_REVIEW',
        label: 'Tinjauan Program',
        actorHint: 'Koordinator Program',
      },
      {
        id: 'UNIT_VALIDATION',
        label: 'Validasi Unit',
        actorHint: 'Kepala Unit',
      },
      {
        id: 'APPROVED',
        label: 'Persetujuan Akhir',
        actorHint: 'Pejabat Penyetuju (Non-Kreator)',
      },
    ];

  if (status === 'REJECTED') {
    return order.map((item, idx) => ({
      id: item.id,
      label: item.label,
      actorHint: item.actorHint,
      state: idx === 0 ? 'completed' : idx === 1 ? 'rejected' : 'upcoming',
    }));
  }

  const normalizedStatus: ApprovalStatus =
    status === 'ORGANIZATION_APPROVAL' ? 'UNIT_VALIDATION' : status;

  const currentIdx = order.findIndex((o) => o.id === normalizedStatus);

  return order.map((item, idx) => {
    if (normalizedStatus === 'APPROVED') {
      return { ...item, state: 'completed' };
    }
    if (idx < currentIdx) {
      return { ...item, state: 'completed' };
    }
    if (idx === currentIdx) {
      return { ...item, state: 'current' };
    }
    return { ...item, state: 'upcoming' };
  });
}

function mapLogsToDecisionHistory(
  report: ServiceReport
): DecisionHistoryEntry[] {
  return report.workflowLogs.map((log, index) => {
    const isRejected = log.action === 'REJECTED';
    const isApproved = log.action === 'APPROVED';
    const isValidated = log.action === 'VALIDATED';
    const isReviewed = log.action === 'REVIEWED';

    const decisionLabel = isRejected
      ? 'Ditolak / Dikembalikan'
      : isApproved
        ? 'Disetujui Final'
        : isValidated
          ? 'Tervalidasi'
          : isReviewed
            ? 'Diajukan / Ditinjau'
            : 'Dibuat';

    const decisionTone: BadgeVariant = isRejected
      ? 'danger'
      : isApproved
        ? 'success'
        : isValidated || isReviewed
          ? 'info'
          : 'neutral';

    return {
      id: `${report.id}-log-${index}`,
      stageLabel: log.step,
      decisionLabel,
      decisionTone,
      actorName: log.actorName,
      timestamp: new Date(log.timestamp).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      comment: log.comment,
    };
  });
}

export const ReportsApprovalView: React.FC = () => {
  const [reports, setReports] = useState<ServiceReport[]>(() =>
    storage.getReports()
  );
  const currentUser = storage.getCurrentUser();

  // Workspace filter & search state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Detail selection
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  // Governance decision state
  const [approvalComment, setApprovalComment] = useState('');
  const [pendingDecision, setPendingDecision] = useState<
    'REVIEWED' | 'VALIDATED' | 'APPROVED' | 'REJECTED' | null
  >(null);
  const [decisionError, setDecisionError] = useState<string | null>(null);

  // Feedback banner
  const [feedbackMsg, setFeedbackMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // New report modal state
  const [newReportModalOpen, setNewReportModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [period, setPeriod] = useState('Triwulan IV 2026');
  const [summary, setSummary] = useState('');
  const [reportType, setReportType] =
    useState<ServiceReport['reportType']>('ACTIVITY');
  const [totalBeneficiaries, setTotalBeneficiaries] = useState('80');
  const [totalSessions, setTotalSessions] = useState('8');
  const [averageAttendancePct, setAverageAttendancePct] = useState('95');
  const [formError, setFormError] = useState<string | null>(null);

  const canWriteReport = can(currentUser, 'report.write');
  const canReviewReport = can(currentUser, 'report.review');
  const canApproveReportRole = can(currentUser, 'report.approve');

  const refreshReports = () => {
    setReports([...storage.getReports()]);
  };

  const selectedReport = useMemo(
    () => reports.find((r) => r.id === selectedReportId) ?? null,
    [reports, selectedReportId]
  );

  // Summary metrics
  const stats = useMemo(() => {
    const total = reports.length;
    const pendingReview = reports.filter(
      (r) =>
        r.status === 'DRAFT' ||
        r.status === 'PROGRAM_REVIEW' ||
        r.status === 'UNIT_VALIDATION' ||
        r.status === 'ORGANIZATION_APPROVAL'
    ).length;
    const approvedCount = reports.filter((r) => r.status === 'APPROVED').length;
    const publicReadyCount = reports.filter(
      (r) => r.isPublicSummaryGenerated
    ).length;

    return [
      {
        id: 'total-reports',
        label: 'Total Dokumen Laporan',
        value: total,
        meta: 'Seluruh periode pelayanan',
      },
      {
        id: 'pending-governance',
        label: 'Dalam Alur Tinjauan',
        value: pendingReview,
        meta: 'Menunggu pengajuan, validasi, atau pengesahan',
      },
      {
        id: 'approved-reports',
        label: 'Disetujui Resmi',
        value: approvedCount,
        meta: 'Telah melewati verifikasi berjenjang',
      },
      {
        id: 'public-summaries',
        label: 'Ringkasan Publik Aktif',
        value: publicReadyCount,
        meta: 'Aman ditampilkan ke publik',
      },
    ];
  }, [reports]);

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        report.title.toLowerCase().includes(q) ||
        report.period.toLowerCase().includes(q) ||
        report.createdByName.toLowerCase().includes(q) ||
        report.summary.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === 'ALL' || report.status === statusFilter;
      const matchesType =
        typeFilter === 'ALL' || report.reportType === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [reports, searchQuery, statusFilter, typeFilter]);

  const openDecisionDialog = (
    action: 'REVIEWED' | 'VALIDATED' | 'APPROVED' | 'REJECTED'
  ) => {
    setDecisionError(null);
    setPendingDecision(action);
  };

  const executeDecision = () => {
    if (!selectedReport || !pendingDecision) return;

    if (pendingDecision === 'REJECTED' && !approvalComment.trim()) {
      setDecisionError(
        'Mohon tuliskan alasan penolakan atau catatan evaluasi agar penyusun dapat memperbaiki laporan.'
      );
      return;
    }

    const result = storage.advanceReportApproval(
      selectedReport.id,
      pendingDecision,
      approvalComment.trim()
    );

    if (result.success) {
      setFeedbackMsg({ type: 'success', text: result.message });
      refreshReports();
      setApprovalComment('');
      setPendingDecision(null);
      setDecisionError(null);
    } else {
      setDecisionError(result.message);
      setFeedbackMsg({ type: 'error', text: result.message });
    }
  };

  const handleCreateReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !period.trim() || !summary.trim()) {
      setFormError(
        'Judul laporan, periode, dan ringkasan capaian wajib diisi.'
      );
      return;
    }

    const beneficiariesNum = Math.max(1, Number(totalBeneficiaries) || 80);
    const sessionsNum = Math.max(1, Number(totalSessions) || 8);
    const attendanceNum = Math.min(
      100,
      Math.max(0, Number(averageAttendancePct) || 95)
    );

    const rep = storage.createReport({
      title: title.trim(),
      period: period.trim(),
      reportType,
      summary: summary.trim(),
      totalBeneficiaries: beneficiariesNum,
      totalSessions: sessionsNum,
      averageAttendancePct: attendanceNum,
    });

    refreshReports();
    setNewReportModalOpen(false);
    setTitle('');
    setSummary('');
    setFormError(null);
    setSelectedReportId(rep.id);
    setFeedbackMsg({
      type: 'success',
      text: `Draft laporan "${rep.title}" berhasil disusun oleh ${currentUser.name}.`,
    });
  };

  const columns: DataTableColumn<ServiceReport>[] = [
    {
      id: 'report',
      header: 'Dokumen Laporan & Periode',
      cell: (report) => (
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-foreground">
              {report.title}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-secondary-foreground">
            <span>{REPORT_TYPE_LABEL[report.reportType]}</span>
            <span>•</span>
            <span>Periode: {report.period}</span>
            <span>•</span>
            <span>Penyusun: {report.createdByName}</span>
          </div>
        </div>
      ),
    },
    {
      id: 'metrics',
      header: 'Ringkasan Capaian',
      cell: (report) => (
        <div className="text-xs text-secondary-foreground space-y-0.5">
          <div>
            <span className="font-medium text-foreground">
              {report.totalBeneficiaries}
            </span>{' '}
            peserta •{' '}
            <span className="font-medium text-foreground">
              {report.totalSessions}
            </span>{' '}
            pertemuan
          </div>
          <div className="text-[11px]">
            Rata-rata kehadiran:{' '}
            <span className="font-semibold text-success">
              {report.averageAttendancePct}%
            </span>
          </div>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status & Tahap Saat Ini',
      cell: (report) => {
        const meta = REPORT_STATUS_META[report.status];
        return (
          <div className="space-y-1">
            <Badge variant={meta.badgeVariant} dot>
              {meta.label}
            </Badge>
            <p className="text-[11px] text-muted-foreground">
              Tindak lanjut: {meta.nextActor}
            </p>
          </div>
        );
      },
    },
    {
      id: 'visibility',
      header: 'Klasifikasi & Publikasi',
      cell: (report) => (
        <div className="space-y-1">
          {report.isPublicSummaryGenerated ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
              <Globe className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>Ringkasan Publik Siap</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-secondary-foreground">
              <Lock
                className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <span>Dokumen Internal ({report.classification})</span>
            </span>
          )}
          <p className="text-[11px] text-muted-foreground">
            {report.workflowLogs.length} catatan keputusan
          </p>
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Tindakan',
      align: 'right',
      cell: (report) => (
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Eye className="h-3.5 w-3.5" />}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedReportId(report.id);
            setFeedbackMsg(null);
          }}
        >
          Periksa & Tinjau
        </Button>
      ),
    },
  ];

  // If a report is selected, show the comprehensive Governance Detail & Review workspace
  if (selectedReport) {
    const statusMeta = REPORT_STATUS_META[selectedReport.status];
    const stages = buildReportWorkflowStages(selectedReport.status);
    const historyEntries = mapLogsToDecisionHistory(selectedReport);

    const isCreator = selectedReport.createdBy === currentUser.id;
    const isFinalApprovalStage =
      selectedReport.status === 'UNIT_VALIDATION' ||
      selectedReport.status === 'ORGANIZATION_APPROVAL';
    const isTerminalStage =
      selectedReport.status === 'APPROVED' ||
      selectedReport.status === 'REJECTED';

    // Determine if the current user can perform the next step
    const canSubmitDraft =
      selectedReport.status === 'DRAFT' && (canWriteReport || canReviewReport);
    const canValidateProgram =
      selectedReport.status === 'PROGRAM_REVIEW' &&
      (canReviewReport || canApproveReportRole);
    const canFinalApprove =
      isFinalApprovalStage &&
      can(currentUser, 'report.approve', {
        requireSeparationOfDuties: true,
        resourceOwnerId: selectedReport.createdBy,
      });

    const canReject =
      !isTerminalStage && (canReviewReport || canApproveReportRole);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => {
              setSelectedReportId(null);
              setApprovalComment('');
              setDecisionError(null);
            }}
          >
            Kembali ke Daftar Laporan
          </Button>

          <div className="flex items-center gap-2">
            <Badge variant={statusMeta.badgeVariant} dot>
              {statusMeta.label}
            </Badge>
          </div>
        </div>

        {feedbackMsg && (
          <div
            role="status"
            className={`flex items-start justify-between gap-3 rounded-md border px-4 py-3 text-xs ${
              feedbackMsg.type === 'success'
                ? 'border-success/35 bg-success-soft text-foreground'
                : 'border-danger/35 bg-danger-soft text-foreground'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {feedbackMsg.type === 'success' ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              ) : (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
              )}
              <div>
                <p className="font-semibold">
                  {feedbackMsg.type === 'success'
                    ? 'Status Tata Kelola Diperbarui'
                    : 'Tindakan Tidak Dapat Dilanjutkan'}
                </p>
                <p className="mt-0.5 text-secondary-foreground">
                  {feedbackMsg.text}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFeedbackMsg(null)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Tutup pesan"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Header & Workflow Pipeline */}
        <section className="rounded-card border border-border bg-surface p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between border-b border-border pb-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2 text-xs text-secondary-foreground">
                <span className="font-mono text-[11px] text-muted-foreground">
                  ID: {selectedReport.id}
                </span>
                <span>•</span>
                <span>{REPORT_TYPE_LABEL[selectedReport.reportType]}</span>
                <span>•</span>
                <span>Periode: {selectedReport.period}</span>
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                {selectedReport.title}
              </h2>
              <p className="text-xs text-secondary-foreground">
                Disusun oleh{' '}
                <strong className="text-foreground">
                  {selectedReport.createdByName}
                </strong>{' '}
                • Klasifikasi Dokumen:{' '}
                <strong className="text-foreground">
                  {selectedReport.classification}
                </strong>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {selectedReport.isPublicSummaryGenerated ? (
                <Badge variant="success" dot>
                  Ringkasan Publik Tersedia
                </Badge>
              ) : (
                <Badge variant="neutral">
                  Hanya Internal (Belum Dipublikasikan)
                </Badge>
              )}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-secondary-foreground">
              Tahapan Alur Persetujuan
            </p>
            <WorkflowProgress stages={stages} />
          </div>

          {/* 5 Core Governance Questions Summary Grid */}
          <div className="grid grid-cols-1 gap-3 rounded-md border border-border bg-surface-subtle/50 p-4 md:grid-cols-3">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                1. Mengapa dalam status ini?
              </span>
              <p className="text-xs leading-relaxed text-foreground">
                {statusMeta.whyText}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                2. Siapa yang menindaklanjuti?
              </span>
              <p className="text-xs font-semibold text-foreground">
                {statusMeta.nextActor}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                3. Dampak langkah berikutnya
              </span>
              <p className="text-xs leading-relaxed text-secondary-foreground">
                {statusMeta.nextTransitionText}
              </p>
            </div>
          </div>
        </section>

        {/* Main Content + Governance Action Panel */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left 2 Columns: Report Summary, Metrics & Decision History */}
          <div className="space-y-6 lg:col-span-2">
            <section className="rounded-card border border-border bg-surface p-5 sm:p-6 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Substansi & Capaian Pelayanan
                </h3>
                <p className="text-xs text-secondary-foreground mt-0.5">
                  Ringkasan eksekutif dan indikator utama yang dilaporkan untuk
                  periode {selectedReport.period}.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-md border border-border bg-surface-subtle/40 p-3">
                  <span className="text-[11px] text-secondary-foreground">
                    Penerima Manfaat Terlayani
                  </span>
                  <p className="mt-1 text-base font-semibold text-foreground">
                    {selectedReport.totalBeneficiaries} Peserta
                  </p>
                </div>
                <div className="rounded-md border border-border bg-surface-subtle/40 p-3">
                  <span className="text-[11px] text-secondary-foreground">
                    Total Pertemuan Kelas
                  </span>
                  <p className="mt-1 text-base font-semibold text-foreground">
                    {selectedReport.totalSessions} Sesi
                  </p>
                </div>
                <div className="rounded-md border border-border bg-surface-subtle/40 p-3">
                  <span className="text-[11px] text-secondary-foreground">
                    Rata-rata Kehadiran
                  </span>
                  <p className="mt-1 text-base font-semibold text-success">
                    {selectedReport.averageAttendancePct}%
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <h4 className="text-xs font-semibold text-foreground">
                  Ringkasan Eksekutif & Evaluasi Pembelajaran
                </h4>
                <div className="rounded-md border border-border bg-surface p-4 text-sm leading-relaxed text-foreground">
                  {selectedReport.summary}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-surface-subtle/40 px-3.5 py-2.5 text-xs text-secondary-foreground">
                <div className="flex items-center gap-2">
                  {selectedReport.isPublicSummaryGenerated ? (
                    <Globe
                      className="h-4 w-4 text-success"
                      aria-hidden="true"
                    />
                  ) : (
                    <Lock
                      className="h-4 w-4 text-muted-foreground"
                      aria-hidden="true"
                    />
                  )}
                  <span>
                    Status Ringkasan Publik:{' '}
                    <strong className="text-foreground">
                      {selectedReport.isPublicSummaryGenerated
                        ? 'Telah diterbitkan sebagai ringkasan agregat publik'
                        : 'Belum diterbitkan ke publik (menunggu Persetujuan Akhir)'}
                    </strong>
                  </span>
                </div>
              </div>
            </section>

            <section className="rounded-card border border-border bg-surface p-5 sm:p-6 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Riwayat Keputusan & Tinjauan
                </h3>
                <p className="text-xs text-secondary-foreground mt-0.5">
                  Rekam jejak akuntabilitas berjenjang pada laporan ini.
                </p>
              </div>
              <DecisionHistory entries={historyEntries} />
            </section>
          </div>

          {/* Right Column: Governance Decision & Separation of Duties Panel */}
          <div className="space-y-6">
            <section className="rounded-card border border-border bg-surface p-5 sm:p-6 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Panel Keputusan Tata Kelola
                </h3>
                <p className="text-xs text-secondary-foreground mt-0.5">
                  Peran aktif Anda:{' '}
                  <strong className="text-foreground">
                    {currentUser.name}
                  </strong>{' '}
                  ({currentUser.role})
                </p>
              </div>

              {/* Separation of Duties Explicit Notice when Creator Views Report */}
              {isCreator && (
                <div className="rounded-md border border-warning/40 bg-warning-soft/60 p-3.5 text-xs text-foreground">
                  <div className="flex items-start gap-2.5">
                    <ShieldAlert
                      className="mt-0.5 h-4 w-4 shrink-0 text-warning"
                      aria-hidden="true"
                    />
                    <div className="space-y-1">
                      <p className="font-semibold">
                        Pemisahan Tugas (Separation of Duties)
                      </p>
                      <p className="leading-relaxed text-secondary-foreground">
                        Anda tidak dapat memberikan persetujuan akhir untuk
                        laporan yang Anda buat sendiri. Pengesahan akhir harus
                        dilakukan oleh pejabat penyetuju lain yang berwenang.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {isTerminalStage ? (
                <div className="rounded-md border border-border bg-surface-subtle/60 p-4 text-xs text-secondary-foreground space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    {selectedReport.status === 'APPROVED' ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        <span>Alur Persetujuan Selesai</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-danger" />
                        <span>Laporan Dikembalikan untuk Perbaikan</span>
                      </>
                    )}
                  </div>
                  <p className="leading-relaxed">
                    {selectedReport.status === 'APPROVED'
                      ? 'Dokumen ini telah disetujui secara final dan menjadi rujukan resmi akuntabilitas pelayanan.'
                      : 'Dokumen ini telah ditolak/dikembalikan. Silakan tinjau catatan evaluasi pada riwayat keputusan.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Textarea
                    label="Catatan Evaluasi / Pertimbangan Keputusan"
                    placeholder="Tuliskan catatan pemeriksaan, temuan verifikasi, atau alasan penolakan..."
                    rows={3}
                    value={approvalComment}
                    onChange={(e) => setApprovalComment(e.target.value)}
                    hint="Catatan ini akan disimpan secara permanen pada riwayat keputusan dan log audit."
                  />

                  <div className="space-y-2 pt-1">
                    {selectedReport.status === 'DRAFT' && (
                      <Button
                        variant="primary"
                        fullWidth
                        disabled={!canSubmitDraft}
                        leftIcon={<Send className="h-4 w-4" />}
                        onClick={() => openDecisionDialog('REVIEWED')}
                      >
                        Ajukan ke Tinjauan Program
                      </Button>
                    )}

                    {selectedReport.status === 'PROGRAM_REVIEW' && (
                      <Button
                        variant="primary"
                        fullWidth
                        disabled={!canValidateProgram}
                        leftIcon={<UserCheck className="h-4 w-4" />}
                        onClick={() => openDecisionDialog('VALIDATED')}
                      >
                        Validasi Substansi Program
                      </Button>
                    )}

                    {isFinalApprovalStage && (
                      <Button
                        variant="primary"
                        fullWidth
                        disabled={!canFinalApprove}
                        leftIcon={<ShieldCheck className="h-4 w-4" />}
                        onClick={() => openDecisionDialog('APPROVED')}
                      >
                        Beri Persetujuan Akhir
                      </Button>
                    )}

                    <Button
                      variant="destructive"
                      fullWidth
                      disabled={!canReject}
                      leftIcon={<XCircle className="h-4 w-4" />}
                      onClick={() => openDecisionDialog('REJECTED')}
                    >
                      Tolak / Kembalikan Laporan
                    </Button>
                  </div>

                  {!canSubmitDraft &&
                    !canValidateProgram &&
                    !canFinalApprove &&
                    !isCreator && (
                      <p className="text-[11px] text-muted-foreground">
                        Peran Anda saat ini ({currentUser.role}) memiliki akses
                        baca. Gunakan pemilih peran di bilah atas untuk menguji
                        alur persetujuan lintas jabatan.
                      </p>
                    )}
                </div>
              )}
            </section>
          </div>
        </div>

        {/* Consequential Decision Confirmation Dialog */}
        <Dialog
          open={pendingDecision !== null}
          onClose={() => {
            setPendingDecision(null);
            setDecisionError(null);
          }}
          title={
            pendingDecision === 'REJECTED'
              ? 'Tolak laporan ini?'
              : pendingDecision === 'APPROVED'
                ? 'Setujui laporan ini secara final?'
                : pendingDecision === 'VALIDATED'
                  ? 'Validasi laporan untuk tahap unit?'
                  : 'Ajukan laporan ke tinjauan program?'
          }
          description={
            pendingDecision === 'REJECTED'
              ? 'Laporan akan ditandai Perlu Perbaikan (Ditolak) dan alasan penolakan akan dicatat pada riwayat keputusan.'
              : pendingDecision === 'APPROVED'
                ? 'Persetujuan akhir akan mengesahkan laporan secara resmi dan mengaktifkan ringkasan capaian untuk halaman publik.'
                : pendingDecision === 'VALIDATED'
                  ? 'Laporan akan diteruskan ke tahap Validasi Unit untuk menunggu persetujuan akhir.'
                  : 'Draft laporan akan dikirimkan ke Koordinator Program untuk ditinjau.'
          }
          footer={
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setPendingDecision(null);
                  setDecisionError(null);
                }}
              >
                Batal
              </Button>
              <Button
                variant={
                  pendingDecision === 'REJECTED' ? 'destructive' : 'primary'
                }
                onClick={executeDecision}
              >
                {pendingDecision === 'REJECTED'
                  ? 'Ya, Tolak Laporan'
                  : pendingDecision === 'APPROVED'
                    ? 'Ya, Setujui Final'
                    : 'Ya, Lanjutkan Tahap'}
              </Button>
            </div>
          }
        >
          <div className="space-y-3 text-xs">
            {decisionError && (
              <div
                role="alert"
                className="rounded-md border border-danger/40 bg-danger-soft p-3 text-danger font-medium"
              >
                {decisionError}
              </div>
            )}

            <div className="rounded-md border border-border bg-surface-subtle/50 p-3 space-y-1">
              <p className="font-semibold text-foreground">
                {selectedReport.title}
              </p>
              <p className="text-secondary-foreground">
                Penyusun: {selectedReport.createdByName} • Periode:{' '}
                {selectedReport.period}
              </p>
            </div>

            <Textarea
              label={
                pendingDecision === 'REJECTED'
                  ? 'Alasan Penolakan / Catatan Perbaikan (Wajib)'
                  : 'Catatan Keputusan (Opsional)'
              }
              required={pendingDecision === 'REJECTED'}
              rows={3}
              value={approvalComment}
              onChange={(e) => setApprovalComment(e.target.value)}
              placeholder={
                pendingDecision === 'REJECTED'
                  ? 'Jelaskan bagian data atau substansi yang perlu diperbaiki oleh penyusun...'
                  : 'Tambahkan catatan verifikasi apabila diperlukan...'
              }
            />
          </div>
        </Dialog>
      </div>
    );
  }

  // Default Workspace List View
  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan Pelayanan & Alur Persetujuan"
        description="Kelola penyusunan laporan berkala, peninjauan substansi program, dan pengesahan akuntabilitas dengan pemisahan tugas (Separation of Duties)."
        primaryAction={
          canWriteReport ? (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => {
                setFormError(null);
                setNewReportModalOpen(true);
              }}
            >
              Susun Laporan Baru
            </Button>
          ) : undefined
        }
      />

      {feedbackMsg && (
        <div
          role="status"
          className={`flex items-start justify-between gap-3 rounded-md border px-4 py-3 text-xs ${
            feedbackMsg.type === 'success'
              ? 'border-success/35 bg-success-soft text-foreground'
              : 'border-danger/35 bg-danger-soft text-foreground'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
            )}
            <div>
              <p className="font-semibold">
                {feedbackMsg.type === 'success'
                  ? 'Pembaruan Laporan Berhasil'
                  : 'Tindakan Tidak Dapat Dilanjutkan'}
              </p>
              <p className="mt-0.5 text-secondary-foreground">
                {feedbackMsg.text}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Tutup pesan"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <StatSummary items={stats} />

      {/* Calm Governance Guidance Banner */}
      <div className="flex items-start gap-3 rounded-md border border-border bg-surface-subtle/60 px-4 py-3 text-xs text-secondary-foreground">
        <ShieldCheck
          className="mt-0.5 h-4 w-4 shrink-0 text-primary"
          aria-hidden="true"
        />
        <div className="space-y-0.5">
          <span className="font-semibold text-foreground">
            Tata Kelola & Pemisahan Tugas (Separation of Duties):
          </span>{' '}
          Setiap laporan melewati tahapan{' '}
          <strong>
            Draft → Tinjauan Program → Validasi Unit → Persetujuan Akhir
          </strong>
          . Penyusun laporan tidak dapat memberikan persetujuan akhir untuk
          laporannya sendiri.
        </div>
      </div>

      <section className="rounded-card border border-border bg-surface p-4 sm:p-5 shadow-xs space-y-4">
        <SearchToolbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Cari judul laporan, periode, atau nama penyusun..."
          filters={[
            {
              id: 'status',
              label: 'Status Persetujuan',
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: 'ALL', label: 'Semua Status' },
                { value: 'DRAFT', label: 'Draft Laporan' },
                { value: 'PROGRAM_REVIEW', label: 'Tinjauan Program' },
                { value: 'UNIT_VALIDATION', label: 'Validasi Unit' },
                { value: 'APPROVED', label: 'Disetujui' },
                { value: 'REJECTED', label: 'Perlu Perbaikan' },
              ],
            },
            {
              id: 'type',
              label: 'Jenis Laporan',
              value: typeFilter,
              onChange: setTypeFilter,
              options: [
                { value: 'ALL', label: 'Semua Jenis' },
                { value: 'ACTIVITY', label: 'Kegiatan Belajar' },
                { value: 'ATTENDANCE_RECAP', label: 'Rekap Kehadiran' },
                {
                  value: 'STUDENT_DEVELOPMENT',
                  label: 'Perkembangan Peserta',
                },
                { value: 'STAKEHOLDER', label: 'Pemangku Kepentingan' },
              ],
            },
          ]}
        />

        <DataTable
          columns={columns}
          data={filteredReports}
          getRowKey={(r) => r.id}
          onRowClick={(r) => {
            setSelectedReportId(r.id);
            setFeedbackMsg(null);
          }}
          renderMobileRow={(report) => {
            const meta = REPORT_STATUS_META[report.status];
            return (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {REPORT_TYPE_LABEL[report.reportType]} • {report.period}
                    </span>
                    <h3 className="text-sm font-semibold text-foreground">
                      {report.title}
                    </h3>
                    <p className="text-xs text-secondary-foreground">
                      Penyusun: {report.createdByName}
                    </p>
                  </div>
                  <Badge variant={meta.badgeVariant} size="sm" dot>
                    {meta.label}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-secondary-foreground">
                  <span>{report.totalBeneficiaries} peserta</span>
                  <span>•</span>
                  <span>{report.totalSessions} sesi</span>
                  <span>•</span>
                  <span className="font-semibold text-success">
                    Kehadiran {report.averageAttendancePct}%
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-border pt-2.5">
                  <span className="text-[11px] text-muted-foreground">
                    Selanjutnya: {meta.nextActor}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedReportId(report.id);
                    }}
                  >
                    Periksa
                  </Button>
                </div>
              </div>
            );
          }}
          emptyState={
            <EmptyState
              icon={FileText}
              title="Tidak ada dokumen laporan yang sesuai"
              description="Ubah kata kunci pencarian atau filter status untuk melihat dokumen laporan lainnya."
            />
          }
        />
      </section>

      {/* Create New Report Dialog */}
      <Dialog
        open={newReportModalOpen}
        onClose={() => setNewReportModalOpen(false)}
        title="Susun Draft Laporan Pelayanan Baru"
        description="Laporan baru akan disimpan dengan status Draft Laporan dan dapat diajukan ke Tinjauan Program setelah ringkasan capaian dilengkapi."
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setNewReportModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              type="submit"
              form="create-report-form"
              leftIcon={<FileCheck2 className="h-4 w-4" />}
            >
              Simpan Draft Laporan
            </Button>
          </div>
        }
      >
        <form
          id="create-report-form"
          onSubmit={handleCreateReport}
          className="space-y-4"
        >
          {formError && (
            <div
              role="alert"
              className="rounded-md border border-danger/40 bg-danger-soft p-3 text-xs text-danger font-medium"
            >
              {formError}
            </div>
          )}

          <Input
            label="Judul Laporan"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Contoh: Laporan Evaluasi Kelas Membaca & Numerasi Dasar"
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select
              label="Jenis Laporan"
              value={reportType}
              onChange={(e) =>
                setReportType(e.target.value as ServiceReport['reportType'])
              }
              options={[
                { value: 'ACTIVITY', label: 'Laporan Kegiatan Belajar' },
                { value: 'ATTENDANCE_RECAP', label: 'Rekap Kehadiran Peserta' },
                {
                  value: 'STUDENT_DEVELOPMENT',
                  label: 'Perkembangan Karakter Peserta',
                },
                {
                  value: 'STAKEHOLDER',
                  label: 'Laporan Pemangku Kepentingan & Sinodal',
                },
              ]}
            />
            <Input
              label="Periode Laporan"
              required
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              placeholder="Contoh: Triwulan IV 2026"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Input
              label="Total Peserta"
              type="number"
              min={1}
              value={totalBeneficiaries}
              onChange={(e) => setTotalBeneficiaries(e.target.value)}
            />
            <Input
              label="Total Pertemuan"
              type="number"
              min={1}
              value={totalSessions}
              onChange={(e) => setTotalSessions(e.target.value)}
            />
            <Input
              label="Rata-rata Hadir (%)"
              type="number"
              min={0}
              max={100}
              value={averageAttendancePct}
              onChange={(e) => setAverageAttendancePct(e.target.value)}
            />
          </div>

          <Textarea
            label="Ringkasan Eksekutif & Temuan Pelayanan"
            required
            rows={4}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Tuliskan ringkasan capaian belajar peserta, evaluasi kehadiran, serta rekomendasi tindak lanjut..."
            hint="Hindari mencantumkan data sensitif anak secara individual apabila ringkasan ini ditujukan untuk publikasi umum."
          />
        </form>
      </Dialog>
    </div>
  );
};
