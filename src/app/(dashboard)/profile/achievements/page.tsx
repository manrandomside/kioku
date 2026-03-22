import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getInternalUserId } from "@/lib/supabase/get-internal-user-id";
import { getAllAchievementsWithStatus } from "@/lib/gamification/achievement-service";

import { AchievementsGrid } from "@/components/gamification/achievements-grid";

export const metadata = {
  title: "Achievement - Kioku",
};

export default async function AchievementsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const userId = await getInternalUserId(user.id);
  if (!userId) {
    redirect("/login");
  }

  const data = await getAllAchievementsWithStatus(userId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight lg:text-3xl">
          Achievement
        </h1>
        <p className="mt-1 text-muted-foreground">
          {data.unlockedCount}/{data.totalCount} achievement terbuka
        </p>
      </div>

      {/* Progress bar */}
      <div className="rounded-xl border border-border/50 bg-card p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Progres</span>
          <span className="font-bold text-primary">
            {Math.round((data.unlockedCount / data.totalCount) * 100)}%
          </span>
        </div>
        <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#248288] to-[#C2E959] transition-all duration-500"
            style={{
              width: `${Math.round((data.unlockedCount / data.totalCount) * 100)}%`,
            }}
          />
        </div>
      </div>

      <AchievementsGrid achievements={data.achievements} />
    </div>
  );
}
