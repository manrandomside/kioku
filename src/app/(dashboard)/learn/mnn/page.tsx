import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";
import { getBooksWithChapters } from "@/lib/queries/chapters";
import { getUserJlptTarget } from "@/lib/queries/dashboard";
import { MnnChapterView } from "@/components/mnn/mnn-chapter-view";

export const metadata: Metadata = { title: "Minna no Nihongo" };

export default async function MnnPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [books, jlptTarget] = await Promise.all([
    getBooksWithChapters(user?.id),
    user?.id ? getUserJlptTarget(user.id) : Promise.resolve("N5"),
  ]);

  return <MnnChapterView books={books} jlptTarget={jlptTarget} />;
}
