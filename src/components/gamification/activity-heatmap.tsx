"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { CalendarDays } from "lucide-react";

interface DayActivity {
  date: string;
  xpEarned: number;
  reviewsCount: number;
  quizCount: number;
}

interface HeatmapResponse {
  success: boolean;
  data: {
    activities: DayActivity[];
    startDate: string;
    endDate: string;
  };
}

// Intensity levels based on XP earned (6 levels)
function getIntensityLevel(xp: number): number {
  if (xp === 0) return 0;
  if (xp < 250) return 1;
  if (xp < 500) return 2;
  if (xp < 750) return 3;
  if (xp < 1000) return 4;
  return 5;
}

// Fill colors for SVG rects (light / dark variants) — 6 levels
const FILLS_LIGHT = ["#E5E7EB", "#B5D5D7", "#7BBEC2", "#3D9CA2", "#248288", "#C2E959"];
const FILLS_DARK = ["#161B22", "#0F3538", "#145054", "#1A6B70", "#248288", "#C2E959"];

// Legend swatch Tailwind classes (HTML divs support dark: prefix) — 6 levels
const LEGEND_COLORS = [
  "bg-[#E5E7EB] dark:bg-[#161B22]",
  "bg-[#B5D5D7] dark:bg-[#0F3538]",
  "bg-[#7BBEC2] dark:bg-[#145054]",
  "bg-[#3D9CA2] dark:bg-[#1A6B70]",
  "bg-[#248288] dark:bg-[#248288]",
  "bg-[#C2E959] dark:bg-[#C2E959]",
];

const LEGEND_LABELS = [
  "0 XP",
  "1 - 249 XP",
  "250 - 499 XP",
  "500 - 749 XP",
  "750 - 999 XP",
  "1000+ XP",
];

// SVG text fill for labels
const LABEL_FILL_LIGHT = "#6B7280";
const LABEL_FILL_DARK = "#8B949E";

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

const DAY_LABELS = [
  { index: 1, label: "Sen" },
  { index: 3, label: "Rab" },
  { index: 5, label: "Jum" },
];

interface HeatmapDay {
  date: string;
  xp: number;
  reviews: number;
  quizzes: number;
  dayOfWeek: number;
  weekIndex: number;
}

