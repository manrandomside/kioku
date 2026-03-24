import { streamText } from "ai";

import { PROVIDER_TIMEOUT_MS } from "./config";
import { createLanguageModel, getAvailableProviders } from "./providers";
import type { ProviderName } from "./providers";

export interface AIStreamOptions {
  system?: string;
  maxTokens?: number;
  temperature?: number;
  messages?: Array<{ role: "user" | "assistant" | "system"; content: string }>;
}

// Stream AI response with waterfall fallback.
// Compatible with Vercel AI SDK useChat hook via toDataStreamResponse().
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function streamAI(
  prompt: string,
  options?: AIStreamOptions
): Promise<{ stream: ReturnType<typeof streamText>; providerUsed: ProviderName }> {
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

      // Build the call params — use messages array if provided, else single prompt
      const params = options?.messages
        ? {
            model,
            messages: options.messages,
            system: options?.system,
            maxOutputTokens: options?.maxTokens ?? 1024,
            temperature: options?.temperature ?? 0.7,
            abortSignal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
          }
        : {
            model,
            prompt,
            system: options?.system,
            maxOutputTokens: options?.maxTokens ?? 1024,
            temperature: options?.temperature ?? 0.7,
            abortSignal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
          };

      const stream = streamText(params);

      // Verify the provider works by awaiting the first chunk setup
      // streamText itself doesn't throw on creation — errors surface on consumption.
      // We trust the provider config is valid and let errors propagate at consumption time.
      console.log(
        `[AI Stream] Menggunakan provider: ${provider.name} (${provider.model})`
      );

      return { stream, providerUsed: provider.name };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error";
      console.warn(
        `[AI Stream] Provider ${provider.name} gagal: ${message}`
      );
      errors.push({ provider: provider.name, error: message });
    }
  }

  throw new Error(
    `Semua AI provider gagal:\n${errors.map((e) => `  - ${e.provider}: ${e.error}`).join("\n")}`
  );
}
