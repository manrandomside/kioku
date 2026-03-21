import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getKanaWithSrsStatus } from "@/lib/queries/kana";
import { generateKanaQuiz } from "@/lib/quiz/kana-quiz-generator";
import { KanaQuizSession } from "@/components/quiz/kana-quiz-session";

interface QuizPageProps {
  searchParams: Promise<{ script?: string; filter?: string }>;
}

export default async function KanaQuizPage({ searchParams }: QuizPageProps) {
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

  const questions = generateKanaQuiz(filteredKana);

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <KanaQuizSession
        questions={questions}
        script={script}
        filter={filter}
        category={category}
      />
    </div>
  );
}
