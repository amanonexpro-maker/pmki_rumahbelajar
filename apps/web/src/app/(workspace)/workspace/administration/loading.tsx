import { Skeleton } from "@/components/ui";

export default function AdministrationLoading() {
  return (
    <div aria-busy="true" className="space-y-6">
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
      <div className="rounded-card border border-border bg-surface p-6 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-2 border-b border-border-subtle last:border-none">
            <div className="space-y-1.5 flex-1 max-w-md">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-8 w-24 rounded-control" />
          </div>
        ))}
      </div>
    </div>
  );
}

