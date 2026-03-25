import { generateText } from "ai";

import { PROVIDER_TIMEOUT_MS } from "./config";
import { hashPrompt, getCachedResponse, setCacheResponse } from "./cache";
import { createLanguageModel, getAvailableProviders } from "./providers";
import type { ProviderName } from "./providers";

export interface AICallOptions {
  system?: string;
  maxTokens?: number;
  temperature?: number;
  skipCache?: boolean;
  permanentCache?: boolean;
}

export type AICallProviderUsed = ProviderName | "cache";

export interface AICallResult {
  response: string;
  providerUsed: AICallProviderUsed;
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
}

// Call AI providers in waterfall order until one succeeds.
// Checks cache first (unless skipCache is set).
export async function callAI(
  prompt: string,
  options?: AICallOptions
): Promise<AICallResult> {
  // Check cache first
  if (!options?.skipCache) {
    try {
      const promptHash = await hashPrompt(prompt);
      const cached = await getCachedResponse(promptHash);
      if (cached) {
        console.log("[AI Waterfall] Cache hit");
        return {
          response: cached,
          providerUsed: "cache",
          tokensUsed: { prompt: 0, completion: 0, total: 0 },
        };
      }
    } catch {
      // Cache read failed — proceed to providers
    }
  }

  const providers = getAvailableProviders();

  if (providers.length === 0) {
    throw new Error(
      "Tidak ada AI provider yang tersedia. Pastikan minimal satu API key sudah diset."
    );
  }

  const errors: Array<{ provider: ProviderName; error: string }> = [];

  for (const provider of providers) {
    try {
      const model = createLanguageModel(provider);

      const result = await generateText({
        model,
        prompt,
        system: options?.system,
        maxOutputTokens: options?.maxTokens ?? 1024,
        temperature: options?.temperature ?? 0.7,
        abortSignal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
      });

      console.log(
        `[AI Waterfall] Berhasil menggunakan provider: ${provider.name} (${provider.model})`
      );

      // Save to cache in background (fire-and-forget)
      if (!options?.skipCache) {
        setCacheResponse(prompt, result.text, provider.name, {
          permanent: options?.permanentCache,
        }).catch(() => {});
      }

      return {
        response: result.text,
        providerUsed: provider.name,
        tokensUsed: {
          prompt: result.usage?.inputTokens ?? 0,
          completion: result.usage?.outputTokens ?? 0,
          total: result.usage?.totalTokens ?? 0,
        },
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error";
      console.warn(
        `[AI Waterfall] Provider ${provider.name} gagal: ${message}`
      );
      errors.push({ provider: provider.name, error: message });
    }
  }

  throw new Error(
    `Semua AI provider gagal:\n${errors.map((e) => `  - ${e.provider}: ${e.error}`).join("\n")}`
  );
}
