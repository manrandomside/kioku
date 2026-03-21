import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getDueCards, getSrsStats } from "@/lib/queries/review";
import { ReviewSession } from "@/components/review/review-session";

export default async function ReviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [dueCards, stats] = await Promise.all([
    getDueCards(user.id),
    getSrsStats(user.id),
  ]);

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <ReviewSession dueCards={dueCards} stats={stats} />
    </div>
  );
}
