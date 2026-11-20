import React from 'react';
import { ArrowRight, Calendar, MapPin, Users } from 'lucide-react';
import { Badge, Button, Icon } from '../../ui/index.ts';
import type { DashboardUpcomingItem } from './dashboardData.ts';

export interface UpcomingListProps {
  items: DashboardUpcomingItem[];
  recentSessionsSummary: {
    latestDateLabel: string;
    recordedClassesCount: number;
    totalClassesCount: number;
    averagePresentRate: number | null;
    canOpenAttendance: boolean;
  };
  onNavigate: (destination: string) => void;
}

/**
 * UpcomingList (Section 7 of UI-UX-DESIGN-SYSTEM.md)
 * Shows structured Saturday learning sessions (15.00 - 17.15 WIB) with class, room,
 * participant count, and direct attendance action.
 */
export const UpcomingList: React.FC<UpcomingListProps> = ({
  items,
  recentSessionsSummary,
  onNavigate,
}) => {
  return (
    <section aria-labelledby="dashboard-upcoming-heading" className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 id="dashboard-upcoming-heading" className="type-h3 text-foreground">
            Jadwal kegiatan belajar
          </h2>
          <p className="type-caption text-secondary-foreground mt-0.5">
            Sesi rutin setiap Sabtu · 15.00 – 17.15 WIB di RAAL Griya Asih
          </p>
        </div>

        {recentSessionsSummary.canOpenAttendance && (
          <Button
            variant="link"
            size="sm"
            rightIcon={<Icon icon={ArrowRight} size="xs" />}
            onClick={() => onNavigate('attendance')}
          >
            Buku presensi
          </Button>
        )}
      </div>

      <div className="rounded-card bg-surface border border-border divide-y divide-border overflow-hidden">
        {items.slice(0, 5).map((item) => (
          <div
            key={item.id}
            className="px-4 sm:px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="w-24 shrink-0 pt-0.5">
                <span className="text-xs font-bold text-foreground tabular-nums block">
                  {item.timeRange}
                </span>
                <span className="text-[11px] text-muted-foreground">Sabtu WIB</span>
              </div>

              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">
                    {item.subjectName}
                  </p>
                  {item.isCurrentUserTeacher && (
                    <Badge variant="primary" size="sm">
                      Kelas Anda
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 type-caption text-secondary-foreground">
                  <span className="font-medium text-foreground">
                    {item.className}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1">
                    <Icon icon={Users} size="xs" className="text-muted-foreground" />
                    {item.enrolledCount} peserta
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1">
                    <Icon icon={MapPin} size="xs" className="text-muted-foreground" />
                    {item.roomName}
                  </span>
                </div>

                <p className="text-[11px] text-muted-foreground">
                  Pendamping: {item.teacherName}
                </p>
              </div>
            </div>

            {item.canManageAttendance && (
              <div className="shrink-0 sm:self-center pl-28 sm:pl-0">
                <Button
                  variant="ghost"
                  size="sm"
                  rightIcon={<Icon icon={ArrowRight} size="xs" />}
                  onClick={() => onNavigate('attendance')}
                  className="text-primary hover:text-primary-hover"
                >
                  Kelola presensi
                </Button>
              </div>
            )}
          </div>
        ))}

        {/* Footer context strip showing latest attendance completion status */}
        <div className="px-4 sm:px-5 py-3 bg-surface-subtle/60 flex flex-wrap items-center justify-between gap-2 type-caption text-secondary-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Icon icon={Calendar} size="xs" className="text-primary" />
            <span>
              Rekap sesi terakhir ({recentSessionsSummary.latestDateLabel}):{' '}
              <strong className="text-foreground">
                {recentSessionsSummary.recordedClassesCount} dari{' '}
                {recentSessionsSummary.totalClassesCount} kelas
              </strong>{' '}
              tercatat
            </span>
          </span>

          <Button
            variant="link"
            size="sm"
            onClick={() => onNavigate('organization')}
            className="text-xs"
          >
            Lihat seluruh rombel & pengajar
          </Button>
        </div>
      </div>
    </section>
  );
};

