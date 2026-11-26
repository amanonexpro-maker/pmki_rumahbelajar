"use client";

import * as React from "react";
import { EmptyState, StatusBadge } from "@/components/compositions";
import {
  DatePicker,
  DetailTabs,
  PageHeader,
  type DetailTabItem,
} from "@/components/patterns";
import {
  Badge,
  Button,
  Icon,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@/components/ui";
import { ICON_MAP } from "@/config/icons";
import type { ClassSummaryDTO } from "@/features/academic";
import { useUrlQueryParams } from "@/hooks/use-url-query-params";
import { ATTENDANCE_STATUS_META } from "@/lib/status";
import { useAttendanceSession } from "../hooks/use-attendance-session";
import { useAttendanceSync } from "../hooks/use-attendance-sync";
import type {
  AttendanceSessionDetailDTO,
  AttendanceSessionHistoryItemDTO,
  QuickAttendanceWorkspaceViewDTO,
} from "../types/attendance-types";
import { AttendanceListItem } from "./attendance-list-item";
import { QuickAttendanceTab } from "./quick-attendance-tab";
import { SyncStatusBanner } from "./sync-status-banner";

export interface AttendanceWorkspaceClientProps {
  classes: ClassSummaryDTO[];
  sessionView: AttendanceSessionDetailDTO | null;
  quickRoster?: QuickAttendanceWorkspaceViewDTO | null;
  historyItems: AttendanceSessionHistoryItemDTO[];
  initialClassId: string;
  initialDate: string;
  initialTab: string;
  canRecord: boolean;
}

/**
 * Orchestrates the offline-first Attendance workspace: coordinates class/date
 * selection, sync queue banner, roster attendance recording, and session history.
 */
export function AttendanceWorkspaceClient({
  classes,
  sessionView,
  quickRoster = null,
  historyItems,
  initialClassId,
  initialDate,
  initialTab,
  canRecord,
}: AttendanceWorkspaceClientProps) {
  const { updateQuery: updateUrl, router } = useUrlQueryParams();
  const [activeTab, setActiveTab] = React.useState(initialTab);

  const handleRefresh = React.useCallback(() => {
    router.refresh();
  }, [router]);

  const {
    connectivityStatus,
    pendingCount,
    isSyncing,
    syncBadgeState,
    setSyncBadgeState,
    feedbackBanner,
    setFeedbackBanner,
    enqueue,
    markSynced,
    triggerSync,
  } = useAttendanceSync({
    hasExistingSession: Boolean(sessionView?.sessionId),
    onSyncSuccess: handleRefresh,
  });

  const {
    draft,
    hasRecoveredDraft,
    clearDraft,
    submitting,
    searchQuery,
    setSearchQuery,
    rosterItems,
    filteredRosterItems,
    counts,
    handleStudentStatusChange,
    handleStudentNoteChange,
    handleSessionNotesChange,
    handleMarkAllPresent,
    handleSaveSession,
  } = useAttendanceSession({
    sessionView,
    initialClassId,
    initialDate,
    canRecord,
    connectivityStatus,
    enqueue,
    markSynced,
    setSyncBadgeState,
    setFeedbackBanner,
    onSaved: handleRefresh,
  });

  const tabs: DetailTabItem[] = [
    { id: "session", label: "Sesi presensi" },
    {
      id: "quick",
      label: "Presensi cepat",
      count: quickRoster?.items.length,
    },
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
              disabled={isSyncing}
              onClick={() => void triggerSync()}
              leftIcon={<Icon icon={ICON_MAP.refresh} size="xs" />}
            >
              Sinkronkan antrean ({pendingCount})
            </Button>
          ) : undefined
        }
      />

      {/* Class & Date Selector Bar (Synced to URL ?classId=&date=) */}
      <div className="rounded-card border border-border bg-surface p-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div
          className={
            activeTab === "quick"
              ? "grid grid-cols-1 gap-3 flex-1 sm:max-w-xs"
              : "grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1"
          }
        >
          {activeTab !== "quick" && (
            <div className="space-y-1">
              <label
                htmlFor="attendance-class-select"
                className="block text-xs font-medium text-secondary-foreground"
              >
                Kelas bimbingan belajar
              </label>
              <Select
                value={initialClassId}
                onValueChange={(value) => updateUrl({ classId: value })}
              >
                <SelectTrigger id="attendance-class-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="min-w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-2rem)]">
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} ({cls.enrolledCount} peserta didik)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <DatePicker
            id="attendance-date-input"
            label="Tanggal sesi belajar"
            value={initialDate}
            onChange={(v) => updateUrl({ date: v })}
            containerClassName="space-y-1"
          />
        </div>
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

      <SyncStatusBanner
        hasRecoveredDraft={hasRecoveredDraft}
        onClearDraft={() => void clearDraft()}
        needsManualReview={sessionView?.needsManualReview}
        feedbackBanner={feedbackBanner}
        onDismissFeedback={() => setFeedbackBanner(null)}
      />

      {activeTab === "session" && (
        <>
          {!sessionView || rosterItems.length === 0 ? (
            <EmptyState
              icon={ICON_MAP.calendarCheck}
              title="Belum ada peserta didik aktif di kelas ini."
              description="Tempatkan peserta didik yang telah terverifikasi ke kelas ini terlebih dahulu sebelum mencatat presensi."
            />
          ) : (
            <form onSubmit={handleSaveSession} className="space-y-5">
              {/* Quick Batch Toolbar - Sticky on Scroll */}
              <div className="sticky top-0 z-20 -mx-4 px-4 sm:mx-0 sm:px-0 py-3 bg-background/95 backdrop-blur-sm border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={!canRecord || rosterItems.length === 0}
                  onClick={handleMarkAllPresent}
                  className="min-h-12 w-full sm:w-auto px-5 bg-primary text-primary-foreground rounded-control shadow-xs hover:bg-primary-hover active:bg-primary-active transition-colors duration-200 flex items-center justify-center font-medium text-sm focus-ring disabled:opacity-50 disabled:pointer-events-none shrink-0"
                >
                  <ICON_MAP.checkCircle
                    className="w-4 h-4 mr-2 shrink-0"
                    aria-hidden="true"
                  />
                  <span>Tandai Semua Hadir</span>
                </button>

                {/* Realtime Recapitulation Pills */}
                <div className="flex flex-wrap items-center gap-2">
                  <div role="status" aria-live="polite" className="sr-only">
                    {`Rekapitulasi presensi: ${counts.presentCount} hadir, ${counts.sickCount} sakit, ${counts.permittedCount} izin, ${counts.absentCount} tidak hadir dari total ${counts.total} peserta didik.`}
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-xs font-medium bg-success-soft text-success border border-success/30">
                    {ATTENDANCE_STATUS_META.PRESENT.label}:{" "}
                    <strong className="tabular-nums font-semibold">
                      {counts.presentCount}
                    </strong>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-xs font-medium bg-warning-soft text-warning-foreground border border-warning/30">
                    {ATTENDANCE_STATUS_META.SICK.label}:{" "}
                    <strong className="tabular-nums font-semibold">
                      {counts.sickCount}
                    </strong>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-xs font-medium bg-info-soft text-info border border-info/30">
                    {ATTENDANCE_STATUS_META.PERMITTED.label}:{" "}
                    <strong className="tabular-nums font-semibold">
                      {counts.permittedCount}
                    </strong>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-xs font-medium bg-danger-soft text-danger border border-danger/30">
                    {ATTENDANCE_STATUS_META.ABSENT.label}:{" "}
                    <strong className="tabular-nums font-semibold">
                      {counts.absentCount}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Instant Client-Side Filter */}
              <div className="relative">
                <ICON_MAP.search
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
                  aria-hidden="true"
                />
                <Input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama peserta didik..."
                  className="pl-9 h-11 w-full"
                  aria-label="Cari nama peserta didik"
                />
              </div>

              {/* Roster Cards or Empty Search Result */}
              {filteredRosterItems.length === 0 ? (
                <div className="rounded-card border border-border bg-surface p-8 text-center space-y-2">
                  <p className="font-medium text-foreground text-sm">
                    Tidak ada peserta didik yang cocok dengan &ldquo;{searchQuery}
                    &rdquo;
                  </p>
                  <p className="text-xs text-secondary-foreground">
                    Periksa ejaan nama atau bersihkan kotak pencarian untuk
                    melihat seluruh daftar kelas.
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchQuery("")}
                    className="mt-2"
                  >
                    Reset pencarian
                  </Button>
                </div>
              ) : (
                <ul
                  role="list"
                  aria-label="Daftar presensi peserta didik"
                  className="rounded-card border border-border bg-surface divide-y divide-border-subtle overflow-hidden"
                >
                  {filteredRosterItems.map((item) => (
                    <AttendanceListItem
                      key={item.studentId}
                      item={item}
                      canRecord={canRecord}
                      onStatusChange={handleStudentStatusChange}
                      onNoteChange={handleStudentNoteChange}
                    />
                  ))}
                </ul>
              )}

              {/* Class General Notes */}
              <div className="rounded-card border border-border bg-surface p-4 space-y-3">
                <label
                  htmlFor="session-general-notes"
                  className="block text-sm font-medium text-foreground"
                >
                  {`Catatan sesi ${sessionView.className} (opsional)`}
                </label>
                <Textarea
                  id="session-general-notes"
                  rows={2}
                  disabled={!canRecord}
                  placeholder="Ringkasan materi belajar atau kendala selama sesi berlangsung..."
                  value={draft.notes}
                  onChange={(e) => handleSessionNotesChange(e.target.value)}
                />
              </div>

              {/* Action Bar Footer */}
              {canRecord && (
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <p className="text-xs text-secondary-foreground">
                    {connectivityStatus === "OFFLINE"
                      ? "Mode offline aktif: presensi akan masuk antrean sinkronisasi."
                      : "Pastikan seluruh kehadiran peserta didik telah sesuai."}
                  </p>

                  <Button
                    type="submit"
                    variant="primary"
                    disabled={submitting}
                    leftIcon={<Icon icon={ICON_MAP.calendarCheck} size="sm" />}
                  >
                    {submitting ? "Menyimpan presensi..." : "Simpan presensi"}
                  </Button>
                </div>
              )}
            </form>
          )}
        </>
      )}

      {activeTab === "quick" && (
        <QuickAttendanceTab
          quickRoster={quickRoster}
          sessionDate={initialDate}
          canRecord={canRecord}
          isOffline={connectivityStatus === "OFFLINE"}
          onEnqueueOfflineClass={(payload) =>
            enqueue({
              operation: "ATTENDANCE_RECORD",
              entityType: "attendance_session",
              entityId: `${payload.classId}:${payload.sessionDate}`,
              payload,
            })
          }
          onFeedback={(tone, message) => setFeedbackBanner({ tone, message })}
          onSaved={handleRefresh}
        />
      )}

      {activeTab === "history" && (
        <div className="space-y-4">
          {historyItems.length === 0 ? (
            <EmptyState
              icon={ICON_MAP.history}
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
