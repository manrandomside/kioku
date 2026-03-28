import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Profile header */}
      <Skeleton className="h-48 w-full rounded-2xl" />

      {/* Settings card */}
      <Skeleton className="h-40 w-full rounded-2xl" />

      {/* Achievement link */}
      <Skeleton className="h-16 w-full rounded-xl" />

      {/* Sign out */}
      <Skeleton className="h-12 w-full rounded-xl" />
    </div>
  );
}
