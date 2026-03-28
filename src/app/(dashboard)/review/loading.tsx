import { Skeleton } from "@/components/ui/skeleton";

export default function ReviewLoading() {
  return (
    <div className="flex flex-col items-center gap-6 py-8">
      {/* Flashcard */}
      <Skeleton className="h-64 w-full max-w-md rounded-2xl" />

      {/* Rating buttons */}
      <div className="flex w-full max-w-md gap-3">
        <Skeleton className="h-12 flex-1 rounded-xl" />
        <Skeleton className="h-12 flex-1 rounded-xl" />
        <Skeleton className="h-12 flex-1 rounded-xl" />
        <Skeleton className="h-12 flex-1 rounded-xl" />
      </div>
    </div>
  );
}
