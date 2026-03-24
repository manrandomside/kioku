import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
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

  const vocabList = await getVocabularyForChapter(chapterInfo.id, user.id);

  // Try AI-generated templates first, fallback to programmatic generation
  const templates = await getRandomTemplates(chapterInfo.id, 20);
  const questions =
    templates.length >= 10
      ? generateVocabQuizFromTemplates(templates, vocabList)
      : generateVocabQuiz(vocabList);

  return (
    <div className="mx-auto max-w-lg">
      <VocabQuizSession
        questions={questions}
        chapterId={chapterInfo.id}
        chapterSlug={chapterInfo.slug}
        chapterNumber={chapterInfo.chapterNumber}
      />
    </div>
  );
}