function buildHeatmapGrid(activities: DayActivity[]) {
  const activityMap = new Map<string, DayActivity>();
  for (const a of activities) {
    activityMap.set(a.date, a);
  }

  const today = new Date();
  const grid: HeatmapDay[] = [];

  // Go back 364 days, align to nearest Sunday
  const rawStart = new Date(today);
  rawStart.setDate(rawStart.getDate() - 364);
  rawStart.setDate(rawStart.getDate() - rawStart.getDay());

  const cursor = new Date(rawStart);
  let weekIndex = 0;
  let prevWeekDay = -1;
  let activeDays = 0;

  const monthPositions: { label: string; weekIndex: number }[] = [];
  let lastMonthLabel = "";

  while (cursor <= today) {
    const dateStr = cursor.toISOString().split("T")[0];
    const dayOfWeek = cursor.getDay();

    if (dayOfWeek === 0 && prevWeekDay !== -1) {
      weekIndex++;
    }
    prevWeekDay = dayOfWeek;

    const monthLabel = MONTH_LABELS[cursor.getMonth()];
    if (cursor.getDate() <= 7 && monthLabel !== lastMonthLabel) {
      monthPositions.push({ label: monthLabel, weekIndex });
      lastMonthLabel = monthLabel;
    }

    const activity = activityMap.get(dateStr);
    const xp = activity?.xpEarned ?? 0;
    if (xp > 0) activeDays++;

    grid.push({
      date: dateStr,
      xp,
      reviews: activity?.reviewsCount ?? 0,
      quizzes: activity?.quizCount ?? 0,
      dayOfWeek,
      weekIndex,
    });

    cursor.setDate(cursor.getDate() + 1);
  }

  return { grid, totalWeeks: weekIndex + 1, activeDays, monthPositions };
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function useIsDark() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const html = document.documentElement;
    setIsDark(html.classList.contains("dark"));

    const observer = new MutationObserver(() => {
      setIsDark(html.classList.contains("dark"));
    });
    observer.observe(html, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}

export function ActivityHeatmap() {
  const [activities, setActivities] = useState<DayActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [legendTooltip, setLegendTooltip] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    day: HeatmapDay;
    flipBelow: boolean;
    hAlign: "left" | "center" | "right";
  } | null>(null);
  const isDark = useIsDark();

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/v1/gamification/heatmap");
        if (!res.ok) return;
        const json: HeatmapResponse = await res.json();
        if (json.success) {
          setActivities(json.data.activities);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const { grid, totalWeeks, activeDays, monthPositions } = useMemo(
    () => buildHeatmapGrid(activities),
    [activities]
  );

  const fills = isDark ? FILLS_DARK : FILLS_LIGHT;
  const labelFill = isDark ? LABEL_FILL_DARK : LABEL_FILL_LIGHT;

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<SVGRectElement>, day: HeatmapDay, cellSize: number) => {
      const rect = (e.target as SVGRectElement).getBoundingClientRect();
      const parent = (e.target as SVGRectElement).closest("[data-heatmap]")!.getBoundingClientRect();
      const flipBelow = day.dayOfWeek <= 1;
      const viewportX = rect.left + cellSize / 2;
      const vw = window.innerWidth;
      const hAlign: "left" | "center" | "right" =
        viewportX < vw * 0.33 ? "left" : viewportX > vw * 0.66 ? "right" : "center";
      setTooltip({
        x: rect.left - parent.left + cellSize / 2,
        y: flipBelow
          ? rect.bottom - parent.top + 8
          : rect.top - parent.top - 8,
        day,
        flipBelow,
        hAlign,
      });
    },
    []
  );

  const clearTooltip = useCallback(() => setTooltip(null), []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card p-5">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-4.5 text-[#248288]" />
          <h3 className="text-sm font-semibold">Aktivitas Belajar</h3>
        </div>
        <div className="mt-4 flex h-[140px] items-center justify-center">
          <p className="text-sm text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }

  const cellSize = 12;
  const cellGap = 2;
  const step = cellSize + cellGap;
  const dayLabelWidth = 28;
  const monthLabelHeight = 16;
  const svgWidth = dayLabelWidth + totalWeeks * step;
  const svgHeight = monthLabelHeight + 7 * step;

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-3 sm:p-5">
      <div className="flex items-center gap-2">
        <CalendarDays className="size-4.5 text-[#248288]" />
        <h3 className="text-sm font-semibold">Aktivitas Belajar</h3>
      </div>

      {/* Heatmap grid - horizontally scrollable on mobile */}
      <div className="mt-4 overflow-x-auto overflow-y-visible pt-10">
        <div
          className="relative"
          data-heatmap
          style={{ minWidth: svgWidth }}
          onMouseLeave={clearTooltip}
        >
          <svg width={svgWidth} height={svgHeight} className="block">
            {/* Month labels */}
            {monthPositions.map((mp, i) => (
              <text
                key={`month-${i}`}
                x={dayLabelWidth + mp.weekIndex * step}
                y={12}
                fill={labelFill}
                fontSize={10}
              >
                {mp.label}
              </text>
            ))}

            {/* Day labels */}
            {DAY_LABELS.map((d) => (
              <text
                key={`day-${d.index}`}
                x={0}
                y={monthLabelHeight + d.index * step + cellSize - 2}
                fill={labelFill}
                fontSize={10}
              >
                {d.label}
              </text>
            ))}

            {/* Day cells */}
            {grid.map((day) => {
              const level = getIntensityLevel(day.xp);
              const x = dayLabelWidth + day.weekIndex * step;
              const y = monthLabelHeight + day.dayOfWeek * step;

              return (
                <rect
                  key={day.date}
                  x={x}
                  y={y}
                  width={cellSize}
                  height={cellSize}
                  rx={2}
                  fill={fills[level]}
                  stroke={level === 0 ? (isDark ? "#30363D" : "#D1D5DB") : "none"}
                  strokeWidth={level === 0 ? 0.5 : 0}
                  className="cursor-pointer"
                  onMouseEnter={(e) => handleMouseEnter(e, day, cellSize)}
                  onMouseLeave={clearTooltip}
                  onClick={(e) => handleMouseEnter(e as unknown as React.MouseEvent<SVGRectElement>, day, cellSize)}
                />
              );
            })}
          </svg>

          {/* Tooltip */}
          {tooltip && (() => {
            const yTransform = tooltip.flipBelow ? "" : "translateY(-100%)";
            const xTransform =
              tooltip.hAlign === "left" ? "" :
              tooltip.hAlign === "right" ? "translateX(-100%)" :
              "translateX(-50%)";
            return (
              <div
                className="pointer-events-none absolute z-10 w-max rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md"
                style={{
                  left: tooltip.x,
                  top: tooltip.y,
                  transform: `${xTransform} ${yTransform}`.trim() || undefined,
                }}
              >
                <p className="font-medium">{formatDate(tooltip.day.date)}</p>
                <p className="mt-0.5 text-muted-foreground">
                  {tooltip.day.xp} XP
                  {tooltip.day.reviews > 0 && ` | ${tooltip.day.reviews} review`}
                  {tooltip.day.quizzes > 0 && ` | ${tooltip.day.quizzes} quiz`}
                </p>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Legend + Summary */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-1.5 sm:gap-2">
        <p className="text-[11px] text-muted-foreground sm:text-xs">
          {activeDays} hari aktif dalam 365 hari terakhir
        </p>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span>Sedikit</span>
          {LEGEND_COLORS.map((color, i) => (
            <button
              key={i}
              type="button"
              className="relative"
              onClick={() => setLegendTooltip(legendTooltip === i ? null : i)}
              onMouseEnter={() => setLegendTooltip(i)}
              onMouseLeave={() => setLegendTooltip(null)}
            >
              <div className={`size-2.5 rounded-sm ${color} cursor-pointer`} />
              {legendTooltip === i && (
                <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 w-max -translate-x-1/2 rounded-md border border-border bg-popover px-2 py-1 text-[10px] font-medium text-popover-foreground shadow-md">
                  {LEGEND_LABELS[i]}
                </div>
              )}
            </button>
          ))}
          <span>Banyak</span>
        </div>
      </div>
    </div>
  );
}
