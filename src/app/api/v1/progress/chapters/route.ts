import { NextResponse } from "next/server";
import { eq, and, count } from "drizzle-orm";

import { db } from "@/db";
import { chapter } from "@/db/schema/content";
import { userChapterProgress } from "@/db/schema/gamification";
import { quizSession } from "@/db/schema/quiz";
import { createClient } from "@/lib/supabase/server";
import { getInternalUserId } from "@/lib/supabase/get-internal-user-id";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Belum login" } },
        { status: 401 }
      );
    }

    const userId = await getInternalUserId(user.id);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "User tidak ditemukan" } },
        { status: 404 }
      );
    }

    // Get all chapter progress for this user
    const progress = await db
      .select({
        chapterId: userChapterProgress.chapterId,
        chapterNumber: chapter.chapterNumber,
        chapterSlug: chapter.slug,
        vocabCount: chapter.vocabCount,
        vocabSeen: userChapterProgress.vocabSeen,
        vocabLearning: userChapterProgress.vocabLearning,
        vocabReview: userChapterProgress.vocabReview,
        completionPercent: userChapterProgress.completionPercent,
        bestQuizScore: userChapterProgress.bestQuizScore,
        updatedAt: userChapterProgress.updatedAt,
      })
      .from(userChapterProgress)
      .innerJoin(chapter, eq(userChapterProgress.chapterId, chapter.id))
      .where(eq(userChapterProgress.userId, userId));

    // Get quiz attempt counts per chapter
    const quizCounts = await db
      .select({
        chapterId: quizSession.chapterId,
        totalAttempts: count(),
      })
      .from(quizSession)
      .where(
        and(
          eq(quizSession.userId, userId),
          eq(quizSession.isCompleted, true)
        )
      )
      .groupBy(quizSession.chapterId);

    const quizCountMap = new Map(
      quizCounts.map((q) => [q.chapterId, Number(q.totalAttempts)])
    );

    const data = progress.map((p) => ({
      chapterId: p.chapterId,
      chapterNumber: p.chapterNumber,
      chapterSlug: p.chapterSlug,
      vocabCount: p.vocabCount,
      vocabSeen: p.vocabSeen,
      vocabLearning: p.vocabLearning,
      vocabReview: p.vocabReview,
      completionPercent: p.completionPercent,
      bestQuizScore: p.bestQuizScore,
      totalQuizAttempts: quizCountMap.get(p.chapterId) ?? 0,
      updatedAt: p.updatedAt,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[GET /api/v1/progress/chapters]", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal mengambil data progress" } },
      { status: 500 }
    );
  }
}
