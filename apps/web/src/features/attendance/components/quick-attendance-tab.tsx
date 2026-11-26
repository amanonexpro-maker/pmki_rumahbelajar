"use client";

import * as React from "react";
import { QrCode } from "lucide-react";
import { EmptyState } from "@/components/compositions";
import { Badge, Button, Icon, Input } from "@/components/ui";
import { ICON_MAP } from "@/config/icons";
import { cn } from "@/lib/cn";
import { ATTENDANCE_STATUS_META, type AttendanceStatus } from "@/lib/status";
import { recordQuickAttendanceAction } from "../actions/attendance-actions";
import type {
  QuickAttendanceRosterItemDTO,
  QuickAttendanceWorkspaceViewDTO,
} from "../types/attendance-types";
import { QrScannerSheet } from "./qr-scanner-sheet";

export interface QuickAttendanceTabProps {
  quickRoster: QuickAttendanceWorkspaceViewDTO | null;
  sessionDate: string;
  canRecord: boolean;
  isOffline: boolean;
  onEnqueueOfflineClass: (payload: {
    classId: string;
    sessionDate: string;
    notes: string | null;
    entries: Array<{ studentId: string; status: AttendanceStatus; note: string | null }>;
    recordedOfflineAt: string;
    isOfflineSync: true;
  }) => Promise<unknown>;
  onFeedback: (tone: "success" | "warning" | "danger", message: string) => void;
  onSaved: () => void;
}

const STATUS_BUTTONS: Array<{
  code: AttendanceStatus;
  label: string;
  activeClasses: string;
}> = [
  {
    code: "PRESENT",
    label: ATTENDANCE_STATUS_META.PRESENT.label,
    activeClasses:
      "bg-success-soft text-success border-success/50 font-semibold ring-1 ring-success/30",
  },
  {
    code: "PERMITTED",
    label: ATTENDANCE_STATUS_META.PERMITTED.label,
    activeClasses:
      "bg-info-soft text-info border-info/50 font-semibold ring-1 ring-info/30",
  },
  {
    code: "SICK",
    label: ATTENDANCE_STATUS_META.SICK.label,
    activeClasses:
      "bg-warning-soft text-warning-foreground border-warning/50 font-semibold ring-1 ring-warning/30",
  },
  {
    code: "ABSENT",
    label: ATTENDANCE_STATUS_META.ABSENT.label,
    activeClasses:
      "bg-danger-soft text-danger border-danger/50 font-semibold ring-1 ring-danger/30",
  },
];

type QuickFilterMode = "ALL" | "UNRECORDED" | "RECORDED";

