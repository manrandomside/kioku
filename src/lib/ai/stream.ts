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

export interface ValidatedStream {
  // ReadableStream of text bytes, ready to pipe to a Response body
  body: ReadableStream<Uint8Array>;
  // Resolves with the full response text after stream completes
  fullText: Promise<string>;
  providerUsed: ProviderName;
}

// Stream AI response with proper waterfall fallback.
// Validates each provider by reading the first text chunk before returning,
// so quota errors and invalid models are caught and the next provider is tried.
export async function streamAI(
  prompt: string,
  options?: AIStreamOptions
): Promise<ValidatedStream> {
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

      const result = streamText(params);

      // Validate: read the first text chunk to confirm the provider works.
      // streamText() never throws on creation — errors only surface on consumption.
      const iterator = result.textStream[Symbol.asyncIterator]();
      const first = await iterator.next();

      if (first.done) {
        throw new Error("Provider returned empty response");
      }

      console.log(
        `[AI Stream] Berhasil menggunakan provider: ${provider.name} (${provider.model})`
      );

      // Build a ReadableStream that emits the validated first chunk + remaining chunks
      const encoder = new TextEncoder();
      const stream = new ReadableStream<Uint8Array>({
        async start(controller) {
          controller.enqueue(encoder.encode(first.value));
          try {
            while (true) {
              const { value, done } = await iterator.next();
              if (done) break;
              controller.enqueue(encoder.encode(value));
            }
            controller.close();
          } catch (err) {
            controller.error(err);
          }
        },
      });

      // Tee the stream: one branch for the HTTP response, one to collect full text
      const [responseBranch, collectorBranch] = stream.tee();

      const fullText = (async () => {
        const decoder = new TextDecoder();
        const reader = collectorBranch.getReader();
        let text = "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          text += decoder.decode(value, { stream: true });
        }
        text += decoder.decode();
        return text;
      })();

      return {
        body: responseBranch,
        fullText,
        providerUsed: provider.name,
      };
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
