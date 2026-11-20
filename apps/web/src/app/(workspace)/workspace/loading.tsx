import { Skeleton } from "@/components/ui";

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

      {/* Operational Summary Strip Skeleton (Mobile snap scroll friendly) */}
      <div className="border-y border-border py-4 sm:py-5 flex overflow-x-auto gap-3 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-6 sm:divide-x sm:divide-border sm:pb-0">
        <Skeleton className="min-w-[78%] sm:min-w-0 h-20 sm:h-16 rounded-card sm:rounded-none" />
        <Skeleton className="min-w-[78%] sm:min-w-0 h-20 sm:h-16 rounded-card sm:rounded-none" />
        <Skeleton className="min-w-[78%] sm:min-w-0 h-20 sm:h-16 rounded-card sm:rounded-none" />
        <Skeleton className="min-w-[78%] sm:min-w-0 h-20 sm:h-16 rounded-card sm:rounded-none" />
      </div>

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

