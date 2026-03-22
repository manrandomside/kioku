import { eq } from "drizzle-orm";

import { db } from "@/db";
import { user } from "@/db/schema/user";

// Resolve Supabase auth UUID to internal user.id
// All data tables (srs_card, user_gamification, quiz_session, etc.) use
// the internal user.id as foreign key, NOT the Supabase auth UUID.
export async function getInternalUserId(authId: string): Promise<string | null> {
  const [row] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.supabaseAuthId, authId))
    .limit(1);

  return row?.id ?? null;
}
