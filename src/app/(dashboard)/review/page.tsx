import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getInternalUserId } from "@/lib/supabase/get-internal-user-id";
import { getDueCards, getSrsStats } from "@/lib/queries/review";
import { ReviewSession } from "@/components/review/review-session";

export default async function ReviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const userId = await getInternalUserId(user.id);
  if (!userId) redirect("/login");

  const [dueCards, stats] = await Promise.all([
    getDueCards(userId),
    getSrsStats(userId),
  ]);

  return (
    <div className="mx-auto max-w-lg">
      <ReviewSession dueCards={dueCards} stats={stats} />
    </div>
  );
}
