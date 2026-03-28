import { Skeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Welcome + Level + Daily Goal */}
      <Skeleton className="h-32 w-full rounded-2xl" />

      {/* Quick actions */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Skeleton className="h-[62px] rounded-xl" />
        <Skeleton className="h-[62px] rounded-xl" />
        <Skeleton className="h-[62px] rounded-xl" />
      </div>

      {/* Streak + Due Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-[120px] rounded-2xl" />
        <Skeleton className="h-[120px] rounded-2xl" />
      </div>

      {/* Progres Belajar */}
      <Skeleton className="h-40 w-full rounded-2xl" />

      {/* Achievement Preview */}
      <Skeleton className="h-32 w-full rounded-2xl" />

      {/* Activity Heatmap */}
      <Skeleton className="h-48 w-full rounded-2xl" />
    </div>
  );
}
