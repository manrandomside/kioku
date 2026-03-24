import { generateText } from "ai";

import { PROVIDER_TIMEOUT_MS } from "./config";
import { createLanguageModel, getAvailableProviders } from "./providers";
import type { ProviderName } from "./providers";

export interface AICallOptions {
  system?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AICallResult {
  response: string;
  providerUsed: ProviderName;
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
}

// Call AI providers in waterfall order until one succeeds
export async function callAI(
  prompt: string,
  options?: AICallOptions
): Promise<AICallResult> {
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
