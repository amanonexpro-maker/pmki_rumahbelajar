"use client";

import * as React from "react";
import { History } from "lucide-react";
import { Badge, Icon } from "@/components/ui";
import { formatDateTimeID } from "@/utils/date-formatter";

export interface AuditEntrySummary {
  id: string;
  action: string;
  description: string;
  createdAt: string;
}

export interface StudentAuditTabProps {
  auditLogs: AuditEntrySummary[];
}

export function StudentAuditTab({ auditLogs }: StudentAuditTabProps) {
  return (
    <section className="rounded-control border border-border bg-surface p-4 sm:p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Icon icon={History} size="sm" className="text-primary" />
        <h3 className="text-sm font-semibold text-foreground">
          Riwayat audit peserta didik
        </h3>
      </div>
      {auditLogs.length > 0 ? (
        <ul className="divide-y divide-border-subtle text-xs">
          {auditLogs.map((log) => (
            <li key={log.id} className="py-3 space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge variant="neutral" size="sm">
                  {log.action}
                </Badge>
                <span className="font-mono text-muted-foreground">
                  {formatDateTimeID(log.createdAt)}
                </span>
              </div>
              <p className="text-foreground">{log.description}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">
          Belum ada catatan riwayat audit untuk peserta didik ini.
        </p>
      )}
    </section>
  );
}

