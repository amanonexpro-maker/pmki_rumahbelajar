import { Skeleton } from "@/components/ui";

/**
 * Contextual Students Workspace Skeleton Loading State (08 & UI-UX §24).
 * Mirrors the exact DOM structure: PageHeader -> Search/Filters -> Mobile Recomposition Cards / Desktop Rows.
 */
export default function StudentsLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Memuat daftar peserta didik"
      className="space-y-6"
    >
      {/* Page Header Skeleton */}
      <div className="space-y-2 pb-2">
        <Skeleton className="h-3.5 w-32" />
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      {/* Filter and Action Bar Skeleton */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <Skeleton className="h-11 sm:h-10 w-full sm:w-72 rounded-control" />
        <div className="flex gap-2">
          <Skeleton className="h-11 sm:h-10 w-28 rounded-control" />
          <Skeleton className="h-11 sm:h-10 w-36 rounded-control" />
        </div>
      </div>

      {/* Structured Card List Skeleton (Matching 4-line Mobile / Desktop Table) */}
      <div className="rounded-card border border-border bg-surface divide-y divide-border-subtle overflow-hidden">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div key={idx} className="p-4 space-y-2.5">
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-5 w-48 max-w-[60%]" />
              <Skeleton className="h-5 w-24 rounded-pill" />
            </div>
            <Skeleton className="h-4 w-40 max-w-[45%]" />
            <div className="pt-1 flex justify-end">
              <Skeleton className="h-7 w-24 rounded-control" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

