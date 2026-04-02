import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Sidebar skeleton */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <Skeleton className="h-[420px] w-full rounded-2xl" />
        </aside>
        {/* Main content skeleton */}
        <div className="min-w-0 flex-1 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </div>
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
