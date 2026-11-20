import React from 'react';
import { Check, CircleDot, Circle, XCircle, Archive } from 'lucide-react';
import { cn } from '../../utils/cn.ts';

export type WorkflowStageState =
  | 'completed'
  | 'current'
  | 'upcoming'
  | 'rejected'
  | 'archived';

export interface WorkflowStageItem {
  id: string;
  label: string;
  actorHint?: string;
  state: WorkflowStageState;
}

export interface WorkflowProgressProps {
  stages: WorkflowStageItem[];
  compact?: boolean;
  className?: string;
}

const STATE_LABEL_MAP: Record<WorkflowStageState, string> = {
  completed: 'Selesai',
  current: 'Tahap Saat Ini',
  upcoming: 'Berikutnya',
  rejected: 'Perlu Perbaikan',
  archived: 'Diarsipkan',
};

export const WorkflowProgress: React.FC<WorkflowProgressProps> = ({
  stages,
  compact = false,
  className,
}) => {
  if (compact) {
    return (
      <div
        className={cn('flex flex-wrap items-center gap-1.5', className)}
        aria-label="Alur persetujuan"
      >
        {stages.map((stage, index) => {
          const isCompleted = stage.state === 'completed';
          const isCurrent = stage.state === 'current';
          const isRejected = stage.state === 'rejected';
          const isArchived = stage.state === 'archived';

          return (
            <React.Fragment key={stage.id}>
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[11px] font-medium transition-colors',
                  isCompleted &&
                    'border-success/30 bg-success-soft text-success',
                  isCurrent &&
                    'border-primary/40 bg-primary-soft text-primary font-semibold',
                  isRejected &&
                    'border-danger/40 bg-danger-soft text-danger font-semibold',
                  isArchived &&
                    'border-border bg-surface-subtle text-secondary-foreground',
                  stage.state === 'upcoming' &&
                    'border-border bg-surface text-muted-foreground'
                )}
                title={`${stage.label}: ${STATE_LABEL_MAP[stage.state]}`}
              >
                {isCompleted && (
                  <Check className="h-3 w-3 shrink-0" aria-hidden="true" />
                )}
                {isCurrent && (
                  <CircleDot className="h-3 w-3 shrink-0" aria-hidden="true" />
                )}
                {isRejected && (
                  <XCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
                )}
                {isArchived && (
                  <Archive className="h-3 w-3 shrink-0" aria-hidden="true" />
                )}
                {stage.state === 'upcoming' && (
                  <Circle className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
                )}
                <span>{stage.label}</span>
              </span>
              {index < stages.length - 1 && (
                <span
                  className="text-[10px] text-muted-foreground"
                  aria-hidden="true"
                >
                  →
                </span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  return (
    <ol
      className={cn(
        'grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4',
        className
      )}
      aria-label="Tahapan tata kelola"
    >
      {stages.map((stage, idx) => {
        const isCompleted = stage.state === 'completed';
        const isCurrent = stage.state === 'current';
        const isRejected = stage.state === 'rejected';
        const isArchived = stage.state === 'archived';

        return (
          <li
            key={stage.id}
            className={cn(
              'flex items-start gap-2.5 rounded-md border p-3 transition-colors',
              isCompleted &&
                'border-success/30 bg-success-soft/40 text-foreground',
              isCurrent &&
                'border-primary/50 bg-primary-soft/50 text-foreground shadow-xs',
              isRejected &&
                'border-danger/45 bg-danger-soft/60 text-foreground',
              isArchived &&
                'border-border bg-surface-subtle/70 text-secondary-foreground',
              stage.state === 'upcoming' &&
                'border-border bg-surface-subtle/40 text-muted-foreground'
            )}
          >
            <div
              className={cn(
                'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-pill border text-xs font-semibold',
                isCompleted && 'border-success bg-success text-white',
                isCurrent && 'border-primary bg-primary text-primary-foreground',
                isRejected && 'border-danger bg-danger text-white',
                isArchived &&
                  'border-border-strong bg-surface-subtle text-secondary-foreground',
                stage.state === 'upcoming' &&
                  'border-border bg-surface text-muted-foreground'
              )}
              aria-hidden="true"
            >
              {isCompleted ? (
                <Check className="h-3.5 w-3.5" />
              ) : isRejected ? (
                <XCircle className="h-3.5 w-3.5" />
              ) : isCurrent ? (
                <CircleDot className="h-3.5 w-3.5" />
              ) : (
                <span>{idx + 1}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1.5">
                <span
                  className={cn(
                    'text-xs font-semibold leading-snug',
                    stage.state === 'upcoming'
                      ? 'text-secondary-foreground'
                      : 'text-foreground'
                  )}
                >
                  {stage.label}
                </span>
                <span
                  className={cn(
                    'shrink-0 text-[10px] font-medium uppercase tracking-wider',
                    isCompleted && 'text-success',
                    isCurrent && 'text-primary',
                    isRejected && 'text-danger',
                    isArchived && 'text-secondary-foreground',
                    stage.state === 'upcoming' && 'text-muted-foreground'
                  )}
                >
                  {isCompleted
                    ? '✓ Selesai'
                    : isCurrent
                      ? '● Aktif'
                      : isRejected
                        ? '✕ Ditolak'
                        : isArchived
                          ? 'Arsip'
                          : '○ Menunggu'}
                </span>
              </div>
              {stage.actorHint && (
                <p className="mt-0.5 text-[11px] text-secondary-foreground">
                  {stage.actorHint}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
};
