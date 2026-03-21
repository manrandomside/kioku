"use client";

import { KanaCell, KanaEmptyCell } from "@/components/kana/kana-cell";
import {
  getRowLabel,
  BASIC_ROW_ORDER,
  DAKUTEN_ROW_ORDER,
  COMBO_ROW_ORDER,
} from "@/types/kana";

import type { KanaWithSrs } from "@/types/kana";

interface KanaGridProps {
  kanaList: KanaWithSrs[];
  filter: "basic" | "dakuten" | "combo";
  onCellClick: (kana: KanaWithSrs) => void;
}

export function KanaGrid({ kanaList, filter, onCellClick }: KanaGridProps) {
  const rowOrder =
    filter === "basic"
      ? BASIC_ROW_ORDER
      : filter === "dakuten"
        ? DAKUTEN_ROW_ORDER
        : COMBO_ROW_ORDER;

  const maxCols = filter === "combo" ? 3 : 5;

  // Group kana by rowGroup
  const grouped = new Map<string, KanaWithSrs[]>();
  for (const k of kanaList) {
    const existing = grouped.get(k.rowGroup) ?? [];
    existing.push(k);
    grouped.set(k.rowGroup, existing);
  }

  return (
    <div className="flex flex-col gap-1.5">
      {rowOrder.map((rowGroup) => {
        const chars = grouped.get(rowGroup) ?? [];
        if (chars.length === 0) return null;

        // Build cells array with gaps for missing positions
        const cells: (KanaWithSrs | null)[] = Array(maxCols).fill(null);
        for (const ch of chars) {
          const idx =
            filter === "combo"
              ? ch.columnPosition - 1
              : ch.columnPosition - 1;
          if (idx >= 0 && idx < maxCols) {
            cells[idx] = ch;
          }
        }

        return (
          <div key={rowGroup} className="flex items-center gap-1.5">
            <span className="w-8 shrink-0 text-right font-mono text-[10px] font-medium text-muted-foreground sm:w-10 sm:text-xs">
              {getRowLabel(rowGroup)}
            </span>
            <div
              className="grid flex-1 gap-1.5"
              style={{
                gridTemplateColumns: `repeat(${maxCols}, minmax(0, 1fr))`,
              }}
            >
              {cells.map((cell, i) =>
                cell ? (
                  <KanaCell
                    key={cell.id}
                    kana={cell}
                    onClick={onCellClick}
                  />
                ) : (
                  <KanaEmptyCell key={`empty-${rowGroup}-${i}`} />
                )
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
