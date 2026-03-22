import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getKanaWithSrsStatus } from "@/lib/queries/kana";
import { FlashcardSession } from "@/components/flashcard/flashcard-session";

interface FlashcardPageProps {
  searchParams: Promise<{ script?: string; filter?: string }>;
}

export default async function KanaFlashcardPage({ searchParams }: FlashcardPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const params = await searchParams;
  const script = params.script ?? "hiragana";
  const filter = params.filter ?? "basic";
  const category = `${script}_${filter}`;

  const allKana = await getKanaWithSrsStatus(user.id);
  const filteredKana = allKana.filter((k) => k.category === category);

  // Shuffle cards for varied practice
  const shuffled = [...filteredKana].sort(() => Math.random() - 0.5);

  return (
    <div className="mx-auto max-w-lg">
      <FlashcardSession
        cards={shuffled}
        script={script}
        filter={filter}
      />
    </div>
  );
}
