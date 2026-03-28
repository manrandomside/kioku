import { eq, and } from "drizzle-orm";

import { db } from "@/db";
import { kana } from "@/db/schema/content";
import { srsCard } from "@/db/schema/srs";
import { getQuizMasteredKanaIds } from "@/lib/progress/quiz-mastery";
import { getInternalUserId } from "@/lib/supabase/get-internal-user-id";

import type { KanaWithSrs } from "@/types/kana";

// Accepts Supabase auth ID, resolves to internal user ID for all queries
export async function getKanaWithSrsStatus(authUserId?: string): Promise<KanaWithSrs[]> {
  const selectFields = {
    id: kana.id,
    character: kana.character,
    romaji: kana.romaji,
    category: kana.category,
    rowGroup: kana.rowGroup,
    columnPosition: kana.columnPosition,
    audioUrl: kana.audioUrl,
  };

  const userId = authUserId ? await getInternalUserId(authUserId) : null;

  if (!userId) {
    const rows = await db
      .select(selectFields)
      .from(kana)
      .orderBy(kana.category, kana.rowGroup, kana.columnPosition);
    return rows.map((r) => ({
      ...r,
      srsStatus: null,
      isMastered: false,
    }));
  }

  // Fetch SRS status and quiz mastery in parallel
  const [rows, masteredKanaIds] = await Promise.all([
    db
      .select({
        ...selectFields,
        srsStatus: srsCard.status,
      })
      .from(kana)
      .leftJoin(
        srsCard,
        and(eq(srsCard.kanaId, kana.id), eq(srsCard.userId, userId))
      )
      .orderBy(kana.category, kana.rowGroup, kana.columnPosition),
    getQuizMasteredKanaIds(userId),
  ]);

  return rows.map((r) => ({
    ...r,
    isMastered: masteredKanaIds.has(r.id),
  }));
}
