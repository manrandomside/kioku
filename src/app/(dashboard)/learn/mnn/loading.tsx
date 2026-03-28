import { Skeleton } from "@/components/ui/skeleton";

export default function MnnLoading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-64" />
      </div>

      {/* Book toggle */}
      <Skeleton className="h-9 w-full rounded-lg sm:w-72" />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Skeleton className="h-[68px] rounded-xl" />
        <Skeleton className="h-[68px] rounded-xl" />
        <Skeleton className="h-[68px] rounded-xl" />
        <Skeleton className="h-[68px] rounded-xl" />
      </div>

      {/* Progress bar */}
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-2 w-full rounded-full" />
      </div>

      {/* Chapter grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
