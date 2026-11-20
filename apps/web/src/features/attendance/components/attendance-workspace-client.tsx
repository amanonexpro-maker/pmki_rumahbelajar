"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  CalendarCheck,
  CheckCheck,
  CloudOff,
  History,
  RefreshCw,
} from "lucide-react";
import { EmptyState, StatusBadge } from "@/components/compositions";
import {
  DetailTabs,
  PageHeader,
  SessionProgress,
  type DetailTabItem,
} from "@/components/patterns";
import { Badge, Button, Icon, Input, Textarea } from "@/components/ui";
import type { ClassSummaryDTO } from "@/features/academic";
import { useConnectivity } from "@/hooks/use-connectivity";
import { useDraftRecovery } from "@/hooks/use-draft-recovery";
import { useOfflineQueue } from "@/hooks/use-offline-queue";
import { OFFLINE_MESSAGES, SUCCESS_MESSAGES } from "@/lib/messages";
import {
  ATTENDANCE_STATUS_META,
  type AttendanceStatus,
  type SyncStatus,
} from "@/lib/status";
import { recordAttendanceSessionAction } from "../actions/attendance-actions";
import type {
  AttendanceRecordItemDTO,
  AttendanceSessionDetailDTO,
  AttendanceSessionHistoryItemDTO,
} from "../types/attendance-types";

const STATUS_BUTTON_ORDER: AttendanceStatus[] = [
  "PRESENT",
  "PERMITTED",
  "SICK",
  "ABSENT",
];

interface AttendanceDraftData {
  notes: string;
  entries: Record<
    string,
    {
      status: AttendanceStatus;
      note: string;
    }
  >;
}

export interface AttendanceWorkspaceClientProps {
  classes: ClassSummaryDTO[];
  sessionView: AttendanceSessionDetailDTO | null;
  historyItems: AttendanceSessionHistoryItemDTO[];
  initialClassId: string;
  initialDate: string;
  initialTab: string;
  canRecord: boolean;
}

