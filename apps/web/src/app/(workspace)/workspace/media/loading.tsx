import { ListSkeleton } from "@/components/compositions";
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
      <ListSkeleton variant="media" count={4} />
    </div>
  );
}

