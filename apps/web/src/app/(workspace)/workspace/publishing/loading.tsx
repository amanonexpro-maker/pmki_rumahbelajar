import { Skeleton } from "@/components/ui";

/**
 * Structured Publishing Workspace Skeleton Loading State (08: Skeleton sesuai struktur, anti-blank).
 */
export default function PublishingLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Memuat data publikasi"
      className="space-y-6"
    >
      {/* Page Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-full max-w-lg" />
        </div>
        <Skeleton className="h-10 w-36 rounded-control" />
      </div>

      {/* Stat Summary Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Skeleton className="h-16 rounded-card" />
        <Skeleton className="h-16 rounded-card" />
        <Skeleton className="h-16 rounded-card" />
      </div>

      <Skeleton className="h-10 w-full rounded-control" />

      {/* Publication Articles List Skeleton */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-card border border-border bg-surface p-5 space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1 max-w-xl">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-24 rounded-full" />
                </div>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </div>
              <Skeleton className="h-8 w-32 rounded-control" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

