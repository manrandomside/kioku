import { z } from "zod";

// Validate AI provider environment variables with Zod.
// Missing keys are allowed — the provider is simply skipped in the waterfall.
const aiEnvSchema = z.object({
  GEMINI_API_KEY: z.string().min(1).optional(),
  GROQ_API_KEY: z.string().min(1).optional(),
  OPENROUTER_API_KEY: z.string().min(1).optional(),
});

export type AIEnv = z.infer<typeof aiEnvSchema>;

let cachedEnv: AIEnv | null = null;

export function getAIEnv(): AIEnv {
  if (cachedEnv) return cachedEnv;

  cachedEnv = aiEnvSchema.parse({
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || undefined,
    GROQ_API_KEY: process.env.GROQ_API_KEY || undefined,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || undefined,
  });

  return cachedEnv;
}

// Timeout per provider in milliseconds
export const PROVIDER_TIMEOUT_MS = 15_000;
