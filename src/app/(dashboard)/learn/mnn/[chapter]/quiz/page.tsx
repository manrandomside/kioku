import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { createClient } from "@/lib/supabase/server";
import { getInternalUserId } from "@/lib/supabase/get-internal-user-id";
import { db } from "@/db";
import { user as userTable } from "@/db/schema/user";
import { getChapterBySlug, getVocabularyForChapter } from "@/lib/queries/chapters";
import { generateVocabQuiz } from "@/lib/quiz/vocab-quiz-generator";
import { generateVocabQuizFromTemplates } from "@/lib/quiz/template-quiz-generator";
import { getRandomTemplates } from "@/lib/queries/quiz-templates";
import { VocabQuizSession } from "@/components/quiz/vocab-quiz-session";

interface VocabQuizPageProps {
  params: Promise<{ chapter: string }>;
}

export default async function VocabQuizPage({ params }: VocabQuizPageProps) {
  const { chapter: chapterSlug } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const chapterInfo = await getChapterBySlug(chapterSlug);
  if (!chapterInfo) notFound();

  // Fetch display mode from DB for quiz generation filtering
  let displayMode: "kanji" | "kana" = "kanji";
  const internalUserId = await getInternalUserId(user.id);
  if (internalUserId) {
    const [row] = await db
      .select({ displayMode: userTable.displayMode })
      .from(userTable)
      .where(eq(userTable.id, internalUserId))
      .limit(1);
    if (row?.displayMode === "kana") {
      displayMode = "kana";
    }
  }

  const vocabList = await getVocabularyForChapter(chapterInfo.id, user.id);

  // Try AI-generated templates first, fallback to programmatic generation
  const templates = await getRandomTemplates(chapterInfo.id, 20);
  const questions =
    templates.length >= 10
      ? generateVocabQuizFromTemplates(templates, vocabList, displayMode)
      : generateVocabQuiz(vocabList, displayMode);

  // Build kanji→hiragana lookup for display mode toggle
  const kanjiToHiragana: Record<string, string> = {};
  for (const v of vocabList) {
    if (v.kanji) {
      kanjiToHiragana[v.kanji] = v.hiragana;
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <VocabQuizSession
        questions={questions}
        chapterId={chapterInfo.id}
        chapterSlug={chapterInfo.slug}
        chapterNumber={chapterInfo.chapterNumber}
        kanjiToHiragana={kanjiToHiragana}
        vocabList={vocabList}
      />
    </div>
  );
}
