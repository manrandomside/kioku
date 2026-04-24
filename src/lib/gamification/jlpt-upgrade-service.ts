import { eq, asc } from "drizzle-orm";

import { db } from "@/db";
import { user } from "@/db/schema/user";
import { book, chapter } from "@/db/schema/content";
import { getQuizMasteredWordsAll } from "@/lib/progress/quiz-mastery";

export interface JlptUpgradeResult {
  upgraded: boolean;
  previousLevel: string;
  newLevel: string;
}

const NO_UPGRADE: JlptUpgradeResult = { upgraded: false, previousLevel: "", newLevel: "" };

export interface CheckAndUpgradeJlptOptions {
  // Pre-fetched user.jlptTarget. If omitted, function fetches it.
  currentLevel?: string | null;
  // Shared promise for quiz mastery map. If omitted, function fetches it.
  masteryMap?: Map<string, number> | Promise<Map<string, number>>;
}

/**
 * Check if user is eligible for JLPT level upgrade and perform upgrade if yes.
 *
 * Rules:
 * - N5 -> N4: All chapters of the N5 book must be fully mastered (quiz-based)
 * - N4 -> N3: Not implemented yet (no N3 content)
 *
 * Mastery is determined by quiz: vocabMastered >= vocabCount for every chapter.
 *
 * Accepts pre-fetched currentLevel and masteryMap to avoid duplicate DB queries
 * when the dashboard already has these values.
 */
export async function checkAndUpgradeJlpt(
  userId: string,
  options: CheckAndUpgradeJlptOptions = {}
): Promise<JlptUpgradeResult> {
  // 1. Get current JLPT target (skip fetch if caller provided it)
  let currentLevel: string | null | undefined = options.currentLevel;
  if (currentLevel === undefined) {
    const [userData] = await db
      .select({ jlptTarget: user.jlptTarget })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!userData) return NO_UPGRADE;
    currentLevel = userData.jlptTarget;
  }

  // Only process N5 -> N4 for now
  if (currentLevel !== "N5") {
    return { upgraded: false, previousLevel: currentLevel ?? "", newLevel: currentLevel ?? "" };
  }

  // 2. Find the N5 book and its chapters (parallel with mastery promise if provided)
  const [n5Book] = await db
    .select({ id: book.id })
    .from(book)
    .where(eq(book.jlptLevel, "N5"))
    .limit(1);

  if (!n5Book) return { upgraded: false, previousLevel: "N5", newLevel: "N5" };

  const bookChapters = await db
    .select({ id: chapter.id, vocabCount: chapter.vocabCount })
    .from(chapter)
    .where(eq(chapter.bookId, n5Book.id))
    .orderBy(asc(chapter.chapterNumber));

  if (bookChapters.length === 0) {
    return { upgraded: false, previousLevel: "N5", newLevel: "N5" };
  }

  // 3. Get quiz mastery map (reuse caller's promise/value if provided)
  const masteryMap =
    options.masteryMap !== undefined
      ? await options.masteryMap
      : await getQuizMasteredWordsAll(userId);

  // 4. Check if ALL chapters are fully mastered
  const allCompleted = bookChapters.every((c) => {
    if (c.vocabCount <= 0) return true;
    const mastered = masteryMap.get(c.id) ?? 0;
    return mastered >= c.vocabCount;
  });

  if (!allCompleted) {
    return { upgraded: false, previousLevel: "N5", newLevel: "N5" };
  }

  // 5. Upgrade to N4
  await db
    .update(user)
    .set({ jlptTarget: "N4" })
    .where(eq(user.id, userId));

  return { upgraded: true, previousLevel: "N5", newLevel: "N4" };
}
