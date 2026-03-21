import { createClient } from "@/lib/supabase/server";
import { getBooksWithChapters } from "@/lib/queries/chapters";
import { MnnChapterView } from "@/components/mnn/mnn-chapter-view";

export default async function MnnPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const books = await getBooksWithChapters(user?.id);

  return <MnnChapterView books={books} />;
}
