import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getChapterBySlug, getVocabularyForChapter } from "@/lib/queries/chapters";
import { ChapterDetailView } from "@/components/mnn/chapter-detail-view";

interface ChapterDetailPageProps {
  params: Promise<{ chapter: string }>;
}

export default async function ChapterDetailPage({ params }: ChapterDetailPageProps) {
  const { chapter: chapterSlug } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const chapterInfo = await getChapterBySlug(chapterSlug);
  if (!chapterInfo) notFound();

  const vocabList = await getVocabularyForChapter(chapterInfo.id, user?.id);

  return (
    <ChapterDetailView
      chapterNumber={chapterInfo.chapterNumber}
      chapterSlug={chapterInfo.slug}
      bookTitle={chapterInfo.bookTitle}
      jlptLevel={chapterInfo.jlptLevel}
      vocabList={vocabList}
    />
  );
}
