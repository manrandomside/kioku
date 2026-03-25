import { eq, sql, and, or, gt, isNull } from "drizzle-orm";

import { db } from "@/db";
import { aiResponseCache } from "@/db/schema/ai";

const CACHE_TTL_DAYS = 7;

// SHA-256 hash of prompt string
export async function hashPrompt(prompt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(prompt);
  const buffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(buffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Look up cached response by prompt hash. Returns null on miss or expiry.
export async function getCachedResponse(
  promptHash: string
): Promise<string | null> {
  try {
    const rows = await db
      .select({
        id: aiResponseCache.id,
        responseText: aiResponseCache.responseText,
        expiresAt: aiResponseCache.expiresAt,
      })
      .from(aiResponseCache)
      .where(
        and(
          eq(aiResponseCache.promptHash, promptHash),
          or(
            isNull(aiResponseCache.expiresAt),
            gt(aiResponseCache.expiresAt, sql`now()`)
          )
        )
      )
      .limit(1);

    if (rows.length === 0) return null;

    // Increment hit count in background (fire-and-forget)
    db.update(aiResponseCache)
      .set({ hitCount: sql`${aiResponseCache.hitCount} + 1` })
      .where(eq(aiResponseCache.id, rows[0].id))
      .then(() => {})
      .catch(() => {});

    return rows[0].responseText;
  } catch (error) {
    console.warn("[AI Cache] Read failed:", error);
    return null;
  }
}

export interface SetCacheOptions {
  permanent?: boolean;
}

// Store a response in cache. Silently fails on error.
export async function setCacheResponse(
  prompt: string,
  response: string,
  provider: string,
  options?: SetCacheOptions
): Promise<void> {
  try {
    const promptHash = await hashPrompt(prompt);
    const expiresAt = options?.permanent
      ? null
      : sql`now() + interval '${sql.raw(String(CACHE_TTL_DAYS))} days'`;

    await db
      .insert(aiResponseCache)
      .values({
        promptHash,
        responseText: response,
        provider,
        expiresAt,
      })
      .onConflictDoUpdate({
        target: aiResponseCache.promptHash,
        set: {
          responseText: response,
          provider,
          hitCount: sql`${aiResponseCache.hitCount} + 1`,
          expiresAt,
        },
      });
  } catch (error) {
    console.warn("[AI Cache] Write failed:", error);
  }
}

// Remove expired cache entries
export async function cleanExpiredCache(): Promise<number> {
  const result = await db
    .delete(aiResponseCache)
    .where(
      and(
        sql`${aiResponseCache.expiresAt} IS NOT NULL`,
        sql`${aiResponseCache.expiresAt} < now()`
      )
    )
    .returning({ id: aiResponseCache.id });

  return result.length;
}
