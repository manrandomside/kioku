import { Skeleton } from "@/components/ui/skeleton";

export default function LearnLoading() {
  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-5 w-80" />
      </div>

      {/* Hero cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-[220px] rounded-2xl" />
        <Skeleton className="h-[220px] rounded-2xl" />
      </div>
    </div>
  );
}
