import { NextResponse, type NextRequest } from "next/server";
import { or, ilike, eq, asc } from "drizzle-orm";

import { db } from "@/db";
import { vocabulary, chapter } from "@/db/schema/content";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const query = searchParams.get("q")?.trim();
    const limitParam = searchParams.get("limit");
    const limit = Math.min(Math.max(parseInt(limitParam ?? "20", 10) || 20, 1), 50);

    if (!query || query.length < 1) {
      return NextResponse.json({ success: true, data: [] });
    }

    const pattern = `%${query}%`;

    const results = await db
      .select({
        id: vocabulary.id,
        kanji: vocabulary.kanji,
        hiragana: vocabulary.hiragana,
        romaji: vocabulary.romaji,
        meaningId: vocabulary.meaningId,
        meaningEn: vocabulary.meaningEn,
        wordType: vocabulary.wordType,
        jlptLevel: vocabulary.jlptLevel,
        audioUrl: vocabulary.audioUrl,
        chapterId: vocabulary.chapterId,
        chapterNumber: chapter.chapterNumber,
        chapterSlug: chapter.slug,
      })
      .from(vocabulary)
      .innerJoin(chapter, eq(vocabulary.chapterId, chapter.id))
      .where(
        or(
          ilike(vocabulary.hiragana, pattern),
          ilike(vocabulary.romaji, pattern),
          ilike(vocabulary.meaningId, pattern),
          ilike(vocabulary.meaningEn, pattern),
          ilike(vocabulary.kanji, pattern)
        )
      )
      .orderBy(asc(chapter.chapterNumber), asc(vocabulary.sortOrder))
      .limit(limit);

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error("[GET /api/v1/vocabulary/search]", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal mencari kosakata" } },
      { status: 500 }
    );
  }
}
