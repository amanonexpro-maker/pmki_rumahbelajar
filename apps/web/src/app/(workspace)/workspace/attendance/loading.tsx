import { Skeleton } from "@/components/ui";

/**
 * Contextual Attendance Workspace Skeleton Loading State (08 & UI-UX §24).
 * Mirrors the exact DOM structure: PageHeader -> Class/Date Selectors -> Summary Bar -> Roster List.
 */
export default function AttendanceLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Memuat buku presensi"
      className="space-y-6"
    >
      {/* Page Header Skeleton */}
      <div className="space-y-2 pb-2">
        <Skeleton className="h-3.5 w-32" />
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>

      {/* Class and Date Selectors Skeleton */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Skeleton className="h-11 sm:h-10 w-full sm:w-64 rounded-control" />
        <Skeleton className="h-11 sm:h-10 w-full sm:w-48 rounded-control" />
      </div>

      {/* Roster Cards Skeleton */}
      <div className="rounded-card border border-border bg-surface divide-y divide-border-subtle overflow-hidden">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <Skeleton className="h-5 w-44" />
                <Skeleton className="h-3.5 w-28" />
              </div>
              <div className="grid grid-cols-2 sm:flex gap-2">
                <Skeleton className="h-11 sm:h-9 w-20 rounded-control" />
                <Skeleton className="h-11 sm:h-9 w-20 rounded-control" />
                <Skeleton className="h-11 sm:h-9 w-20 rounded-control" />
                <Skeleton className="h-11 sm:h-9 w-20 rounded-control" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

