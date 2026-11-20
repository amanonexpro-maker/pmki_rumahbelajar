import * as React from "react";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { Badge, type BadgeVariant } from "@/components/ui";
import { cn } from "@/lib/cn";

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

export function DecisionHistory({
  entries,
  emptyMessage = "Belum ada riwayat keputusan atau tinjauan yang tercatat.",
  className,
}: DecisionHistoryProps) {
  if (entries.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center gap-2.5 rounded-control border border-dashed border-border bg-surface-subtle/40 px-4 py-3.5 text-xs text-secondary-foreground",
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
      className={cn("space-y-2.5", className)}
      aria-label="Riwayat keputusan tata kelola"
    >
      {entries.map((entry) => {
        const isDanger = entry.decisionTone === "danger";
        const isSuccess = entry.decisionTone === "success";

        return (
          <li
            key={entry.id}
            className={cn(
              "rounded-control border p-3.5 transition-colors space-y-2",
              isDanger
                ? "border-danger/35 bg-danger-soft/35"
                : "border-border bg-surface"
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
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
                  <Clock
                    className="h-4 w-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                )}
                <span className="text-sm font-semibold text-foreground">
                  {entry.stageLabel}
                </span>
                <Badge variant={entry.decisionTone ?? "neutral"} size="sm">
                  {entry.decisionLabel}
                </Badge>
              </div>
              <time
                dateTime={entry.timestamp}
                className="text-[11px] text-muted-foreground font-mono"
              >
                {entry.timestamp}
              </time>
            </div>

            <p className="type-caption text-secondary-foreground">
              Oleh <strong className="text-foreground">{entry.actorName}</strong>
              {entry.actorRole ? ` · ${entry.actorRole}` : ""}
            </p>

            {entry.comment && (
              <p className="type-caption text-foreground bg-surface-subtle/60 rounded-sm px-3 py-2 border border-border-subtle leading-relaxed">
                {entry.comment}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}

