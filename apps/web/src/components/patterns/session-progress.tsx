import * as React from "react";
import { cn } from "@/lib/cn";

export interface SessionProgressProps {
  total: number;
  recorded: number;
  presentCount: number;
  permittedCount: number;
  sickCount: number;
  absentCount: number;
  className?: string;
}

export function SessionProgress({
  total,
  recorded,
  presentCount,
  permittedCount,
  sickCount,
  absentCount,
  className,
}: SessionProgressProps) {
  const percent = total > 0 ? Math.round((recorded / total) * 100) : 0;

  return (
    <div
      className={cn(
        "rounded-control border border-border bg-surface p-4 space-y-3",
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-semibold text-foreground">
          Progres pencatatan presensi:{" "}
          <span className="tabular-nums text-primary">
            {recorded}/{total}
          </span>{" "}
          peserta ({percent}%)
        </span>

        <div className="flex flex-wrap items-center gap-3 text-secondary-foreground tabular-nums">
          <span>
            Hadir: <strong className="text-success-foreground">{presentCount}</strong>
          </span>
          <span>
            Izin: <strong className="text-info-foreground">{permittedCount}</strong>
          </span>
          <span>
            Sakit: <strong className="text-warning-foreground">{sickCount}</strong>
          </span>
          <span>
            Tidak hadir:{" "}
            <strong className="text-danger-foreground">{absentCount}</strong>
          </span>
        </div>
      </div>

      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progres pencatatan presensi"
        className="h-2 w-full rounded-pill bg-surface-subtle overflow-hidden"
      >
        <div
          className="h-full rounded-pill bg-primary transition-[width] duration-200"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

