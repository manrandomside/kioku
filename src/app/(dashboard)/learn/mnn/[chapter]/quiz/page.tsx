import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getChapterBySlug, getVocabularyForChapter } from "@/lib/queries/chapters";
import { generateVocabQuiz } from "@/lib/quiz/vocab-quiz-generator";
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

  const vocabList = await getVocabularyForChapter(chapterInfo.id, user.id);
  const questions = generateVocabQuiz(vocabList);

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <VocabQuizSession
        questions={questions}
        chapterId={chapterInfo.id}
        chapterSlug={chapterInfo.slug}
        chapterNumber={chapterInfo.chapterNumber}
      />
    </div>
  );
}
