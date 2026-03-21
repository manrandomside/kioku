import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getChapterBySlug, getVocabularyForChapter } from "@/lib/queries/chapters";
import { VocabFlashcardSession } from "@/components/flashcard/vocab-flashcard-session";

interface VocabFlashcardPageProps {
  params: Promise<{ chapter: string }>;
}

export default async function VocabFlashcardPage({ params }: VocabFlashcardPageProps) {
  const { chapter: chapterSlug } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const chapterInfo = await getChapterBySlug(chapterSlug);
  if (!chapterInfo) notFound();

  const vocabList = await getVocabularyForChapter(chapterInfo.id, user.id);

  // Shuffle for varied practice
  const shuffled = [...vocabList].sort(() => Math.random() - 0.5);

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <VocabFlashcardSession
        cards={shuffled}
        chapterSlug={chapterInfo.slug}
        chapterNumber={chapterInfo.chapterNumber}
      />
    </div>
  );
}
