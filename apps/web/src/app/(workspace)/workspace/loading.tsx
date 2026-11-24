import { SummaryStripSkeleton } from "@/components/patterns";
import { Skeleton } from "@/components/ui";

export function DashboardBodySkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Memuat data operasional ruang kerja"
      className="flex flex-col gap-8"
    >
      {/* Operational Summary Strip Skeleton (Mobile snap scroll friendly via pattern) */}
      <SummaryStripSkeleton />

      {/* Attention & Schedule Columns Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-6 space-y-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-28 w-full rounded-card border-l-4 border-warning/40" />
          <Skeleton className="h-28 w-full rounded-card border-l-4 border-warning/40" />
        </div>
        <div className="lg:col-span-6 space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-48 w-full rounded-card" />
        </div>
      </div>
    </div>
  );
}

/**
 * Structured Workspace Skeleton Loading State (`08`: Loading = skeleton sesuai struktur, bukan global spinner).
 */
export default function WorkspaceLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Memuat data ruang kerja"
      className="flex flex-col gap-8"
    >
      {/* Orientation Header Skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-8 w-80" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>

      <DashboardBodySkeleton />
    </div>
  );
}

