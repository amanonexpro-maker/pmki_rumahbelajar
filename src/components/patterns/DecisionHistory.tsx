import React from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquareText,
  UserCheck,
} from 'lucide-react';
import { Badge, type BadgeVariant } from '../ui/Badge.tsx';
import { cn } from '../../utils/cn.ts';

export interface DecisionHistoryEntry {
  id: string;
  stageLabel: string;
  decisionLabel: string;
  decisionTone?: BadgeVariant;
  actorName: string;
  actorRole?: string;
  timestamp: string;
  comment?: string;
}

export interface DecisionHistoryProps {
  entries: DecisionHistoryEntry[];
  emptyMessage?: string;
  className?: string;
}

export const DecisionHistory: React.FC<DecisionHistoryProps> = ({
  entries,
  emptyMessage = 'Belum ada riwayat keputusan atau tinjauan yang tercatat.',
  className,
}) => {
  if (entries.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center gap-2.5 rounded-md border border-dashed border-border bg-surface-subtle/40 px-4 py-3.5 text-xs text-secondary-foreground',
          className
        )}
      >
        <Clock
          className="h-4 w-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
        <span>{emptyMessage}</span>
      </div>
    );
  }

  return (
    <ol
      className={cn('space-y-2.5', className)}
      aria-label="Riwayat keputusan tata kelola"
    >
      {entries.map((entry) => {
        const isDanger = entry.decisionTone === 'danger';
        const isSuccess = entry.decisionTone === 'success';

        return (
          <li
            key={entry.id}
            className={cn(
              'rounded-md border p-3.5 transition-colors',
              isDanger
                ? 'border-danger/35 bg-danger-soft/35'
                : 'border-border bg-surface'
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                {isDanger ? (
                  <XCircle
                    className="h-4 w-4 shrink-0 text-danger"
                    aria-hidden="true"
                  />
                ) : isSuccess ? (
                  <CheckCircle2
                    className="h-4 w-4 shrink-0 text-success"
                    aria-hidden="true"
                  />
                ) : (
                  <UserCheck
                    className="h-4 w-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                )}
                <span className="text-xs font-semibold text-foreground">
                  {entry.stageLabel}
                </span>
                <Badge variant={entry.decisionTone ?? 'neutral'} size="sm">
                  {entry.decisionLabel}
                </Badge>
              </div>
              <time className="text-[11px] font-medium text-muted-foreground">
                {entry.timestamp}
              </time>
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 pl-6 text-xs text-secondary-foreground">
              <span className="font-medium text-foreground">
                {entry.actorName}
              </span>
              {entry.actorRole && (
                <span className="text-muted-foreground">
                  ({entry.actorRole})
                </span>
              )}
            </div>

            {entry.comment && (
              <div className="mt-2 ml-6 flex items-start gap-2 rounded-sm border border-border bg-surface-subtle/70 px-3 py-2 text-xs text-foreground">
                <MessageSquareText
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <p className="leading-relaxed">{entry.comment}</p>
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
};
