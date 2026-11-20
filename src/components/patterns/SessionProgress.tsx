import React from 'react';
import { CheckCircle2, Clock } from 'lucide-react';
import { cn } from '../../utils/cn.ts';
import { Badge, Icon } from '../ui/index.ts';

export interface SessionProgressProps {
  totalCount: number;
  recordedCount: number;
  presentCount: number;
  sickCount: number;
  permittedCount: number;
  absentCount: number;
  className?: string;
}

/**
 * SessionProgress Pattern (UI-7 Sections 11, 12 & 24)
 * Lightweight operational progress bar for class attendance recording.
 * Communicates how many participants have been recorded vs remaining without KPI card clutter.
 */
export const SessionProgress: React.FC<SessionProgressProps> = ({
  totalCount,
  recordedCount,
  presentCount,
  sickCount,
  permittedCount,
  absentCount,
  className,
}) => {
  const unrecordedCount = Math.max(0, totalCount - recordedCount);
  const isComplete = totalCount > 0 && unrecordedCount === 0;
  const pct =
    totalCount > 0 ? Math.round((recordedCount / totalCount) * 100) : 0;

  return (
    <div
      className={cn(
        'px-4 sm:px-6 py-3.5 bg-surface-subtle/60 border-b border-border space-y-2.5',
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-foreground">
            {totalCount} peserta
          </span>
          <span aria-hidden="true" className="text-muted-foreground">
            ·
          </span>
          <span className="text-secondary-foreground">
            <strong className="text-foreground">{recordedCount}</strong> sudah
            dicatat
          </span>
          <span aria-hidden="true" className="text-muted-foreground">
            ·
          </span>
          {isComplete ? (
            <span className="inline-flex items-center gap-1 font-semibold text-success">
              <Icon icon={CheckCircle2} size="xs" />
              <span>Semua kehadiran telah dicatat</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 font-semibold text-warning-foreground">
              <Icon icon={Clock} size="xs" />
              <span>{unrecordedCount} belum dicatat</span>
            </span>
          )}
        </div>

        {/* Recorded breakdown badges */}
        {recordedCount > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="success" size="sm" dot>
              Hadir: {presentCount}
            </Badge>
            {permittedCount > 0 && (
              <Badge variant="info" size="sm" dot>
                Izin: {permittedCount}
              </Badge>
            )}
            {sickCount > 0 && (
              <Badge variant="warning" size="sm" dot>
                Sakit: {sickCount}
              </Badge>
            )}
            {absentCount > 0 && (
              <Badge variant="danger" size="sm" dot>
                Tidak hadir: {absentCount}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Subtle completion bar */}
      <div
        role="progressbar"
        aria-valuenow={recordedCount}
        aria-valuemin={0}
        aria-valuemax={totalCount}
        aria-label={`Progres pencatatan kehadiran: ${recordedCount} dari ${totalCount} peserta`}
        className="h-1.5 w-full rounded-pill bg-border/70 overflow-hidden"
      >
        <div
          className={cn(
            'h-full transition-all duration-200 rounded-pill',
            isComplete ? 'bg-success' : 'bg-primary'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

