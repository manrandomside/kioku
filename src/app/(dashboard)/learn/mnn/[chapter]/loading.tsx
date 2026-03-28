import { Skeleton } from "@/components/ui/skeleton";

export default function ChapterDetailLoading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Back link */}
      <Skeleton className="h-5 w-40" />

      {/* Heading */}
      <div className="flex flex-col gap-2">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-5 w-48" />
      </div>

      {/* Progress card */}
      <Skeleton className="h-24 w-full rounded-2xl" />

      {/* Action buttons */}
      <div className="flex gap-3">
        <Skeleton className="h-12 flex-1 rounded-xl" />
        <Skeleton className="h-12 flex-1 rounded-xl" />
      </div>

      {/* Vocab list */}
      <div className="flex flex-col gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
