import { Skeleton } from "@/components/ui";

/**
 * Structured Media Workspace Skeleton Loading State (08: Skeleton sesuai struktur, anti-blank).
 */
export default function MediaLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Memuat dokumentasi media"
      className="space-y-6"
    >
      {/* Page Header Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-full max-w-lg" />
      </div>

      {/* Stat Summary Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Skeleton className="h-16 rounded-card" />
        <Skeleton className="h-16 rounded-card" />
        <Skeleton className="h-16 rounded-card" />
      </div>

      {/* Sticky Progress & Search Skeleton */}
      <div className="flex items-center justify-between border-b border-border py-2.5">
        <Skeleton className="h-6 w-36 rounded-full" />
        <Skeleton className="h-8 w-28 rounded-control" />
      </div>

      <Skeleton className="h-10 w-full rounded-control" />

      {/* 2-Column Cards Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-card border border-border bg-surface p-5 space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-32 rounded-full" />
              </div>
              <Skeleton className="w-full aspect-[4/5] sm:aspect-[16/10] rounded-control" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="pt-3 border-t border-border flex items-center justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-8 w-24 rounded-control" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