export function AttendanceWorkspaceClient({
  classes,
  sessionView,
  historyItems,
  initialClassId,
  initialDate,
  initialTab,
  canRecord,
}: AttendanceWorkspaceClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { status: connectivityStatus, markSynced } = useConnectivity();

  const [activeTab, setActiveTab] = React.useState(initialTab);
  const [submitting, setSubmitting] = React.useState(false);
  const [syncBadgeState, setSyncBadgeState] = React.useState<SyncStatus | null>(
    sessionView?.sessionId ? "SYNCED" : null
  );
  const [feedbackBanner, setFeedbackBanner] = React.useState<{
    tone: "success" | "warning" | "danger";
    message: string;
  } | null>(null);

  const initialDraftValue = React.useMemo<AttendanceDraftData>(() => {
    const entries: AttendanceDraftData["entries"] = {};
    for (const item of sessionView?.roster ?? []) {
      entries[item.studentId] = {
        status: item.status,
        note: item.note ?? "",
      };
    }
    return {
      notes: sessionView?.notes ?? "",
      entries,
    };
  }, [sessionView]);

  const draftKey = `attendance:${initialClassId}:${initialDate}`;
  const {
    draft,
    setDraft,
    hasRecoveredDraft,
    saveDraftNow,
    clearDraft,
  } = useDraftRecovery<AttendanceDraftData>(
    draftKey,
    "attendance_session",
    initialDraftValue
  );

  // Keep draft aligned when switching class/date if no recovered draft exists
  React.useEffect(() => {
    if (!hasRecoveredDraft) {
      setDraft(initialDraftValue);
    }
  }, [hasRecoveredDraft, initialDraftValue, setDraft]);

  const { pendingCount, enqueue, flushQueue } = useOfflineQueue(() => {
    setSyncBadgeState("SYNCED");
    setFeedbackBanner({
      tone: "success",
      message: SUCCESS_MESSAGES.attendanceSaved,
    });
    router.refresh();
  });

  function updateUrl(updates: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams?.toString() ?? "");
    for (const [k, v] of Object.entries(updates)) {
      if (!v) next.delete(k);
      else next.set(k, v);
    }
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function handleStudentStatusChange(
    studentId: string,
    nextStatus: AttendanceStatus
  ) {
    if (!canRecord) return;
    setFeedbackBanner(null);
    setSyncBadgeState("LOCAL_SAVED");
    setDraft((prev) => {
      const next: AttendanceDraftData = {
        ...prev,
        entries: {
          ...prev.entries,
          [studentId]: {
            status: nextStatus,
            note: prev.entries[studentId]?.note ?? "",
          },
        },
      };
      void saveDraftNow(next);
      return next;
    });
  }

  function handleStudentNoteChange(studentId: string, nextNote: string) {
    if (!canRecord) return;
    setSyncBadgeState("LOCAL_SAVED");
    setDraft((prev) => {
      const next: AttendanceDraftData = {
        ...prev,
        entries: {
          ...prev.entries,
          [studentId]: {
            status: prev.entries[studentId]?.status ?? "PRESENT",
            note: nextNote,
          },
        },
      };
      void saveDraftNow(next);
      return next;
    });
  }

  function handleMarkAllPresent() {
    if (!canRecord || !sessionView) return;
    setFeedbackBanner(null);
    setSyncBadgeState("LOCAL_SAVED");
    setDraft((prev) => {
      const nextEntries = { ...prev.entries };
      for (const item of sessionView.roster) {
        nextEntries[item.studentId] = {
          status: "PRESENT",
          note: nextEntries[item.studentId]?.note ?? "",
        };
      }
      const next = { ...prev, entries: nextEntries };
      void saveDraftNow(next);
      return next;
    });
  }

  async function handleSaveSession(e: React.FormEvent) {
    e.preventDefault();
    if (!canRecord || !sessionView || submitting) return;

    const entriesPayload = sessionView.roster.map((item) => ({
      studentId: item.studentId,
      status: draft.entries[item.studentId]?.status ?? item.status,
      note: draft.entries[item.studentId]?.note?.trim() || null,
    }));

    const payload = {
      classId: sessionView.classId,
      sessionDate: sessionView.sessionDate,
      notes: draft.notes.trim() || null,
      entries: entriesPayload,
    };

    const isOffline =
      connectivityStatus === "OFFLINE" ||
      (typeof navigator !== "undefined" && navigator.onLine === false);

    if (isOffline) {
      await saveDraftNow(draft);
      await enqueue({
        operation: "ATTENDANCE_RECORD",
        entityType: "attendance_session",
        entityId: `${sessionView.classId}:${sessionView.sessionDate}`,
        payload,
      });
      setSyncBadgeState("PENDING_SYNC");
      setFeedbackBanner({
        tone: "warning",
        message: `${OFFLINE_MESSAGES.savedLocally} ${OFFLINE_MESSAGES.syncPending}`,
      });
      return;
    }

    setSubmitting(true);
    setFeedbackBanner(null);

    try {
      const result = await recordAttendanceSessionAction(payload);
      if (!result.success) {
        setFeedbackBanner({
          tone: "danger",
          message: result.error.message,
        });
        return;
      }

      await clearDraft();
      markSynced();
      setSyncBadgeState("SYNCED");
      setFeedbackBanner({
        tone: "success",
        message: SUCCESS_MESSAGES.attendanceSaved,
      });
      router.refresh();
    } catch {
      // Network dropped mid-request -> queue offline honestly
      await saveDraftNow(draft);
      await enqueue({
        operation: "ATTENDANCE_RECORD",
        entityType: "attendance_session",
        entityId: `${sessionView.classId}:${sessionView.sessionDate}`,
        payload,
      });
      setSyncBadgeState("PENDING_SYNC");
      setFeedbackBanner({
        tone: "warning",
        message: `${OFFLINE_MESSAGES.savedLocally} ${OFFLINE_MESSAGES.syncPending}`,
      });
    } finally {
      setSubmitting(false);
    }
  }

  const rosterItems: AttendanceRecordItemDTO[] = React.useMemo(() => {
    if (!sessionView) return [];
    return sessionView.roster.map((item) => ({
      ...item,
      status: draft.entries[item.studentId]?.status ?? item.status,
      note: draft.entries[item.studentId]?.note ?? item.note,
    }));
  }, [draft.entries, sessionView]);

  const counts = React.useMemo(() => {
    const total = rosterItems.length;
    const presentCount = rosterItems.filter(
      (r) => r.status === "PRESENT"
    ).length;
    const permittedCount = rosterItems.filter(
      (r) => r.status === "PERMITTED"
    ).length;
    const sickCount = rosterItems.filter((r) => r.status === "SICK").length;
    const absentCount = rosterItems.filter((r) => r.status === "ABSENT").length;
    return {
      total,
      recorded: total,
      presentCount,
      permittedCount,
      sickCount,
      absentCount,
    };
  }, [rosterItems]);

  const tabs: DetailTabItem[] = [
    { id: "session", label: "Sesi presensi" },
    {
      id: "history",
      label: "Riwayat sesi",
      count: historyItems.length,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kehadiran"
        description="Catat presensi sesi belajar peserta didik. Mendukung penyimpanan draft lokal dan antrean sinkronisasi saat koneksi lapangan terputus."
        badge={
          syncBadgeState ? (
            <StatusBadge domain="sync" status={syncBadgeState} />
          ) : undefined
        }
        secondaryActions={
          pendingCount > 0 ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => void flushQueue()}
              leftIcon={<Icon icon={RefreshCw} size="xs" />}
            >
              Sinkronkan antrean ({pendingCount})
            </Button>
          ) : undefined
        }
      />

      {/* Class & Date Selector Bar (Synced to URL ?classId=&date=) */}
      <div className="rounded-card border border-border bg-surface p-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
          <div className="space-y-1">
            <label
              htmlFor="attendance-class-select"
              className="block text-xs font-medium text-secondary-foreground"
            >
              Kelas bimbingan belajar
            </label>
            <select
              id="attendance-class-select"
              value={initialClassId}
              onChange={(e) => updateUrl({ classId: e.target.value })}
              className="flex h-11 w-full rounded-control border border-border bg-surface px-3 text-sm font-medium text-foreground focus-ring"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.enrolledCount} peserta didik)
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="attendance-date-input"
              className="block text-xs font-medium text-secondary-foreground"
            >
              Tanggal sesi belajar
            </label>
            <Input
              id="attendance-date-input"
              type="date"
              value={initialDate}
              onChange={(e) => updateUrl({ date: e.target.value })}
            />
          </div>
        </div>

        {activeTab === "session" &&
          canRecord &&
          rosterItems.length > 0 && (
            <Button
              type="button"
              variant="secondary"
              onClick={handleMarkAllPresent}
              leftIcon={<Icon icon={CheckCheck} size="sm" />}
            >
              Tandai semua hadir
            </Button>
          )}
      </div>

      <DetailTabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={(nextTab) => {
          setActiveTab(nextTab);
          updateUrl({ tab: nextTab === "session" ? null : nextTab });
        }}
        ariaLabel="Mode halaman kehadiran"
      />

      {hasRecoveredDraft && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-2 rounded-control border border-warning/30 bg-warning-soft px-4 py-2.5 text-xs text-foreground"
        >
          <div className="flex items-center gap-2">
            <Icon icon={CloudOff} size="xs" className="text-warning" />
            <span>
              Draft presensi lokal dipulihkan dari perangkat ini (Disimpan
              lokal · Belum tersinkronisasi).
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void clearDraft()}
          >
            Hapus draft lokal
          </Button>
        </div>
      )}

      {sessionView?.needsManualReview && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-control border border-warning/40 bg-warning-soft p-4 text-xs text-foreground"
        >
          <Icon
            icon={AlertTriangle}
            size="sm"
            className="text-warning shrink-0 mt-0.5"
          />
          <div className="space-y-1">
            <p className="font-semibold">
              Perlu tinjauan koordinator (Konflik sinkronisasi offline)
            </p>
            <p className="text-secondary-foreground">
              Sesi ini menerima kiriman sinkronisasi offline ketika data server
              sudah tercatat sebelumnya. Sesuai kebijakan tata kelola, data
              server dipertahankan dan sesi ditandai untuk ditinjau.
            </p>
          </div>
        </div>
      )}

      {feedbackBanner && (
        <div
          role={feedbackBanner.tone === "danger" ? "alert" : "status"}
          className={
            feedbackBanner.tone === "success"
              ? "rounded-control border border-success/30 bg-success-soft px-4 py-3 text-sm text-success"
              : feedbackBanner.tone === "warning"
                ? "rounded-control border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning-foreground"
                : "rounded-control border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger"
          }
        >
          {feedbackBanner.message}
        </div>
      )}

      {activeTab === "session" && (
        <>
          {!sessionView || rosterItems.length === 0 ? (
            <EmptyState
              icon={CalendarCheck}
              title="Belum ada peserta didik aktif di kelas ini."
              description="Tempatkan peserta didik yang telah terverifikasi ke kelas ini terlebih dahulu sebelum mencatat presensi."
            />
          ) : (
            <form onSubmit={handleSaveSession} className="space-y-5">
              <SessionProgress
                total={counts.total}
                recorded={counts.recorded}
                presentCount={counts.presentCount}
                permittedCount={counts.permittedCount}
                sickCount={counts.sickCount}
                absentCount={counts.absentCount}
              />

              {/* One-Handed Mobile-First Roster List (375px ready, touch >= 44px) */}
              <ul
                role="list"
                aria-label="Daftar presensi peserta didik"
                className="rounded-card border border-border bg-surface divide-y divide-border"
              >
                {rosterItems.map((item) => (
                  <li key={item.studentId} className="p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground text-sm">
                          {item.studentFullName}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {item.registrationNumber} · Panggilan:{" "}
                          {item.studentNickname} · {item.educationLevelLabel}
                        </p>
                      </div>

                      {/* 4 Canonical Status Buttons: Hadir, Izin, Sakit, Tidak hadir (NEVER Alpa) */}
                      <div
                        role="group"
                        aria-label={`Status kehadiran ${item.studentFullName}`}
                        className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2"
                      >
                        {STATUS_BUTTON_ORDER.map((stCode) => {
                          const meta = ATTENDANCE_STATUS_META[stCode];
                          const isSelected = item.status === stCode;
                          return (
                            <Button
                              key={stCode}
                              type="button"
                              size="sm"
                              disabled={!canRecord}
                              aria-pressed={isSelected}
                              variant={isSelected ? "primary" : "secondary"}
                              onClick={() =>
                                handleStudentStatusChange(
                                  item.studentId,
                                  stCode
                                )
                              }
                              className="min-h-11 sm:min-h-9 justify-center"
                            >
                              {meta.label}
                            </Button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-1">
                      <Input
                        aria-label={`Catatan kehadiran ${item.studentFullName}`}
                        placeholder="Catatan singkat (mis. izin acara keluarga, perlu tindak lanjut)..."
                        value={item.note ?? ""}
                        disabled={!canRecord}
                        onChange={(e) =>
                          handleStudentNoteChange(
                            item.studentId,
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </li>
                ))}
              </ul>

              <div className="rounded-card border border-border bg-surface p-4 space-y-3">
                <label
                  htmlFor="session-general-notes"
                  className="block text-sm font-medium text-foreground"
                >
                  Catatan sesi kelas (opsional)
                </label>
                <Textarea
                  id="session-general-notes"
                  rows={2}
                  disabled={!canRecord}
                  placeholder="Ringkasan materi belajar atau kendala selama sesi berlangsung..."
                  value={draft.notes}
                  onChange={(e) => {
                    const nextVal = e.target.value;
                    setSyncBadgeState("LOCAL_SAVED");
                    setDraft((prev) => {
                      const next = { ...prev, notes: nextVal };
                      void saveDraftNow(next);
                      return next;
                    });
                  }}
                />
              </div>

              {canRecord && (
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2 text-xs text-secondary-foreground">
                    {syncBadgeState && (
                      <StatusBadge domain="sync" status={syncBadgeState} />
                    )}
                    <span>
                      {connectivityStatus === "OFFLINE"
                        ? "Mode offline aktif: presensi akan masuk antrean sinkronisasi."
                        : "Pastikan seluruh kehadiran peserta didik telah sesuai."}
                    </span>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    disabled={submitting}
                    leftIcon={<Icon icon={CalendarCheck} size="sm" />}
                  >
                    {submitting ? "Menyimpan..." : "Catat presensi"}
                  </Button>
                </div>
              )}
            </form>
          )}
        </>
      )}

      {activeTab === "history" && (
        <div className="space-y-4">
          {historyItems.length === 0 ? (
            <EmptyState
              icon={History}
              title="Belum ada riwayat sesi presensi."
              description="Sesi presensi yang telah dicatat akan muncul di daftar riwayat ini."
            />
          ) : (
            <ul className="rounded-card border border-border bg-surface divide-y divide-border">
              {historyItems.map((hist) => (
                <li
                  key={hist.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-sm text-foreground">
                        {hist.className} · {hist.sessionDate}
                      </p>
                      {hist.needsManualReview && (
                        <Badge variant="warning" size="sm">
                          Perlu tinjauan koordinator
                        </Badge>
                      )}
                    </div>
                    {hist.notes && (
                      <p className="text-xs text-secondary-foreground">
                        {hist.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs tabular-nums">
                    <span>
                      Hadir:{" "}
                      <strong className="text-success-foreground">
                        {hist.presentCount}
                      </strong>
                    </span>
                    <span>
                      Izin:{" "}
                      <strong className="text-info-foreground">
                        {hist.permittedCount}
                      </strong>
                    </span>
                    <span>
                      Sakit:{" "}
                      <strong className="text-warning-foreground">
                        {hist.sickCount}
                      </strong>
                    </span>
                    <span>
                      Tidak hadir:{" "}
                      <strong className="text-danger-foreground">
                        {hist.absentCount}
                      </strong>
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setActiveTab("session");
                        updateUrl({
                          classId: hist.classId,
                          date: hist.sessionDate,
                          tab: null,
                        });
                      }}
                    >
                      Buka sesi
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