export function QuickAttendanceTab({
  quickRoster,
  sessionDate,
  canRecord,
  isOffline,
  onEnqueueOfflineClass,
  onFeedback,
  onSaved,
}: QuickAttendanceTabProps) {
  const [search, setSearch] = React.useState("");
  const [filterMode, setFilterMode] = React.useState<QuickFilterMode>("ALL");
  const [pendingByStudent, setPendingByStudent] = React.useState<
    Record<string, { classId: string; status: AttendanceStatus }>
  >({});
  const [submitting, setSubmitting] = React.useState(false);
  const [scannerOpen, setScannerOpen] = React.useState(false);

  const items = React.useMemo(
    () => quickRoster?.items ?? [],
    [quickRoster?.items]
  );

  const handleScanRegistrationNumber = React.useCallback(
    (registrationNumber: string) => {
      const normalized = registrationNumber.trim().toUpperCase();
      const matched = items.find(
        (it) => it.registrationNumber.trim().toUpperCase() === normalized
      );
      if (!matched) {
        return {
          ok: false as const,
          message: `Nomor ${normalized} tidak ditemukan di daftar kelas aktif.`,
        };
      }
      setPendingByStudent((prev) => ({
        ...prev,
        [matched.studentId]: { classId: matched.classId, status: "PRESENT" },
      }));
      return {
        ok: true as const,
        label: `${matched.studentFullName} (${matched.className})`,
      };
    },
    [items]
  );

  const filteredItems = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      const hasEffective =
        Boolean(pendingByStudent[item.studentId]) || item.hasExistingRecord;
      if (filterMode === "UNRECORDED" && hasEffective) return false;
      if (filterMode === "RECORDED" && !hasEffective) return false;
      if (!q) return true;
      return (
        item.studentFullName.toLowerCase().includes(q) ||
        item.studentNickname.toLowerCase().includes(q) ||
        item.className.toLowerCase().includes(q) ||
        item.registrationNumber.toLowerCase().includes(q)
      );
    });
  }, [items, search, filterMode, pendingByStudent]);

  const pendingEntries = React.useMemo(
    () => Object.entries(pendingByStudent),
    [pendingByStudent]
  );

  const touchedClassCount = React.useMemo(() => {
    return new Set(pendingEntries.map(([, val]) => val.classId)).size;
  }, [pendingEntries]);

  function handleSelectStatus(
    item: QuickAttendanceRosterItemDTO,
    nextStatus: AttendanceStatus
  ) {
    setPendingByStudent((prev) => {
      const current = prev[item.studentId];
      if (current?.status === nextStatus) {
        const next = { ...prev };
        delete next[item.studentId];
        return next;
      }
      return {
        ...prev,
        [item.studentId]: { classId: item.classId, status: nextStatus },
      };
    });
  }

  async function handleSaveQuick() {
    if (pendingEntries.length === 0 || submitting) return;
    setSubmitting(true);
    try {
      if (isOffline) {
        const byClass = new Map<
          string,
          Array<{ studentId: string; status: AttendanceStatus; note: string | null }>
        >();
        for (const [studentId, val] of pendingEntries) {
          const list = byClass.get(val.classId) ?? [];
          list.push({ studentId, status: val.status, note: null });
          byClass.set(val.classId, list);
        }
        const recordedOfflineAt = new Date().toISOString();
        for (const [classId, entries] of byClass.entries()) {
          await onEnqueueOfflineClass({
            classId,
            sessionDate,
            notes: null,
            entries,
            recordedOfflineAt,
            isOfflineSync: true,
          });
        }
        setPendingByStudent({});
        onFeedback(
          "warning",
          `${pendingEntries.length} presensi pada ${byClass.size} kelas disimpan lokal dan menunggu sinkronisasi.`
        );
        return;
      }

      const res = await recordQuickAttendanceAction({
        sessionDate,
        entries: pendingEntries.map(([studentId, val]) => ({
          studentId,
          classId: val.classId,
          status: val.status,
          note: null,
        })),
      });

      if (!res.success) {
        onFeedback("danger", res.error.message);
        return;
      }

      setPendingByStudent({});
      onFeedback(
        "success",
        `${res.data.recordedCount} presensi pada ${res.data.classCount} kelas berhasil disimpan.`
      );
      onSaved();
    } finally {
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={ICON_MAP.peserta}
        title="Belum ada peserta didik aktif di kelas."
        description="Peserta didik yang telah ditempatkan ke kelas aktif akan muncul di sini untuk presensi cepat lintas kelas."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-card border border-border bg-surface p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <ICON_MAP.search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama lengkap, panggilan, atau kelas..."
              className="pl-9 h-11 w-full"
              aria-label="Cari peserta didik lintas kelas"
            />
          </div>
          {canRecord && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setScannerOpen(true)}
              leftIcon={<Icon icon={QrCode} size="sm" />}
              className="min-h-11 shrink-0"
            >
              Pindai QR
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: "ALL", label: `Semua (${items.length})` },
                { id: "UNRECORDED", label: "Belum dicatat" },
                { id: "RECORDED", label: "Sudah dicatat" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setFilterMode(opt.id)}
                className={cn(
                  "rounded-pill border px-3 py-1.5 font-medium transition-colors cursor-pointer focus-ring",
                  filterMode === opt.id
                    ? "border-primary bg-primary-soft text-primary font-semibold"
                    : "border-border bg-surface text-secondary-foreground hover:text-foreground"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <span className="text-muted-foreground">
            Hanya memperbarui peserta didik yang ditandai.
          </span>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="rounded-card border border-border bg-surface p-8 text-center space-y-2">
          <p className="font-medium text-foreground text-sm">
            Tidak ada peserta didik yang cocok.
          </p>
          <p className="text-xs text-secondary-foreground">
            Ubah kata kunci pencarian atau pilih filter status lain.
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setFilterMode("ALL");
            }}
          >
            Atur ulang pencarian
          </Button>
        </div>
      ) : (
        <ul
          role="list"
          aria-label="Daftar presensi cepat lintas kelas"
          className="rounded-card border border-border bg-surface divide-y divide-border-subtle overflow-hidden"
        >
          {filteredItems.map((item) => {
            const pending = pendingByStudent[item.studentId];
            const effectiveStatus = pending?.status ?? item.recordedStatus;

            return (
              <li key={item.studentId} className="p-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 space-y-0.5">
                    <p className="font-semibold text-foreground text-base leading-snug">
                      {item.studentFullName}
                      {item.studentNickname && (
                        <span className="font-normal text-muted-foreground text-sm ml-1.5">
                          ({item.studentNickname})
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-secondary-foreground">
                      {item.educationLevelLabel} · {item.registrationNumber}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge variant="neutral" size="sm">
                      {item.className}
                    </Badge>
                    {pending ? (
                      <Badge variant="info" size="sm">
                        Belum disimpan
                      </Badge>
                    ) : item.hasExistingRecord ? (
                      <Badge variant="success" size="sm">
                        Tercatat
                      </Badge>
                    ) : null}
                  </div>
                </div>

                <div
                  role="group"
                  aria-label={`Presensi cepat ${item.studentFullName}`}
                  className="grid grid-cols-4 sm:flex sm:flex-wrap items-center gap-1.5 sm:gap-2"
                >
                  {STATUS_BUTTONS.map((btn) => {
                    const isSelected = effectiveStatus === btn.code;
                    return (
                      <button
                        key={btn.code}
                        type="button"
                        disabled={!canRecord}
                        aria-pressed={isSelected}
                        onClick={() => handleSelectStatus(item, btn.code)}
                        className={cn(
                          "min-h-11 sm:min-h-9 px-2 sm:px-3.5 rounded-control text-xs font-medium transition-colors border flex items-center justify-center focus-ring cursor-pointer disabled:opacity-50 disabled:pointer-events-none",
                          isSelected
                            ? btn.activeClasses
                            : "border-border bg-surface text-secondary-foreground hover:bg-surface-subtle hover:text-foreground"
                        )}
                      >
                        {btn.label}
                      </button>
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {canRecord && (
        <div className="sticky bottom-16 md:bottom-4 z-20 rounded-card border border-border bg-surface/95 backdrop-blur-sm p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-secondary-foreground">
            {pendingEntries.length > 0 ? (
              <span className="font-semibold text-foreground">
                {pendingEntries.length} peserta didik ditandai ({touchedClassCount}{" "}
                kelas)
              </span>
            ) : (
              <span>Ketuk status kehadiran peserta didik yang datang.</span>
            )}
          </div>
          <Button
            type="button"
            variant="primary"
            loading={submitting}
            disabled={pendingEntries.length === 0}
            onClick={() => void handleSaveQuick()}
            leftIcon={<Icon icon={ICON_MAP.calendarCheck} size="sm" />}
          >
            Simpan presensi cepat
          </Button>
        </div>
      )}

      <QrScannerSheet
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onScanRegistrationNumber={handleScanRegistrationNumber}
      />
    </div>
  );
}

