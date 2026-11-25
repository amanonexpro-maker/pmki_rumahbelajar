import { ListSkeleton } from "@/components/compositions";
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
      <ListSkeleton variant="publication" count={3} />
    </div>
  );
}

