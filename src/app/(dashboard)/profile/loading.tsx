import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Profile Header Card */}
      <div className="flex flex-col items-center gap-5 rounded-2xl bg-muted/30 p-6 sm:p-8">
        <Skeleton className="size-24 rounded-full sm:size-28" />
        <div className="flex flex-col items-center gap-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-52" />
          <Skeleton className="mt-1 h-6 w-28 rounded-full" />
        </div>
      </div>

      {/* Statistik Belajar */}
      <div className="flex flex-col gap-4">
        <Skeleton className="h-4 w-32" />
        {/* 3 highlight cards */}
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={`hl-${i}`} className="h-28 rounded-xl sm:h-32" />
          ))}
        </div>
        {/* 6 detail cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={`dt-${i}`} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>

      {/* Settings (Mode Tampilan + Auto-play + Target Harian) */}
      <div className="overflow-hidden rounded-2xl border border-border/50">
        <div className="flex items-center justify-between p-5">
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-8 w-32 rounded-lg" />
        </div>
        <div className="h-px bg-border/50" />
        <div className="flex items-center justify-between p-5">
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-44" />
          </div>
          <Skeleton className="h-5 w-10 rounded-full" />
        </div>
        <div className="h-px bg-border/50" />
        <div className="flex items-center justify-between p-5">
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-40" />
          </div>
          <div className="flex gap-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={`goal-${i}`} className="size-8 rounded-lg" />
            ))}
          </div>
        </div>
      </div>

      {/* Keamanan */}
      <div className="rounded-xl border border-border/50 px-4 py-3.5">
        <div className="flex items-center gap-2">
          <Skeleton className="size-4 rounded" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-56" />
          </div>
        </div>
      </div>

      {/* Achievement */}
      <Skeleton className="h-14 w-full rounded-xl" />

      {/* Zona Bahaya */}
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3.5">
        <div className="flex items-center gap-2">
          <Skeleton className="size-4 rounded" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-64" />
          </div>
        </div>
      </div>

      {/* Keluar */}
      <Skeleton className="h-11 w-full rounded-xl bg-destructive/10" />

      {/* Footer */}
      <div className="flex justify-center pb-2">
        <Skeleton className="h-3 w-60" />
      </div>
    </div>
  );
}
