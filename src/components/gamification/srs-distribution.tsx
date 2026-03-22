"use client";

interface SrsDistributionProps {
  newCount: number;
  learningCount: number;
  reviewCount: number;
  relearningCount: number;
  total: number;
}

const SRS_STAGES = [
  { key: "new", label: "New", color: "bg-[#9CA3AF]" },
  { key: "learning", label: "Learning", color: "bg-[#FBBF24]" },
  { key: "review", label: "Review", color: "bg-[#22C55E]" },
  { key: "relearning", label: "Relearning", color: "bg-[#F97316]" },
] as const;

export function SrsDistribution({
  newCount,
  learningCount,
  reviewCount,
  relearningCount,
  total,
}: SrsDistributionProps) {
  const counts: Record<string, number> = {
    new: newCount,
    learning: learningCount,
    review: reviewCount,
    relearning: relearningCount,
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Stacked bar */}
      {total > 0 ? (
        <div className="flex h-3 w-full overflow-hidden rounded-full">
          {SRS_STAGES.map((stage) => {
            const pct = (counts[stage.key] / total) * 100;
            if (pct === 0) return null;
            return (
              <div
                key={stage.key}
                className={`${stage.color} transition-all`}
                style={{ width: `${pct}%` }}
              />
            );
          })}
        </div>
      ) : (
        <div className="h-3 w-full rounded-full bg-muted" />
      )}

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2">
        {SRS_STAGES.map((stage) => (
          <div key={stage.key} className="flex items-center gap-2">
            <div className={`size-2.5 rounded-full ${stage.color}`} />
            <div className="flex flex-1 items-baseline justify-between gap-1">
              <span className="text-xs text-muted-foreground">
                {stage.label}
              </span>
              <span className="text-xs font-semibold">{counts[stage.key]}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <p className="text-center text-xs text-muted-foreground">
        {total.toLocaleString("id-ID")} kartu total
      </p>
    </div>
  );
}
