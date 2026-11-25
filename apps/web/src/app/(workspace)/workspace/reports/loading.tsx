import { ListSkeleton } from "@/components/compositions";
import { Skeleton } from "@/components/ui";

export default function ReportsLoading() {
  return (
    <div aria-busy="true" aria-label="Memuat daftar laporan" className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-full max-w-lg" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Skeleton className="h-16 rounded-card" />
        <Skeleton className="h-16 rounded-card" />
        <Skeleton className="h-16 rounded-card" />
      </div>
      <Skeleton className="h-10 w-full rounded-control" />
      <ListSkeleton variant="report" count={3} />
    </div>
  );
}

