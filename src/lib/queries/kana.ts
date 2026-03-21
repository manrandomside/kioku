import { eq, and } from "drizzle-orm";

import { db } from "@/db";
import { kana } from "@/db/schema/content";
import { srsCard } from "@/db/schema/srs";

import type { KanaWithSrs } from "@/types/kana";

export async function getKanaWithSrsStatus(userId?: string): Promise<KanaWithSrs[]> {
  const selectFields = {
    id: kana.id,
    character: kana.character,
    romaji: kana.romaji,
    category: kana.category,
    rowGroup: kana.rowGroup,
    columnPosition: kana.columnPosition,
    audioUrl: kana.audioUrl,
  };

  if (!userId) {
    const rows = await db
      .select(selectFields)
      .from(kana)
      .orderBy(kana.category, kana.rowGroup, kana.columnPosition);
    return rows.map((r) => ({
      ...r,
      srsStatus: null,
    }));
  }

  const rows = await db
    .select({
      ...selectFields,
      srsStatus: srsCard.status,
    })
    .from(kana)
    .leftJoin(
      srsCard,
      and(eq(srsCard.kanaId, kana.id), eq(srsCard.userId, userId))
    )
    .orderBy(kana.category, kana.rowGroup, kana.columnPosition);

  return rows;
}
