"use client";

import * as React from "react";
import { MobileCardList } from "@/components/patterns";
import { Input } from "@/components/ui";
import { cn } from "@/lib/cn";
import { ATTENDANCE_STATUS_META, type AttendanceStatus } from "@/lib/status";
import type { AttendanceRecordItemDTO } from "../types/attendance-types";

interface StatusOption {
  code: AttendanceStatus;
  label: string;
  selectedStyles: string;
}

const ATTENDANCE_OPTIONS: StatusOption[] = [
  {
    code: "PRESENT",
    label: ATTENDANCE_STATUS_META.PRESENT.label,
    selectedStyles:
      "bg-success-soft text-success border-success/50 font-semibold shadow-xs ring-1 ring-success/30",
  },
  {
    code: "SICK",
    label: ATTENDANCE_STATUS_META.SICK.label,
    selectedStyles:
      "bg-warning-soft text-warning-foreground border-warning/50 font-semibold shadow-xs ring-1 ring-warning/30",
  },
  {
    code: "PERMITTED",
    label: ATTENDANCE_STATUS_META.PERMITTED.label,
    selectedStyles:
      "bg-info-soft text-info border-info/50 font-semibold shadow-xs ring-1 ring-info/30",
  },
  {
    code: "ABSENT",
    label: ATTENDANCE_STATUS_META.ABSENT.label,
    selectedStyles:
      "bg-danger-soft text-danger border-danger/50 font-semibold shadow-xs ring-1 ring-danger/30",
  },
];

export interface AttendanceListItemProps {
  item: AttendanceRecordItemDTO;
  canRecord: boolean;
  onStatusChange: (studentId: string, nextStatus: AttendanceStatus) => void;
  onNoteChange: (studentId: string, nextNote: string) => void;
}

export const AttendanceListItem = React.memo(function AttendanceListItem({
  item,
  canRecord,
  onStatusChange,
  onNoteChange,
}: AttendanceListItemProps) {
  return (
    <li className="p-4 space-y-3">
      <MobileCardList
        title={
          <p className="font-semibold text-foreground text-base leading-snug">
            {item.studentFullName}
            {item.studentNickname && (
              <span className="font-normal text-muted-foreground text-sm ml-1.5">
                ({item.studentNickname})
              </span>
            )}
          </p>
        }
        primaryMeta={
          <p className="text-xs text-secondary-foreground mt-0.5">
            {item.educationLevelLabel}
            {item.registrationNumber && (
              <span> · No: {item.registrationNumber}</span>
            )}
          </p>
        }
        secondaryMeta={
          <div
            role="group"
            aria-label={`Status kehadiran ${item.studentFullName}`}
            className="grid grid-cols-4 sm:flex sm:flex-wrap items-center gap-1.5 sm:gap-2 pt-1"
          >
            {ATTENDANCE_OPTIONS.map((opt) => {
              const isSelected = item.status === opt.code;
              return (
                <button
                  key={opt.code}
                  type="button"
                  disabled={!canRecord}
                  aria-pressed={isSelected}
                  onClick={() => onStatusChange(item.studentId, opt.code)}
                  className={cn(
                    "min-h-11 px-3 sm:px-4 rounded-control text-xs font-medium transition-colors duration-200 border flex items-center justify-center focus-ring",
                    isSelected
                      ? opt.selectedStyles
                      : "border-border bg-surface text-secondary-foreground hover:bg-surface-subtle hover:text-foreground"
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        }
        action={
          <div className="w-full pt-1">
            <Input
              aria-label={`Catatan kehadiran ${item.studentFullName}`}
              placeholder="Catatan singkat (mis. izin sakit demam, perlu tindak lanjut)..."
              value={item.note ?? ""}
              disabled={!canRecord}
              onChange={(e) => onNoteChange(item.studentId, e.target.value)}
            />
          </div>
        }
      />
    </li>
  );
});

