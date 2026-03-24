import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { createOpenAI } from "@ai-sdk/openai";

import { getAIEnv } from "./config";

export type ProviderName = "gemini" | "groq" | "openrouter" | "webllm";

export interface ProviderConfig {
  name: ProviderName;
  model: string;
  available: boolean;
}

// Build the ordered list of available providers based on env vars
export function getAvailableProviders(): ProviderConfig[] {
  const env = getAIEnv();
  const providers: ProviderConfig[] = [];

  if (env.GEMINI_API_KEY) {
    providers.push({
      name: "gemini",
      model: "gemini-2.5-flash-lite-preview-06-17",
      available: true,
    });
  }

  if (env.GROQ_API_KEY) {
    providers.push({
      name: "groq",
      model: "llama-3.3-70b-versatile",
      available: true,
    });
  }

  if (env.OPENROUTER_API_KEY) {
    providers.push({
      name: "openrouter",
      model: "meta-llama/llama-3.3-70b-instruct:free",
      available: true,
    });
  }

  // WebLLM placeholder — browser-only, not available server-side
  // providers.push({ name: "webllm", model: "Llama-3.1-8B-Instruct-q4f16_1-MLC", available: false });

  return providers;
}

// Create Vercel AI SDK language model instances for streaming
export function createLanguageModel(provider: ProviderConfig) {
  const env = getAIEnv();

  switch (provider.name) {
    case "gemini": {
      const google = createGoogleGenerativeAI({
        apiKey: env.GEMINI_API_KEY!,
      });
      return google(provider.model);
    }

    case "groq": {
      const groq = createGroq({
        apiKey: env.GROQ_API_KEY!,
      });
      return groq(provider.model);
    }

    case "openrouter": {
      const openrouter = createOpenAI({
        apiKey: env.OPENROUTER_API_KEY!,
        baseURL: "https://openrouter.ai/api/v1",
      });
      return openrouter(provider.model);
    }

    default:
      throw new Error(`Provider "${provider.name}" tidak didukung di server`);
  }
}
