import { Skeleton } from "@/components/ui/skeleton";

export default function LearnLoading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-72" />
      </div>

      {/* Section: Metode Belajar */}
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-28" />
        <div className="grid gap-5 sm:grid-cols-3">
          <Skeleton className="min-h-[180px] rounded-2xl lg:min-h-[220px]" />
          <Skeleton className="min-h-[180px] rounded-2xl lg:min-h-[220px]" />
          <Skeleton className="min-h-[180px] rounded-2xl lg:min-h-[220px]" />
        </div>
      </div>

      {/* Section: Materi */}
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-16" />
        <div className="grid gap-5 lg:grid-cols-2">
          <Skeleton className="min-h-[180px] rounded-2xl lg:min-h-[220px]" />
          <Skeleton className="min-h-[180px] rounded-2xl lg:min-h-[220px]" />
        </div>
      </div>

      {/* Tips bar */}
      <Skeleton className="h-12 w-full rounded-xl" />
    </div>
  );
}
