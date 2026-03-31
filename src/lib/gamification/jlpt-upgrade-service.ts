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

/**
 * Check if user is eligible for JLPT level upgrade and perform upgrade if yes.
 *
 * Rules:
 * - N5 -> N4: All chapters of the N5 book must be fully mastered (quiz-based)
 * - N4 -> N3: Not implemented yet (no N3 content)
 *
 * Mastery is determined by quiz: vocabMastered >= vocabCount for every chapter.
 */
export async function checkAndUpgradeJlpt(userId: string): Promise<JlptUpgradeResult> {
  // 1. Get current JLPT target
  const [userData] = await db
    .select({ jlptTarget: user.jlptTarget })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!userData) return NO_UPGRADE;

  const currentLevel = userData.jlptTarget;

  // Only process N5 -> N4 for now
  if (currentLevel !== "N5") {
    return { upgraded: false, previousLevel: currentLevel ?? "", newLevel: currentLevel ?? "" };
  }

  // 2. Find the N5 book and its chapters
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

  // 3. Get quiz mastery map for user
  const masteryMap = await getQuizMasteredWordsAll(userId);

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
