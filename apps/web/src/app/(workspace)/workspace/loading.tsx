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

      {/* Operational Summary Strip Skeleton */}
      <div className="border-y border-border py-5 grid grid-cols-2 lg:grid-cols-4 gap-6">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>

      {/* Attention & Schedule Columns Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-6 space-y-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-24 w-full rounded-card" />
          <Skeleton className="h-24 w-full rounded-card" />
        </div>
        <div className="lg:col-span-6 space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-52 w-full rounded-card" />
        </div>
      </div>
    </div>
  );
}

