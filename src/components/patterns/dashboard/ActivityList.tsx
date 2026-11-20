import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Badge, Button, Icon } from '../../ui/index.ts';
import type { DashboardActivityItem } from './dashboardData.ts';

export interface ActivityListProps {
  items: DashboardActivityItem[];
  canViewAuditLog: boolean;
  onNavigate: (destination: string) => void;
}

/**
 * ActivityList (Sections 8 & 18 of UI-UX-DESIGN-SYSTEM.md)
 * Restrained, human-readable recent activity list grouped by date.
 * Never exposes raw audit payloads, IP addresses, or confidential student details.
 */
export const ActivityList: React.FC<ActivityListProps> = ({
  items,
  canViewAuditLog,
  onNavigate,
}) => {
  if (items.length === 0) return null;

  // Group items by dateGroup while preserving chronological order
  const groups: { dateGroup: string; entries: DashboardActivityItem[] }[] = [];
  for (const item of items) {
    const existing = groups.find((g) => g.dateGroup === item.dateGroup);
    if (existing) {
      existing.entries.push(item);
    } else {
      groups.push({ dateGroup: item.dateGroup, entries: [item] });
    }
  }

  return (
    <section
      aria-labelledby="dashboard-activity-heading"
      className="pt-2 border-t border-border space-y-4"
    >
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <h2 id="dashboard-activity-heading" className="type-h3 text-foreground">
            Aktivitas terbaru
          </h2>
          <p className="type-caption text-secondary-foreground mt-0.5">
            Jejak kegiatan operasional unit pelayanan secara ringkas
          </p>
        </div>

        {canViewAuditLog && (
          <Button
            variant="link"
            size="sm"
            rightIcon={<Icon icon={ArrowRight} size="xs" />}
            onClick={() => onNavigate('audit-log')}
          >
            Log sistem lengkap
          </Button>
        )}
      </div>

      <div className="space-y-5">
        {groups.map((group) => (
          <div key={group.dateGroup} className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {group.dateGroup}
            </h3>

            <ul role="list" className="divide-y divide-border-subtle">
              {group.entries.map((entry) => (
                <li
                  key={entry.id}
                  className="py-2.5 flex items-start justify-between gap-4"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <Badge
                      variant={entry.categoryVariant}
                      size="sm"
                      dot
                      className="mt-0.5 shrink-0"
                    >
                      Aktivitas
                    </Badge>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {entry.title}
                      </p>
                      <p className="type-caption text-secondary-foreground">
                        {entry.context}
                      </p>
                    </div>
                  </div>

                  {entry.timeLabel && (
                    <span className="type-caption text-muted-foreground tabular-nums shrink-0">
                      {entry.timeLabel}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
};

