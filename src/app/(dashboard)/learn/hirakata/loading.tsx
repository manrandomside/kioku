import { Skeleton } from "@/components/ui/skeleton";

export default function HirakataLoading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-72" />
      </div>

      {/* Tabs */}
      <Skeleton className="h-10 w-full rounded-lg sm:w-80" />

      {/* Progress bar */}
      <Skeleton className="h-3 w-full rounded-full" />

      {/* Filter pills */}
      <div className="flex gap-2">
        <Skeleton className="h-9 w-20 rounded-full" />
        <Skeleton className="h-9 w-24 rounded-full" />
        <Skeleton className="h-9 w-20 rounded-full" />
      </div>

      {/* Kana grid */}
      <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10">
        {Array.from({ length: 20 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
